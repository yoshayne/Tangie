import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { SectionRenderer } from "@/components/sections/SectionRenderer";
import { PreviewBridge } from "@/components/site/PreviewBridge";
import { getAdmin, verifyPreviewToken } from "@/lib/admin/auth";
import { cleanSection, loadWorkingDoc } from "@/lib/page-builder/server";

export const metadata: Metadata = {
  title: "Preview",
  robots: { index: false, follow: false },
};

async function Preview({
  params,
  searchParams,
}: Pick<PageProps<"/preview/[pageId]">, "params" | "searchParams">) {
  await connection();
  const { pageId } = await params;
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : undefined;

  // Needs both the admin's session and a fresh signed link for this exact page.
  if (!(await getAdmin()) || !(await verifyPreviewToken(token, pageId)))
    notFound();
  if (!/^[0-9a-f-]{36}$/i.test(pageId)) notFound();

  const working = await loadWorkingDoc(pageId);
  if (!working) notFound();
  const slug = working.page.slug;

  return (
    <>
      <PreviewBridge />
      <SectionRenderer
        preview
        sections={working.doc.sections.map(cleanSection)}
        context={{
          pathname: slug && !slug.startsWith("_template") ? `/${slug}` : "/",
          searchParams: {},
        }}
      />
    </>
  );
}

export default function PreviewPage(props: PageProps<"/preview/[pageId]">) {
  return (
    <Suspense fallback={<div className="min-h-[70vh]" aria-hidden />}>
      <Preview params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}
