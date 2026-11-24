import type { Session } from "@supabase/supabase-js";
import { AppShell } from "@/components/app-shell";
import { AuthGate } from "@/components/auth-gate";

export default function Home() {
  return <AuthGate>{(session: Session) => <AppShell session={session} />}</AuthGate>;
}
