import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { deleteTopic } from "@/app/admin/actions-small";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { TopicForm } from "@/components/admin/SmallForms";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { getDb, schema } from "@/lib/db";

export default async function EditTopic({
  params,
}: PageProps<"/admin/topics/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (id === "new")
    return (
      <>
        <PageHeader title="Add a topic" />
        <TopicForm id={null} defaults={{ sortOrder: 0 }} />
      </>
    );
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [t] = await getDb()
    .select()
    .from(schema.speakingTopics)
    .where(eq(schema.speakingTopics.id, id));
  if (!t) notFound();
  return (
    <>
      <PageHeader title={t.title} />
      <TopicForm id={id} defaults={t} />
      <div className="mt-10 border-t border-line pt-6">
        <DeleteButton
          action={deleteTopic.bind(null, id)}
          label="Delete this topic"
          confirmText={`Delete “${t.title}”?`}
        />
      </div>
    </>
  );
}
