import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Design System</h1>
        <p className="text-sm text-muted-foreground">
          Style guide vivo — todo componente novo deve aparecer aqui antes de ser usado em
          produto. Ver <code>docs/DESIGN_SYSTEM.md</code>.
        </p>
      </div>

      <Section title="Button">
        <Button variant="primary">Primário</Button>
        <Button variant="secondary">Secundário</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destrutivo</Button>
        <Button variant="primary" disabled>
          Desabilitado
        </Button>
      </Section>

      <Section title="Badge">
        <Badge>Default</Badge>
        <Badge variant="accent">Accent</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="destructive">Destructive</Badge>
      </Section>

      <Section title="Input">
        <Input placeholder="Nome do evento" className="max-w-xs" />
      </Section>

      <Section title="Avatar">
        <Avatar>
          <AvatarFallback>MA</AvatarFallback>
        </Avatar>
      </Section>

      <Section title="Progress">
        <Progress value={72} className="max-w-xs" />
      </Section>

      <Section title="Card">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>MEM Score</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <span className="text-3xl font-semibold">82</span>
          </CardContent>
        </Card>
      </Section>
    </div>
  );
}
