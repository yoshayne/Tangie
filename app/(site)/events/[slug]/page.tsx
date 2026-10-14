import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { EventDetailView } from "@/components/site/EventDetailView";
import { JsonLd } from "@/components/site/JsonLd";
import { PageUnavailable } from "@/components/site/PageUnavailable";
import { SectionRenderer } from "@/components/sections/SectionRenderer";
import { getEventDetail } from "@/lib/data/events";
import { getTemplateSections } from "@/lib/data/template-stack";
import { htmlToText } from "@/lib/html";
import { getSiteUrl } from "@/lib/site-url";

export async function generateMetadata({
  params,
}: PageProps<"/events/[slug]">): Promise<Metadata> {
  await connection();
  const { slug } = await params;
  const event = await getEventDetail(slug).catch(() => null);
  if (!event) return {};
  return {
    title: `${event.title} | Tangie Brickhouse-Beaty`,
    description: event.descriptionHtml
      ? htmlToText(event.descriptionHtml).slice(0, 200)
      : undefined,
    alternates: { canonical: `/events/${event.slug}` },
    openGraph: { images: event.image ? [event.image.src] : undefined },
  };
}

async function EventContent({
  params,
  searchParams,
}: Pick<PageProps<"/events/[slug]">, "params" | "searchParams">) {
  await connection();
  const { slug } = await params;
  let event;
  try {
    event = await getEventDetail(slug);
  } catch (e) {
    console.error("Could not load event:", e);
    return <PageUnavailable />;
  }
  if (!event) notFound();
  const below = await getTemplateSections("event");
  const url = `${getSiteUrl()}/events/${event.slug}`;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Event",
          name: event.title,
          startDate: event.startsAtIso,
          endDate: event.endsAtIso ?? undefined,
          eventStatus: "https://schema.org/EventScheduled",
          eventAttendanceMode: event.isVirtual
            ? "https://schema.org/OnlineEventAttendanceMode"
            : "https://schema.org/OfflineEventAttendanceMode",
          location: event.isVirtual
            ? { "@type": "VirtualLocation", url }
            : {
                "@type": "Place",
                name: event.venueName ?? undefined,
                address: {
                  "@type": "PostalAddress",
                  streetAddress: event.address ?? undefined,
                  addressLocality: event.city ?? undefined,
                  addressRegion: event.state ?? undefined,
                },
              },
          image: event.image
            ? [`${getSiteUrl()}${event.image.src}`]
            : undefined,
          description: event.descriptionHtml
            ? htmlToText(event.descriptionHtml)
            : undefined,
          organizer: { "@type": "Person", name: "Tangie Brickhouse-Beaty" },
          url,
        }}
      />
      <EventDetailView event={event} url={url} />
      <SectionRenderer
        sections={below}
        context={{
          pathname: `/events/${event.slug}`,
          searchParams: await searchParams,
        }}
      />
    </>
  );
}

export default function Page({
  params,
  searchParams,
}: PageProps<"/events/[slug]">) {
  return (
    <Suspense fallback={<div className="min-h-[70vh]" aria-hidden />}>
      <EventContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
