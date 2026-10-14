import Link from "next/link";
import { logout } from "@/app/admin/actions-auth";

const NAV: Array<{ label: string; href: string; group?: string }> = [
  { label: "Dashboard", href: "/admin" },
  { label: "Pages", href: "/admin/pages", group: "Content" },
  { label: "Books", href: "/admin/books", group: "Content" },
  { label: "Events", href: "/admin/events", group: "Content" },
  { label: "Journal", href: "/admin/journal", group: "Content" },
  { label: "Film & Theater", href: "/admin/credits", group: "Content" },
  { label: "Speaking Topics", href: "/admin/topics", group: "Content" },
  { label: "Testimonials", href: "/admin/testimonials", group: "Content" },
  { label: "Inquiries", href: "/admin/inquiries", group: "People" },
  { label: "Subscribers", href: "/admin/subscribers", group: "People" },
  { label: "Media Library", href: "/admin/media", group: "Site" },
  { label: "Navigation", href: "/admin/navigation", group: "Site" },
  { label: "Site Settings", href: "/admin/settings", group: "Site" },
];

/** Sidebar + header for every admin screen. Works on a phone: the menu folds into a dropdown. */
export function AdminShell({
  email,
  open = false,
  children,
}: {
  email: string;
  open?: boolean;
  children: React.ReactNode;
}) {
  const groups = ["", "Content", "People", "Site"];
  const nav = (
    <nav aria-label="Admin" className="space-y-5">
      {groups.map((g) => (
        <div key={g || "top"}>
          {g ? (
            <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ivory/50">
              {g}
            </p>
          ) : null}
          <ul>
            {NAV.filter((n) => (n.group ?? "") === g).map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  className="block px-3 py-2 text-sm text-ivory/90 hover:bg-white/10"
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="lg:flex">
      <aside className="hidden w-60 shrink-0 bg-ink px-2 py-6 lg:block lg:min-h-screen">
        <p className="mb-6 px-3 font-display text-2xl text-ivory">
          Tangie{" "}
          <span className="text-xs uppercase tracking-[0.2em] text-ivory/50">
            admin
          </span>
        </p>
        {nav}
      </aside>
      <div className="min-w-0 flex-1">
        {open ? (
          <p
            role="note"
            className="bg-[#fff6e5] px-4 py-2 text-center text-sm text-[#8a5a00] lg:px-8"
          >
            The admin is <strong>open</strong>: anyone who knows this address
            can edit the site. Ask your developer to set the password before
            launch.
          </p>
        ) : null}
        <header className="flex items-center justify-between gap-4 border-b border-line bg-white px-4 py-3 lg:px-8">
          <details className="relative lg:hidden">
            <summary className="cursor-pointer list-none px-3 py-2 text-sm font-semibold">
              Menu ☰
            </summary>
            <div className="absolute left-0 top-full z-30 w-64 bg-ink px-2 py-4 shadow-lg">
              {nav}
            </div>
          </details>
          <Link
            href="/"
            target="_blank"
            className="hidden text-sm text-bronze lg:block"
          >
            View site ↗
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-stone sm:inline">{email}</span>
            {open ? null : (
              <form action={logout}>
                <button
                  type="submit"
                  className="border border-line px-3 py-1.5 hover:bg-ivory"
                >
                  Sign out
                </button>
              </form>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
