import { Button } from "@eve-os/ui";

export default function AdminHomePage() {
  return (
    <main style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>EVE OS Admin</h1>
      <p>Admin console scaffold — Sprint 0.</p>
      <Button variant="ghost">Sign in</Button>
    </main>
  );
}
