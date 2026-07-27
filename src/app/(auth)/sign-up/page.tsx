import Link from "next/link";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { signIn } from "@/lib/auth";
import { signUpSchema } from "@/modules/auth/schema";
import { signUp } from "@/modules/auth/service";
import { ConflictError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: signUpError } = await searchParams;

  async function register(formData: FormData) {
    "use server";

    const parsed = signUpSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      organizationName: formData.get("organizationName"),
    });

    if (!parsed.success) {
      redirect(`/sign-up?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "invalid")}`);
    }

    try {
      await signUp(parsed.data);
    } catch (error) {
      if (error instanceof ConflictError) {
        redirect(`/sign-up?error=${encodeURIComponent(error.message)}`);
      }
      throw error;
    }

    try {
      await signIn("credentials", {
        email: parsed.data.email,
        password: parsed.data.password,
        redirectTo: "/dashboard",
      });
    } catch (error) {
      if (error instanceof AuthError) {
        redirect("/sign-in");
      }
      throw error;
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Criar conta</CardTitle>
          <p className="text-sm text-muted-foreground">
            Comece sua organização no MEM Architect.
          </p>
        </CardHeader>
        <CardContent>
          <form action={register} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Seu nome</Label>
              <Input id="name" name="name" required placeholder="Maria Silva" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="organizationName">Nome da produtora</Label>
              <Input
                id="organizationName"
                name="organizationName"
                required
                placeholder="MEM Demo Produtora"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" required placeholder="voce@empresa.com" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" required minLength={8} />
            </div>
            {signUpError && <p className="text-xs text-destructive">{signUpError}</p>}
            <Button type="submit" className="mt-1 w-full">
              Criar conta
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Já tem conta?{" "}
            <Link href="/sign-in" className="text-accent hover:underline">
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
