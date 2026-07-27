import { requireActiveSession } from "@/lib/session";
import { listMembers, listPendingInvitations } from "@/modules/organizations/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InviteMemberDialog } from "@/components/settings/invite-member-dialog";

export default async function SettingsPage() {
  const { organization } = await requireActiveSession();
  const [members, pendingInvitations] = await Promise.all([
    listMembers(organization.id),
    listPendingInvitations(organization.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
          <p className="text-sm text-muted-foreground">{organization.name}</p>
        </div>
        <InviteMemberDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membros</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-0">
          {members.map((membership) => (
            <div key={membership.id} className="flex items-center justify-between text-sm">
              <div className="flex flex-col">
                <span className="font-medium">{membership.user.name ?? membership.user.email}</span>
                <span className="text-xs text-muted-foreground">{membership.user.email}</span>
              </div>
              <Badge variant={membership.role === "OWNER" ? "accent" : "default"}>
                {membership.role}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Convites pendentes</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-0">
            {pendingInvitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between text-sm">
                <span>{invitation.email}</span>
                <Badge variant="warning">Aguardando cadastro · {invitation.role}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
