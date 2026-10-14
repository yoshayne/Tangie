import { PostForm } from "@/components/admin/PostForm";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { getCategories } from "@/lib/admin/categories";

export default async function NewPost() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="Write a post" />
      <PostForm
        id={null}
        cover={null}
        categories={await getCategories()}
        defaults={{
          status: "draft",
          authorName: "Tangie Brickhouse-Beaty",
        }}
      />
    </>
  );
}
