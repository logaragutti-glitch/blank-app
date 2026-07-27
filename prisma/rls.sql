-- MEM Architect — Row Level Security por tenant
--
-- Segunda camada de isolamento além do filtro `organizationId` obrigatório na
-- camada de serviço (ver docs/ARCHITECTURE.md §4 e src/lib/tenant.ts). Toda
-- transação de aplicação chama `SELECT set_config('app.org_id', $1, true)`
-- antes de qualquer query (ver src/lib/db.ts `withTenant`); sem esse setting,
-- as policies abaixo não liberam nenhuma linha.
--
-- Este script não é rodado por `prisma migrate` automaticamente — é aplicado
-- manualmente (ou via um script de deploy) depois das migrations, porque
-- Prisma não modela RLS nativamente. Rode com:
--   psql "$DATABASE_URL" -f prisma/rls.sql
--
-- IMPORTANTE: o dono da tabela (role que rodou as migrations, tipicamente
-- `postgres`) ignora RLS por padrão no Postgres. Em produção a aplicação deve
-- se conectar com uma role separada (não-superuser, sem BYPASSRLS) que só tem
-- GRANT de select/insert/update/delete — nunca com a role usada para migrar o
-- schema. Isolamento validado manualmente: com uma role não-owner, uma query
-- sem `app.org_id` setado retorna 0 linhas, e com `app.org_id` setado só
-- retorna linhas do tenant correspondente (ver docs/DATABASE.md).

-- ─── Tabelas com organization_id direto ────────────────────────────────────

alter table "clients" enable row level security;
alter table "events" enable row level security;
alter table "templates" enable row level security;
alter table "activities" enable row level security;
alter table "ai_generation_logs" enable row level security;
alter table "invitations" enable row level security;
alter table "memberships" enable row level security;
alter table "ai_rate_limit_hits" enable row level security;

create policy tenant_isolation on "clients"
  using ("organizationId" = current_setting('app.org_id', true));

create policy tenant_isolation on "events"
  using ("organizationId" = current_setting('app.org_id', true));

create policy tenant_isolation on "templates"
  using ("organizationId" = current_setting('app.org_id', true) or "organizationId" is null);

create policy tenant_isolation on "activities"
  using ("organizationId" = current_setting('app.org_id', true));

create policy tenant_isolation on "ai_generation_logs"
  using ("organizationId" = current_setting('app.org_id', true));

create policy tenant_isolation on "invitations"
  using ("organizationId" = current_setting('app.org_id', true));

create policy tenant_isolation on "memberships"
  using ("organizationId" = current_setting('app.org_id', true));

create policy tenant_isolation on "ai_rate_limit_hits"
  using ("organizationId" = current_setting('app.org_id', true));

-- ─── Tabelas filhas de Event (isolamento via join) ─────────────────────────

alter table "interview_sessions" enable row level security;
alter table "interview_answers" enable row level security;
alter table "documents" enable row level security;
alter table "checklist_items" enable row level security;
alter table "budget_lines" enable row level security;
alter table "timeline_items" enable row level security;
alter table "mem_scores" enable row level security;

create policy tenant_isolation on "interview_sessions"
  using (exists (
    select 1 from "events" e
    where e."id" = "interview_sessions"."eventId"
      and e."organizationId" = current_setting('app.org_id', true)
  ));

create policy tenant_isolation on "interview_answers"
  using (exists (
    select 1 from "interview_sessions" s
    join "events" e on e."id" = s."eventId"
    where s."id" = "interview_answers"."interviewSessionId"
      and e."organizationId" = current_setting('app.org_id', true)
  ));

create policy tenant_isolation on "documents"
  using (exists (
    select 1 from "events" e
    where e."id" = "documents"."eventId"
      and e."organizationId" = current_setting('app.org_id', true)
  ));

create policy tenant_isolation on "checklist_items"
  using (exists (
    select 1 from "events" e
    where e."id" = "checklist_items"."eventId"
      and e."organizationId" = current_setting('app.org_id', true)
  ));

create policy tenant_isolation on "budget_lines"
  using (exists (
    select 1 from "events" e
    where e."id" = "budget_lines"."eventId"
      and e."organizationId" = current_setting('app.org_id', true)
  ));

create policy tenant_isolation on "timeline_items"
  using (exists (
    select 1 from "events" e
    where e."id" = "timeline_items"."eventId"
      and e."organizationId" = current_setting('app.org_id', true)
  ));

create policy tenant_isolation on "mem_scores"
  using (exists (
    select 1 from "events" e
    where e."id" = "mem_scores"."eventId"
      and e."organizationId" = current_setting('app.org_id', true)
  ));

-- `users` e `organizations` não recebem policy de tenant: um User pode
-- pertencer a múltiplas organizações (ver docs/DATABASE.md) e a query que
-- resolve qual organização está ativa acontece antes de `app.org_id` existir.
-- O acesso a essas tabelas continua controlado pela camada de serviço.
