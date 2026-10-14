import { desc } from "drizzle-orm";
import Link from "next/link";
import { togglePostStatus } from "@/app/admin/actions-posts";
import {
  Badge,
  EmptyState,
  PageHeader,
  Table,
  Td,
} from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { getDb, schema } from "@/lib/db";

export default async function JournalAdmin() {
  await requireAdmin();
  const posts = await getDb()
    .select()
    .from(schema.posts)
    .orderBy(desc(schema.posts.updatedAt));
  return (
    <>
      <PageHeader
        title="Journal"
        subtitle="Blog posts."
        action={{ label: "Write a post", href: "/admin/journal/new" }}
      />
      {posts.length === 0 ? (
        <EmptyState>No posts yet.</EmptyState>
      ) : (
        <Table head={["Post", "Category", "Status", ""]}>
          {posts.map((p) => (
            <tr key={p.id}>
              <Td>
                <Link
                  href={`/admin/journal/${p.id}`}
                  className="font-semibold underline"
                >
                  {p.title}
                </Link>
                {p.publishedAt ? (
                  <div className="text-xs text-stone">
                    {p.publishedAt.toLocaleDateString("en-US", {
                      timeZone: "America/New_York",
                      dateStyle: "medium",
                    })}
                  </div>
                ) : null}
              </Td>
              <Td>{p.category ?? "—"}</Td>
              <Td>
                <Badge tone={p.status === "published" ? "good" : "warn"}>
                  {p.status === "published" ? "Published" : "Draft"}
                </Badge>
              </Td>
              <Td>
                <form action={togglePostStatus.bind(null, p.id)}>
                  <button className="text-sm text-bronze underline">
                    {p.status === "published" ? "Unpublish" : "Publish"}
                  </button>
                </form>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
