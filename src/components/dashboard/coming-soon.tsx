import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ComingSoon({ module, sprint }: { module: string; sprint: string }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-base text-foreground">{module}</CardTitle>
          <Badge variant="accent">{sprint}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 text-sm text-muted-foreground">
        Este módulo está planejado para {sprint} — ver <code>docs/ROADMAP.md</code> para o
        escopo completo.
      </CardContent>
    </Card>
  );
}
