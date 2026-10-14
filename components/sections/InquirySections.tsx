import { InquiryForm, type FieldDef } from "@/components/site/InquiryForm";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Background, Spacing } from "@/lib/sections/types";
import { SectionShell } from "./SectionShell";

export const INQUIRY_TYPES = [
  "General",
  "Booking / Speaking",
  "Media / Press",
  "Books / Book Club",
  "Collaboration",
];
export const EVENT_TYPES = [
  "Author talk",
  "Book club",
  "Faith-based women's event",
  "Teen & youth",
  "Creative leadership",
  "Panel or conference",
  "Workshop",
  "Other",
];
// TODO(client): confirm the budget ranges before launch.
export const BUDGETS = [
  "Under $1,000",
  "$1,000 – $2,500",
  "$2,500 – $5,000",
  "$5,000+",
  "Not sure yet",
];

type Common = {
  eyebrow?: string;
  heading?: string;
  intro?: string;
  background?: Background;
  spacing?: Spacing;
};

function Wrapper({
  eyebrow,
  heading,
  intro,
  background,
  spacing,
  children,
}: Common & { children: React.ReactNode }) {
  return (
    <SectionShell background={background} spacing={spacing}>
      <div className="lg:max-w-[calc(var(--u)*900)]">
        {heading ? (
          <SectionHeading eyebrow={eyebrow} heading={heading} />
        ) : null}
        {intro ? (
          <p className="mt-5 text-body text-copy lg:mt-[calc(var(--u)*24)]">
            {intro}
          </p>
        ) : null}
        <div
          className={heading || intro ? "mt-10 lg:mt-[calc(var(--u)*48)]" : ""}
        >
          {children}
        </div>
      </div>
    </SectionShell>
  );
}

export type ContactFormProps = Common & { presetType?: string };

export function ContactForm({ presetType, ...rest }: ContactFormProps) {
  const fields: FieldDef[] = [
    {
      name: "firstName",
      label: "First name",
      type: "text",
      required: true,
      half: true,
      autoComplete: "given-name",
    },
    {
      name: "lastName",
      label: "Last name",
      type: "text",
      required: true,
      half: true,
      autoComplete: "family-name",
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      required: true,
      half: true,
      autoComplete: "email",
    },
    {
      name: "phone",
      label: "Phone",
      type: "tel",
      half: true,
      autoComplete: "tel",
    },
    {
      name: "type",
      label: "Inquiry type",
      type: "select",
      required: true,
      options: INQUIRY_TYPES,
      defaultValue: presetType,
    },
    { name: "message", label: "Message", type: "textarea", required: true },
  ];
  return (
    <Wrapper {...rest}>
      <InquiryForm
        fields={fields}
        submitLabel="Send message"
        formName="Contact"
      />
    </Wrapper>
  );
}

export type BookingFormProps = Common;

export function BookingForm(props: BookingFormProps) {
  const fields: FieldDef[] = [
    {
      name: "name",
      label: "Your name",
      type: "text",
      required: true,
      half: true,
      autoComplete: "name",
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      required: true,
      half: true,
      autoComplete: "email",
    },
    {
      name: "phone",
      label: "Phone",
      type: "tel",
      half: true,
      autoComplete: "tel",
    },
    {
      name: "organization",
      label: "Organization",
      type: "text",
      half: true,
      autoComplete: "organization",
    },
    {
      name: "eventType",
      label: "Event type",
      type: "select",
      options: EVENT_TYPES,
      half: true,
    },
    { name: "eventDate", label: "Event date", type: "date", half: true },
    { name: "location", label: "Location", type: "text", half: true },
    { name: "audience", label: "Audience", type: "text", half: true },
    {
      name: "attendance",
      label: "Estimated attendance",
      type: "text",
      half: true,
    },
    {
      name: "budget",
      label: "Budget range (optional)",
      type: "select",
      options: BUDGETS,
      half: true,
    },
    {
      name: "message",
      label: "Tell us about your event",
      type: "textarea",
      required: true,
    },
  ];
  return (
    <Wrapper {...props}>
      <InquiryForm
        fields={fields}
        submitLabel="Send booking request"
        formName="Booking request"
      />
    </Wrapper>
  );
}
