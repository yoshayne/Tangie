import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { deleteCredit } from "@/app/admin/actions-small";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { CreditForm } from "@/components/admin/SmallForms";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { getDb, schema } from "@/lib/db";
import { getMediaById } from "@/lib/media/refs";

export default async function EditCredit({
  params,
}: PageProps<"/admin/credits/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (id === "new")
    return (
      <>
        <PageHeader title="Add a credit" />
        <CreditForm
          id={null}
          image={null}
          defaults={{ category: "stage", sortOrder: 0 }}
        />
      </>
    );
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [c] = await getDb()
    .select()
    .from(schema.credits)
    .where(eq(schema.credits.id, id));
  if (!c) notFound();
  const img = await getMediaById(c.imageMediaId);
  return (
    <>
      <PageHeader title={c.title} />
      <CreditForm
        id={id}
        image={img ? { id: img.id, url: img.url, alt: img.alt } : null}
        defaults={{ ...c, roles: c.roles.join(", "), watchLinks: c.watchLinks }}
      />
      <div className="mt-10 border-t border-line pt-6">
        <DeleteButton
          action={deleteCredit.bind(null, id)}
          label="Delete this credit"
          confirmText={`Delete “${c.title}”?`}
        />
      </div>
    </>
  );
}
