import { getPage, type PageData } from "./pages";

export type TemplateKind = "book" | "event" | "post";

/**
 * The editable "below the content" section stack shared by every book, event or journal post.
 * It is stored as a hidden page (slug `_template/<kind>`) so it can be edited like any other page.
 */
export async function getTemplateSections(
  kind: TemplateKind,
): Promise<PageData["sections"]> {
  const page = await getPage(`_template/${kind}`).catch(() => null);
  return page?.sections ?? [];
}
