import type { NextAuthConfig } from "next-auth";

import type { ActiveOrganization } from "@/modules/auth/types";

/**
 * Config compatível com Edge Runtime — sem Prisma adapter nem providers que usam
 * APIs de Node (ex.: bcryptjs). Consumida pelo middleware (checagem de sessão em
 * toda rota) e estendida por src/lib/auth.ts (config completa, com Credentials +
 * acesso a banco) usada pelas rotas de API e Server Actions.
 */
export const authConfig: NextAuthConfig = {
  pages: { signIn: "/sign-in" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    session({ session, token }) {
      if (session.user && token.userId) {
        session.user.id = token.userId as string;
      }
      session.organization = token.organization as ActiveOrganization | undefined;
      return session;
    },
  },
};
