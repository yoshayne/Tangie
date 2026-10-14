import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin/auth";

// The page editor uses the whole screen, so it has no sidebar.
async function Guarded({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}

export default function BuilderLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense
      fallback={<div className="p-8 text-stone">Loading the editor…</div>}
    >
      <Guarded>{children}</Guarded>
    </Suspense>
  );
}
