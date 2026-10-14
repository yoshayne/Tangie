import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { OPEN_ADMIN_ID, requireAdmin } from "@/lib/admin/auth";

// Everything in the panel reads the session cookie, so it renders at request time inside Suspense.
async function Guarded({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <AdminShell email={admin.email} open={admin.id === OPEN_ADMIN_ID}>
      {children}
    </AdminShell>
  );
}

export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<div className="p-8 text-stone">Loading…</div>}>
      <Guarded>{children}</Guarded>
    </Suspense>
  );
}
