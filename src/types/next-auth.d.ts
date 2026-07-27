import type { DefaultSession } from "next-auth";
import type { ActiveOrganization } from "@/modules/auth/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
    organization?: ActiveOrganization;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    organization?: ActiveOrganization;
  }
}
