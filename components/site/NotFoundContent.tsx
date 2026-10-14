import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";

export function NotFoundContent() {
  return (
    <section className="bg-ivory px-4 pb-24 pt-20 md:px-6 lg:px-[calc(var(--u)*120)] lg:pb-[calc(var(--u)*160)] lg:pt-[calc(var(--u)*160)]">
      <div className="mx-auto max-w-[1440px]">
        <Eyebrow>Page not found</Eyebrow>
        <h1 className="mt-5 font-display text-page-h1 font-normal text-heading">
          This page isn&apos;t here.
        </h1>
        <p className="mt-6 lg:max-w-[calc(var(--u)*640)] text-lead text-copy">
          The link may be out of date, or the page may have moved. Try one of
          these instead.
        </p>
        <div className="mt-10 flex flex-wrap gap-3 lg:gap-[calc(var(--u)*18)]">
          <Button href="/">Home</Button>
          <Button href="/books" variant="outline">
            Books
          </Button>
          <Button href="/events" variant="outline">
            Events
          </Button>
          <Button href="/journal" variant="outline">
            Journal
          </Button>
          <Button href="/contact" variant="outline">
            Contact
          </Button>
        </div>
      </div>
    </section>
  );
}
