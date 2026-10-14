import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { deleteTestimonial } from "@/app/admin/actions-small";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { TestimonialForm } from "@/components/admin/SmallForms";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { getDb, schema } from "@/lib/db";
import { getMediaById } from "@/lib/media/refs";

export default async function EditTestimonial({
  params,
}: PageProps<"/admin/testimonials/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (id === "new")
    return (
      <>
        <PageHeader title="Add a testimonial" />
        <TestimonialForm
          id={null}
          portrait={null}
          defaults={{ context: "speaking", sortOrder: 0 }}
        />
      </>
    );
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [t] = await getDb()
    .select()
    .from(schema.testimonials)
    .where(eq(schema.testimonials.id, id));
  if (!t) notFound();
  const p = await getMediaById(t.portraitMediaId);
  return (
    <>
      <PageHeader title={t.name} />
      <TestimonialForm
        id={id}
        portrait={p ? { id: p.id, url: p.url, alt: p.alt } : null}
        defaults={t}
      />
      <div className="mt-10 border-t border-line pt-6">
        <DeleteButton
          action={deleteTestimonial.bind(null, id)}
          label="Delete this testimonial"
          confirmText="Delete this testimonial?"
        />
      </div>
    </>
  );
}
