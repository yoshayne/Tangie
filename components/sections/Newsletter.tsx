import Image from "next/image";
import { renderInline } from "@/lib/inline";
import { blurProps, imageStyle, type ImageRef } from "@/lib/sections/types";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { NewsletterForm } from "@/components/site/NewsletterForm";

export type NewsletterProps = {
  eyebrow: string;
  heading: string;
  body: string;
  buttonLabel: string;
  successMessage: string;
  image?: ImageRef;
};

export function Newsletter({
  eyebrow,
  heading,
  body,
  buttonLabel,
  successMessage,
  image,
}: NewsletterProps) {
  return (
    <section className="relative overflow-hidden bg-sand lg:h-[calc(var(--u)*280)]">
      {image ? (
        <div className="absolute inset-y-0 left-0 hidden w-[calc(var(--gutter-x)+var(--u)*720)] lg:block">
          <Image
            src={image.src}
            {...blurProps(image)}
            alt={image.alt}
            fill
            sizes="50vw"
            className="object-contain object-left opacity-50"
            style={imageStyle(image)}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-sand" />
        </div>
      ) : null}
      <div className="relative px-4 py-14 md:px-6 lg:flex lg:h-full lg:items-center lg:py-0 lg:pt-[calc(var(--u)*16)] lg:pl-[calc(var(--gutter-x)+var(--u)*716)] lg:pr-[calc(var(--gutter-x)+var(--u)*81)]">
        <div className="w-full">
          <SectionHeading eyebrow={eyebrow} heading={heading} size="compact" />
          <p className="mt-3 text-body text-copy lg:mt-[calc(var(--u)*14)]">
            {renderInline(body)}
          </p>
          <div className="mt-5 lg:mt-[calc(var(--u)*24)]">
            <NewsletterForm
              buttonLabel={buttonLabel}
              successMessage={successMessage}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
