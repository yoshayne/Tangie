import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PageEditor } from "@/components/admin/builder/PageEditor";
import { createPreviewToken, requireAdmin } from "@/lib/admin/auth";
import { getDb, schema } from "@/lib/db";
import { knownPaths, loadWorkingDoc } from "@/lib/page-builder/server";

export default async function EditPage({
  params,
}: PageProps<"/admin/pages/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const working = await loadWorkingDoc(id);
  if (!working) notFound();

  const [paths, books] = await Promise.all([
    knownPaths(),
    getDb()
      .select({ slug: schema.books.slug, title: schema.books.title })
      .from(schema.books)
      .where(eq(schema.books.published, true))
      .orderBy(asc(schema.books.sortOrder)),
  ]);

  return (
    <PageEditor
      pageId={id}
      initialDoc={working.doc}
      hasDraft={working.hasDraft}
      published={working.page.status === "published"}
      isSystem={working.page.isSystem}
      isTemplate={working.page.slug.startsWith("_template")}
      previewToken={await createPreviewToken(id)}
      ctx={{
        pages: [...paths].filter((p) => !p.startsWith("/_template")).sort(),
        books: books.map((b) => [b.slug, b.title]),
      }}
    />
  );
}
