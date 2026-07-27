import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "MEM Architect",
  description: "O primeiro Sistema Operacional para Empresas de Eventos — MEM Technologies.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
