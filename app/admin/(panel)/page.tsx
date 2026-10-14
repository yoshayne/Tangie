import Link from "next/link";
import { and, count, desc, asc, eq, gte } from "drizzle-orm";
import { Card, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { getDb, schema } from "@/lib/db";
import { emailConfigured, newsletterConfigured } from "@/lib/email/brevo";
import { redisConfigured } from "@/lib/forms/rate-limit";
import { turnstileEnabled } from "@/lib/forms/turnstile";

function Stat({
  label,
  value,
  href,
}: {
  label: string;
  value: React.ReactNode;
  href?: string;
}) {
  const inner = (
    <div className="border border-line bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bronze">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl text-heading">{value}</p>
    </div>
  );
  return href ? (
    <Link href={href} className="block hover:opacity-90">
      {inner}
    </Link>
  ) : (
    inner
  );
}

export default async function Dashboard() {
  await requireAdmin();
  const db = getDb();
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const [[newInquiries], [subsMonth], [subsTotal], nextEvent, latestPost] =
    await Promise.all([
      db
        .select({ n: count() })
        .from(schema.inquiries)
        .where(eq(schema.inquiries.status, "new")),
      db
        .select({ n: count() })
        .from(schema.subscribers)
        .where(gte(schema.subscribers.createdAt, monthStart)),
      db.select({ n: count() }).from(schema.subscribers),
      db
        .select()
        .from(schema.events)
        .where(
          and(
            eq(schema.events.published, true),
            gte(schema.events.startsAt, new Date()),
          ),
        )
        .orderBy(asc(schema.events.startsAt))
        .limit(1),
      db
        .select()
        .from(schema.posts)
        .orderBy(desc(schema.posts.publishedAt))
        .limit(1),
    ]);

  const services: Array<[string, boolean, string]> = [
    [
      "Email (Brevo)",
      emailConfigured(),
      "Contact and booking forms send email",
    ],
    [
      "Newsletter (Brevo)",
      newsletterConfigured(),
      "Mailing list signup sends a confirmation email",
    ],
    [
      "Spam check (Turnstile)",
      turnstileEnabled(),
      "Cloudflare human check on forms",
    ],
    [
      "Rate limiting (Redis)",
      redisConfigured(),
      "Limits repeated form submissions",
    ],
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="A quick look at what's happening on the site."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="New inquiries"
          value={newInquiries.n}
          href="/admin/inquiries?status=new"
        />
        <Stat
          label="Subscribers this month"
          value={subsMonth.n}
          href="/admin/subscribers"
        />
        <Stat
          label="Total subscribers"
          value={subsTotal.n}
          href="/admin/subscribers"
        />
        <Stat
          label="Next event"
          value={
            <span className="text-xl">
              {nextEvent[0] ? nextEvent[0].title : "None scheduled"}
            </span>
          }
          href={
            nextEvent[0]
              ? `/admin/events/${nextEvent[0].id}`
              : "/admin/events/new"
          }
        />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card title="Latest journal post">
          {latestPost[0] ? (
            <p>
              <Link
                href={`/admin/journal/${latestPost[0].id}`}
                className="font-semibold text-bronze underline"
              >
                {latestPost[0].title}
              </Link>
              <span className="block text-sm text-stone">
                {latestPost[0].status === "published" ? "Published" : "Draft"}
              </span>
            </p>
          ) : (
            <p className="text-stone">
              No posts yet.{" "}
              <Link href="/admin/journal/new" className="text-bronze underline">
                Write one
              </Link>
            </p>
          )}
        </Card>
        <Card title="Services">
          <ul className="space-y-2 text-sm">
            {services.map(([name, on, what]) => (
              <li key={name} className="flex items-start gap-2">
                <span
                  className={`mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full ${on ? "bg-[#2f6b3a]" : "bg-[#c9c3b8]"}`}
                />
                <span>
                  <span className="font-semibold">{name}</span>:{" "}
                  {on ? "on" : "not set up yet"}{" "}
                  <span className="text-stone">({what})</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
