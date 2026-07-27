import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { Sidebar, MobileTabBar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar
          userName={session.user.name ?? session.user.email ?? "Usuário"}
          organizationName={session.organization?.name ?? "Sem organização"}
        />
        <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6">{children}</main>
      </div>
      <MobileTabBar />
    </div>
  );
}
