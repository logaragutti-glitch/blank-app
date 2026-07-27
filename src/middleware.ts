import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/lib/auth.config";

// Instância separada da config completa (src/lib/auth.ts): o middleware roda em
// Edge Runtime e authConfig não carrega Prisma/bcryptjs, que exigem Node APIs.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isAuthenticated = !!req.auth;
  const isAuthRoute =
    req.nextUrl.pathname.startsWith("/sign-in") || req.nextUrl.pathname.startsWith("/sign-up");

  if (!isAuthenticated && !isAuthRoute) {
    const signInUrl = new URL("/sign-in", req.nextUrl.origin);
    signInUrl.searchParams.set("from", req.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  // Protege todas as rotas exceto assets estáticos, API de auth e a rota de API pública.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
