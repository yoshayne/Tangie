import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin | Tangie Brickhouse-Beaty",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-screen bg-[#f6f4f0] text-[15px] text-charcoal">
      {children}
    </div>
  );
}
