import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin/auth";

// Everything in the panel reads the session cookie, so it renders at request time inside Suspense.
async function Guarded({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return <AdminShell email={admin.email}>{children}</AdminShell>;
}

export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<div className="p-8 text-stone">Loading…</div>}>
      <Guarded>{children}</Guarded>
    </Suspense>
  );
}
