import type { Background, ButtonRef, Spacing } from "@/lib/sections/types";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SectionButtons } from "./SectionButtons";
import { SectionShell } from "./SectionShell";

export type CtaBannerProps = {
  heading: string;
  body?: string;
  buttons: ButtonRef[];
  background?: Background;
  spacing?: Spacing;
};

export function CtaBanner({
  heading,
  body,
  buttons,
  background = "sand",
  spacing,
}: CtaBannerProps) {
  const dark = background === "ink";
  return (
    <SectionShell background={background} spacing={spacing}>
      <div className="mx-auto flex lg:max-w-[calc(var(--u)*900)] flex-col items-center text-center">
        <SectionHeading heading={heading} onDark={dark} />
        {body ? (
          <p
            className={`mt-5 text-body lg:mt-[calc(var(--u)*24)] ${dark ? "text-ivory/90" : "text-copy"}`}
          >
            {body}
          </p>
        ) : null}
        <SectionButtons
          buttons={buttons}
          className="mt-8 justify-center lg:mt-[calc(var(--u)*36)]"
        />
      </div>
    </SectionShell>
  );
}
