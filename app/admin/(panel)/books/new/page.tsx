import { BookForm } from "@/components/admin/BookForm";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";

export default async function NewBook() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="Add a book" />
      <BookForm
        id={null}
        cover={null}
        lifestyle={null}
        defaults={{ status: "available", sortOrder: 0, published: false }}
      />
    </>
  );
}
