import { cacheLife } from "next/cache";
import Link from "next/link";
import { Wordmark } from "@/components/ui/Wordmark";
import type { NavItem, SocialLink } from "@/lib/site-data";
import { SocialIcon } from "./SocialIcon";

async function getYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export async function Footer({
  nav,
  social,
  affiliates,
}: {
  nav: NavItem[];
  social: SocialLink[];
  affiliates: NavItem[];
}) {
  const year = await getYear();
  return (
    <footer className="bg-ink text-ivory">
      <div className="mx-auto max-w-[1440px] px-4 pb-8 pt-10 md:px-6 lg:flex lg:min-h-[calc(var(--u)*186)] lg:flex-col lg:justify-center lg:px-[calc(var(--u)*83)] lg:py-[calc(var(--u)*20)]">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Wordmark light />
            <ul className="mt-5 flex items-center gap-[22px] lg:mt-[calc(var(--u)*28)] lg:gap-[calc(var(--u)*30)]">
              {social
                .filter((s) => s.href)
                .map((s) => (
                  <li key={s.key}>
                    <a
                      href={s.href!}
                      aria-label={s.label}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-ivory/85 transition-colors duration-200 hover:text-bronze-light"
                    >
                      <SocialIcon name={s.key} />
                    </a>
                  </li>
                ))}
            </ul>
          </div>
          <div className="flex flex-col gap-5 lg:items-end lg:gap-[calc(var(--u)*40)] lg:pt-[calc(var(--u)*14)]">
            <nav aria-label="Footer">
              <ul className="flex flex-wrap gap-x-7 gap-y-3 text-[13px] font-medium lg:gap-x-[calc(var(--u)*40)] lg:text-[calc(var(--u)*15)]">
                {nav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="transition-colors duration-200 hover:text-bronze-light"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="flex flex-col gap-3 text-[12px] text-ivory/55 lg:flex-row lg:items-center lg:gap-[calc(var(--u)*40)] lg:text-[calc(var(--u)*13)]">
              <p>© {year} Tangie Brickhouse-Beaty. All rights reserved.</p>
              <p className="flex items-center gap-3">
                <Link href="/privacy" className="hover:text-bronze-light">
                  Privacy Policy
                </Link>
                <span aria-hidden className="h-3 w-px bg-ivory/30" />
                <Link href="/terms" className="hover:text-bronze-light">
                  Terms
                </Link>
              </p>
              <p className="flex flex-wrap gap-x-4 gap-y-1 lg:gap-x-[calc(var(--u)*20)]">
                {affiliates.map((a) => (
                  <a
                    key={a.href}
                    href={a.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-bronze-light"
                  >
                    {a.label}
                  </a>
                ))}
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
