import { requireActiveSession } from "@/lib/session";
import { listClients } from "@/modules/clients/service";
import { Card, CardContent } from "@/components/ui/card";
import { NewClientDialog } from "@/components/clients/new-client-dialog";

export default async function ClientsPage() {
  const { organization } = await requireActiveSession();
  const clients = await listClients(organization.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            {clients.length === 0
              ? "Nenhum cliente cadastrado ainda."
              : `${clients.length} cliente${clients.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <NewClientDialog />
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Cadastre o primeiro cliente para começar a vincular eventos a ele.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Card key={client.id}>
              <CardContent className="flex flex-col gap-1 pt-5">
                <span className="font-medium">{client.name}</span>
                {client.email && <span className="text-sm text-muted-foreground">{client.email}</span>}
                {client.phone && <span className="text-sm text-muted-foreground">{client.phone}</span>}
                <span className="mt-2 text-xs text-muted-foreground">
                  {client._count.events} evento{client._count.events === 1 ? "" : "s"}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
