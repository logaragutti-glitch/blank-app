import Link from "next/link";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignInPage({
  searchParams,
}: {
  searchParams: { from?: string; error?: string };
}) {
  async function authenticate(formData: FormData) {
    "use server";

    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: searchParams.from ?? "/dashboard",
      });
    } catch (error) {
      if (error instanceof AuthError) {
        redirect(`/sign-in?error=invalid`);
      }
      throw error;
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">MEM Architect</CardTitle>
          <p className="text-sm text-muted-foreground">Entre para acessar sua organização.</p>
        </CardHeader>
        <CardContent>
          <form action={authenticate} className="flex flex-col gap-3">
            <Input name="email" type="email" placeholder="voce@empresa.com" required />
            <Input name="password" type="password" placeholder="Senha" required minLength={8} />
            {searchParams.error && (
              <p className="text-xs text-destructive">E-mail ou senha inválidos.</p>
            )}
            <Button type="submit" className="mt-1 w-full">
              Entrar
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Ainda não tem conta?{" "}
            <Link href="/sign-up" className="text-accent hover:underline">
              Criar organização
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
