import type { Metadata } from "next";
import type { ReactNode } from "react";
import { colors, fonts } from "@eve-os/ui";
import { AuthProvider } from "../lib/auth-context";

export const metadata: Metadata = {
  title: "EVE OS",
  description: "EVE OS platform",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          backgroundColor: colors.background,
          color: colors.textPrimary,
          fontFamily: fonts.body,
        }}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
