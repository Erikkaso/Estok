import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { requirePageAuth } from "@/lib/auth";

async function AuthenticatedShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePageAuth();
  return <AppShell user={user}>{children}</AppShell>;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC]" />}>
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </Suspense>
  );
}
