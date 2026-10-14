import { fileTypeFromBuffer } from "file-type";

export const IMAGE_MAX_BYTES = 25 * 1024 * 1024;
export const VIDEO_MAX_BYTES = 500 * 1024 * 1024;
export const DOC_MAX_BYTES = 50 * 1024 * 1024;

const IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);
const VIDEO_MIMES = new Set(["video/mp4", "video/quicktime"]);
const DOC_MIMES = new Set(["application/pdf", "application/zip"]);

export type FileKind = "image" | "video" | "document";
export type Verdict =
  | { ok: true; kind: FileKind; mime: string; ext: string }
  | { ok: false; error: string };

const mb = (n: number) => `${Math.round(n / 1024 / 1024)} MB`;

/**
 * Decides what a file really is from its first bytes (never the file name or browser-reported type),
 * and rejects anything unsafe (SVG, HTML) or unsupported.
 */
export async function inspectFile(
  head: Buffer,
  size: number,
): Promise<Verdict> {
  const detected = await fileTypeFromBuffer(head);

  if (!detected) {
    const text = head
      .subarray(0, 512)
      .toString("utf8")
      .trimStart()
      .toLowerCase();
    if (
      text.startsWith("<svg") ||
      text.startsWith("<?xml") ||
      text.startsWith("<!doctype") ||
      text.startsWith("<html")
    ) {
      return {
        ok: false,
        error:
          "SVG and HTML files can't be uploaded. Please use a JPG, PNG, WebP or AVIF image.",
      };
    }
    return {
      ok: false,
      error:
        "That file type isn't supported. Use JPG, PNG, WebP or AVIF for images, MP4 or MOV for video, PDF or ZIP for documents.",
    };
  }
  if (detected.mime === "image/heic" || detected.mime === "image/heif") {
    return {
      ok: false,
      error:
        "Please export this photo as JPEG (HEIC isn't supported) and upload it again.",
    };
  }
  if (IMAGE_MIMES.has(detected.mime)) {
    return size > IMAGE_MAX_BYTES
      ? {
          ok: false,
          error: `This image is ${mb(size)}; the limit is ${mb(IMAGE_MAX_BYTES)}.`,
        }
      : { ok: true, kind: "image", mime: detected.mime, ext: detected.ext };
  }
  if (VIDEO_MIMES.has(detected.mime)) {
    return size > VIDEO_MAX_BYTES
      ? {
          ok: false,
          error: `This video is ${mb(size)}; the limit is ${mb(VIDEO_MAX_BYTES)}.`,
        }
      : { ok: true, kind: "video", mime: detected.mime, ext: detected.ext };
  }
  if (DOC_MIMES.has(detected.mime)) {
    return size > DOC_MAX_BYTES
      ? {
          ok: false,
          error: `This file is ${mb(size)}; the limit is ${mb(DOC_MAX_BYTES)}.`,
        }
      : { ok: true, kind: "document", mime: detected.mime, ext: detected.ext };
  }
  return {
    ok: false,
    error: `Files of type ${detected.mime} can't be uploaded.`,
  };
}
