#!/usr/bin/env bash
# Verifica que o isolamento por tenant (prisma/rls.sql) funciona de verdade,
# não só que os `CREATE POLICY` rodaram sem erro. Usa uma role SEM privilégio
# de owner (o cenário de produção — a role de deploy/migração nunca deve ser a
# mesma usada pela aplicação, ver prisma/rls.sql) para provar que:
#   1. sem `app.org_id` setado, uma query não retorna nenhuma linha
#   2. com `app.org_id` setado, só retorna linhas do tenant correspondente
#
# Uso: DATABASE_URL=postgresql://... ./scripts/verify-rls.sh
# Sem DATABASE_URL, usa o Postgres local padrão de desenvolvimento.

set -euo pipefail

DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/mem_architect}"
TEST_ROLE="mem_rls_verify_$$"
ORG_A="rls_verify_org_a_$$"
ORG_B="rls_verify_org_b_$$"

cleanup() {
  psql "$DATABASE_URL" -v ON_ERROR_STOP=0 -q <<SQL > /dev/null 2>&1 || true
delete from clients where "organizationId" in ('$ORG_A', '$ORG_B');
delete from organizations where id in ('$ORG_A', '$ORG_B');
revoke all on all tables in schema public from $TEST_ROLE;
revoke usage on schema public from $TEST_ROLE;
drop role if exists $TEST_ROLE;
SQL
}
trap cleanup EXIT

echo "==> Preparando role de teste sem privilégio de owner…"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q <<SQL
create role $TEST_ROLE login password 'rls_verify' noinherit;
grant usage on schema public to $TEST_ROLE;
grant select, insert, update, delete on all tables in schema public to $TEST_ROLE;
SQL

echo "==> Inserindo dados de dois tenants…"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q <<SQL
insert into organizations (id, name, slug, "createdAt", "updatedAt")
  values ('$ORG_A', 'RLS Verify Org A', '$ORG_A', now(), now());
insert into organizations (id, name, slug, "createdAt", "updatedAt")
  values ('$ORG_B', 'RLS Verify Org B', '$ORG_B', now(), now());
insert into clients (id, name, "organizationId", "createdAt", "updatedAt")
  values ('${ORG_A}_client', 'Cliente A', '$ORG_A', now(), now());
insert into clients (id, name, "organizationId", "createdAt", "updatedAt")
  values ('${ORG_B}_client', 'Cliente B', '$ORG_B', now(), now());
SQL

TEST_ROLE_URL=$(echo "$DATABASE_URL" | sed -E "s#//[^:]+:[^@]+@#//$TEST_ROLE:rls_verify@#")

echo "==> [1/3] Sem app.org_id setado — esperado: 0 linhas"
COUNT_NONE=$(psql "$TEST_ROLE_URL" -tA -c "select count(*) from clients where \"organizationId\" in ('$ORG_A', '$ORG_B');")
if [ "$COUNT_NONE" != "0" ]; then
  echo "FALHOU: esperava 0 linhas sem app.org_id, obteve $COUNT_NONE"
  exit 1
fi
echo "    OK ($COUNT_NONE linhas)"

echo "==> [2/3] app.org_id = Org A — esperado: só o cliente de A"
RESULT_A=$(psql "$TEST_ROLE_URL" -tA -c "select set_config('app.org_id', '$ORG_A', false); select name from clients where \"organizationId\" in ('$ORG_A', '$ORG_B');" | tail -n1)
if [ "$RESULT_A" != "Cliente A" ]; then
  echo "FALHOU: esperava só 'Cliente A', obteve: $RESULT_A"
  exit 1
fi
echo "    OK ($RESULT_A)"

echo "==> [3/3] app.org_id = Org B — esperado: só o cliente de B"
RESULT_B=$(psql "$TEST_ROLE_URL" -tA -c "select set_config('app.org_id', '$ORG_B', false); select name from clients where \"organizationId\" in ('$ORG_A', '$ORG_B');" | tail -n1)
if [ "$RESULT_B" != "Cliente B" ]; then
  echo "FALHOU: esperava só 'Cliente B', obteve: $RESULT_B"
  exit 1
fi
echo "    OK ($RESULT_B)"

echo ""
echo "RLS verificada: isolamento por tenant funciona com uma role não-owner."
