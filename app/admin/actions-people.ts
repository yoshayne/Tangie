"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { requireAdminAction } from "@/lib/admin/auth";
import { getDb, schema } from "@/lib/db";

export async function setInquiryStatus(
  id: string,
  status: "new" | "read" | "archived",
) {
  await requireAdminAction();
  await getDb()
    .update(schema.inquiries)
    .set({ status })
    .where(eq(schema.inquiries.id, id));
  redirect(`/admin/inquiries/${id}`);
}

export async function deleteInquiry(id: string) {
  await requireAdminAction();
  await getDb().delete(schema.inquiries).where(eq(schema.inquiries.id, id));
  redirect("/admin/inquiries");
}

export async function deleteSubscriber(id: string) {
  await requireAdminAction();
  await getDb().delete(schema.subscribers).where(eq(schema.subscribers.id, id));
  redirect("/admin/subscribers");
}
