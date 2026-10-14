import { NewPageForm } from "@/components/admin/NewPageForm";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";

export default async function NewPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader
        title="New page"
        subtitle="It starts with a title section. Add anything else in the editor."
      />
      <NewPageForm />
    </>
  );
}
