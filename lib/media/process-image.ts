import { createHash } from "node:crypto";
import sharp from "sharp";

export type ProcessedImage = {
  /** The file we serve: WebP, longest side <= 2400px, no EXIF/GPS. */
  webp: Buffer;
  width: number;
  height: number;
  blurDataUrl: string;
  /** SHA-256 of the untouched upload, used to detect duplicates. */
  sha256: string;
  /** Format of the untouched upload (jpeg, png, ...). */
  originalFormat: string;
};

const MAX_SIDE = 2400;

/**
 * The one image pipeline for the whole site (seed now, admin uploads in M6):
 * auto-rotate from EXIF, strip all metadata, resize to <= 2400px without upscaling,
 * encode WebP q82, and build a tiny blurred placeholder.
 */
export async function processImage(input: Buffer): Promise<ProcessedImage> {
  const original = await sharp(input, { failOn: "none" }).metadata();
  if (!original.format) throw new Error("Not a readable image");

  // sharp drops metadata by default; .rotate() with no args applies the EXIF orientation first.
  const { data, info } = await sharp(input, { failOn: "none" })
    .rotate()
    .resize({
      width: MAX_SIDE,
      height: MAX_SIDE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });

  const blur = await sharp(data)
    .resize({ width: 16 })
    .blur(1)
    .webp({ quality: 40 })
    .toBuffer();

  return {
    webp: data,
    width: info.width,
    height: info.height,
    blurDataUrl: `data:image/webp;base64,${blur.toString("base64")}`,
    sha256: createHash("sha256").update(input).digest("hex"),
    originalFormat: original.format,
  };
}
