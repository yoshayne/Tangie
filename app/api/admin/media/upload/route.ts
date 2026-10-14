import { requireAdminRequest } from "@/lib/admin/auth";
import { inspectFile } from "@/lib/media/validate";
import { saveImageDetailed } from "@/lib/media/save-image";

type Result =
  | {
      name: string;
      ok: true;
      duplicate: boolean;
      media: {
        id: string;
        url: string;
        alt: string;
        width: number | null;
        height: number | null;
      };
    }
  | { name: string; ok: false; error: string };

/** Photos: one or many files at once. The file type is read from the bytes, not the name. */
export async function POST(request: Request) {
  const admin = await requireAdminRequest(request);
  if (admin instanceof Response) return admin;

  const form = await request.formData();
  const files = form
    .getAll("files")
    .filter((f): f is File => f instanceof File);
  if (files.length === 0)
    return Response.json({ error: "No files received." }, { status: 400 });

  const results: Result[] = [];
  for (const file of files.slice(0, 25)) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const verdict = await inspectFile(buffer.subarray(0, 4100), buffer.length);
    if (!verdict.ok) {
      results.push({ name: file.name, ok: false, error: verdict.error });
      continue;
    }
    if (verdict.kind !== "image") {
      results.push({
        name: file.name,
        ok: false,
        error: "Videos and documents use the file uploader.",
      });
      continue;
    }
    try {
      const { row, created } = await saveImageDetailed({
        buffer,
        filename: file.name,
        alt: "",
        source: "upload",
      });
      results.push({
        name: file.name,
        ok: true,
        duplicate: !created,
        media: {
          id: row.id,
          url: row.url,
          alt: row.alt,
          width: row.width,
          height: row.height,
        },
      });
    } catch (e) {
      console.error("Image upload failed:", e);
      results.push({
        name: file.name,
        ok: false,
        error:
          "That image couldn't be processed. Try exporting it again as JPG or PNG.",
      });
    }
  }
  return Response.json({ results });
}
