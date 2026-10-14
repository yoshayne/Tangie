/**
 * One-time backup of the original Wix images into seed-assets/wix/.
 * Run: npx tsx scripts/download-wix-assets.ts
 *
 * This is the ONLY place Wix URLs are used, and only to download. Nothing in the
 * site may reference Wix at runtime (CLAUDE.md §5B). Wix stock images are skipped
 * because they are licensed only for use on Wix.
 */
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

type Asset = {
  /** wix media id, e.g. 790a13_99bf0b91...~mv2 */
  url: string;
  /** which image slot(s) this serves; null = backup only */
  slot: string | null;
  alt: string;
  focal: [number, number];
  note?: string;
};

const BASE = "https://static.wixstatic.com/media/";

const ASSETS: Asset[] = [
  {
    url: BASE + "790a13_99bf0b919afc4ea59b0044d468fc4d5d~mv2.jpeg",
    slot: "home.hero.image",
    alt: "Tangie Brickhouse-Beaty portrait",
    focal: [0.5, 0.2],
    note: "IMG_0171, only 800x867: low-res for a full-bleed hero; replace with mockup/ original",
  },
  {
    url: BASE + "790a13_acf9544c14b349ca81ebd9030249d43f~mv2.jpeg",
    slot: "book.justified-lies.cover",
    alt: "Justified Lies book cover by Tangie Brickhouse Beaty",
    focal: [0.5, 0.5],
    note: "poster; also used for both past events and the featured-book fallback",
  },
  {
    url: BASE + "790a13_87286e09ced04f729c098b9775ede62f~mv2.jpg",
    slot: "home.meet.image",
    alt: "Tangie Brickhouse-Beaty smiling",
    focal: [0.5, 0.3],
  },
  {
    url: BASE + "790a13_f260de8e95574041849e604976da58c0~mv2.jpeg",
    slot: "home.speaking.image",
    alt: "Tangie Brickhouse-Beaty speaking",
    focal: [0.5, 0.3],
    note: "IMG_0179",
  },
  {
    url: BASE + "790a13_11bf9785b14b442e959b2e288ed2f2a9~mv2.jpg",
    slot: "post.your-time-your-truth.cover",
    alt: "Cover image for Your Time, Your Truth",
    focal: [0.5, 0.5],
  },
  {
    url: BASE + "790a13_b6a64feccf0f4157a731c7585a9559dd~mv2.png",
    slot: null,
    alt: "",
    focal: [0.5, 0.5],
    note: "labelled share image on Wix but is really a 500x125 red/black wordmark; too small for link previews, backup only",
  },
  {
    url: BASE + "790a13_5781dd0a26324b30b05b7407b834b52c~mv2.png",
    slot: "press.logo-white",
    alt: "Tangie Brickhouse-Beaty logo (white)",
    focal: [0.5, 0.5],
    note: "6250x4044 transparent PNG, gold quill + white lettering; press kit only",
  },
  {
    url: BASE + "790a13_19098ccfb0254bd5bd8ed2c026ea15cef000.jpg",
    slot: "video.launch.poster",
    alt: "Justified Lies launch video still",
    focal: [0.5, 0.5],
    note: "ask client for the original video file",
  },
  {
    url: BASE + "790a13_4fcbbd342d5740a0bc65fa0dfb3236bf~mv2.png",
    slot: "contact.image",
    alt: "Contact page image",
    focal: [0.5, 0.3],
    note: "woman in green blazer; confirm with client this is an approved photo",
  },
  {
    url: BASE + "790a13_464e829c7a62485fb2855fd1a60f0739~mv2.png",
    slot: null,
    alt: "",
    focal: [0.5, 0.5],
    note: "gold quill icon on transparent background",
  },
  {
    url: BASE + "790a13_c983acfbeb1844119e4ad639a7968c30~mv2.png",
    slot: null,
    alt: "",
    focal: [0.5, 0.5],
    note: "quick-facts badge; check what it is",
  },
  {
    url: BASE + "790a13_c905af5ddd6c4444aca5b2fd943d2555~mv2.png",
    slot: null,
    alt: "",
    focal: [0.5, 0.5],
    note: "'Hey, I'm Tangie' text graphic; backup only, not used in the new design",
  },
];

/** Wix stock images: not downloaded (licensed for Wix only). Slots flagged for replacement. */
const SKIPPED_STOCK = [
  {
    slot: "post.praise-god-for-closed-doors.cover",
    id: "056e2cc0d46f4f01ae713483910b2502",
  },
  {
    slot: "post.the-real-battle.cover",
    id: "11062b_9764ebcf830d4d958553438f5e51b38e",
  },
  {
    slot: "unused.woman-using-laptop",
    id: "11062b_5d056cf59bfa4adfba1a7fbdaed730af",
  },
];

const ROOT = path.resolve(process.cwd(), "seed-assets");

/** Strip Wix resizing (/v1/...) so we always fetch the original file. */
function originalUrl(url: string): string {
  const i = url.indexOf("/v1/");
  return i === -1 ? url : url.slice(0, i);
}

function mediaId(url: string): string {
  return originalUrl(url)
    .split("/media/")[1]
    .replace(/~mv2/, "")
    .replace(/\.[a-z0-9]+$/i, "");
}

async function main() {
  await mkdir(path.join(ROOT, "wix"), { recursive: true });
  const entries: Record<string, unknown>[] = [];

  for (const a of ASSETS) {
    const url = originalUrl(a.url);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Download failed (${res.status}) for ${url}`);
    const buf = Buffer.from(await res.arrayBuffer());

    // Verify it really is an image and read its true size + format.
    const meta = await sharp(buf).metadata();
    if (!meta.width || !meta.height || !meta.format)
      throw new Error(`Not a valid image: ${url}`);
    const ext = meta.format === "jpeg" ? "jpeg" : meta.format;
    const file = `wix/${mediaId(url)}.${ext}`;
    await writeFile(path.join(ROOT, file), buf);

    entries.push({
      slot: a.slot,
      file: null, // set to "mockup/<name>" when the client supplies the original
      fallback: file,
      alt: a.alt,
      focal: a.focal,
      width: meta.width,
      height: meta.height,
      bytes: buf.length,
      sha256: createHash("sha256").update(buf).digest("hex"),
      legacy_url: url,
      ...(a.note ? { note: a.note } : {}),
    });
    console.log(
      `ok  ${file}  ${meta.width}x${meta.height}  ${(buf.length / 1024).toFixed(0)} KB`,
    );
  }

  // Slots with no usable image yet: seed logs TODO(client) for each.
  const missing = [
    "site.share-image (1200x630 social share image; Wix file is too small)",
    "home.featured-book.image (book on marble surface)",
    "home.dark-feature.image (stage photo)",
    "home.newsletter.image (books and plant)",
    ...SKIPPED_STOCK.map(
      (s) => `${s.slot} (Wix stock, not licensed for reuse)`,
    ),
  ].map((s) => `TODO(client): missing image for ${s}`);

  const manifest = {
    generated: new Date().toISOString(),
    note: "Priority per slot: 'file' (mockup/) if set, else 'fallback' (wix/), else skip and log TODO(client).",
    images: entries,
    missing,
  };
  await writeFile(
    path.join(ROOT, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
  console.log(`\nWrote seed-assets/manifest.json (${entries.length} images)`);
  missing.forEach((m) => console.log(m));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
