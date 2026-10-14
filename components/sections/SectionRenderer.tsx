import type { ReactNode } from "react";
import { isSectionType, registry } from "@/lib/sections/registry";

export type RenderableSection = {
  id: string;
  type: string;
  props: Record<string, unknown>;
  anchorId?: string | null;
  hidden?: boolean;
};

function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="border border-[#9b2c2c] bg-[#fdf1f1] px-4 py-3 text-sm text-[#9b2c2c]">
      {children}
    </div>
  );
}

/**
 * Renders a page's section stack. Each section's props are validated against its schema:
 * invalid content renders nothing on the live site and a red notice in preview.
 */
export async function SectionRenderer({
  sections,
  preview = false,
}: {
  sections: RenderableSection[];
  preview?: boolean;
}) {
  const out: ReactNode[] = [];

  for (const section of sections) {
    if (section.hidden) continue;

    if (!isSectionType(section.type)) {
      if (preview)
        out.push(
          <Notice key={section.id}>
            Unknown section type: {section.type}
          </Notice>,
        );
      continue;
    }

    // The registry is a union of differently typed entries, so narrow it to a common shape here.
    const entry = registry[section.type] as {
      schema: {
        safeParse: (v: unknown) => {
          success: boolean;
          data?: unknown;
          error?: { message: string };
        };
      };
      load?: (p: unknown) => Promise<unknown>;
      render: (p: unknown, extra: unknown) => ReactNode;
    };
    const parsed = entry.schema.safeParse(section.props);
    if (!parsed.success) {
      console.error(
        `Invalid props for ${section.type} (${section.id}):`,
        parsed.error?.message,
      );
      if (preview) {
        out.push(
          <Notice key={section.id}>
            {section.type} has invalid content: {parsed.error?.message}
          </Notice>,
        );
      }
      continue;
    }

    let extra: unknown;
    try {
      extra = entry.load ? await entry.load(parsed.data) : undefined;
    } catch (e) {
      // One section's data failing (for example the events query) must not take down the page.
      console.error(
        `Could not load data for ${section.type} (${section.id}):`,
        e,
      );
      if (preview)
        out.push(
          <Notice key={section.id}>
            {section.type}: could not load its data
          </Notice>,
        );
      continue;
    }
    const node = entry.render(parsed.data, extra);
    out.push(
      section.anchorId ? (
        <div key={section.id} id={section.anchorId} className="scroll-mt-24">
          {node}
        </div>
      ) : (
        <div key={section.id} className="contents">
          {node}
        </div>
      ),
    );
  }

  return <>{out}</>;
}
