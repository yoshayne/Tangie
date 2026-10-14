/**
 * Fails if the page builder's descriptions (lib/sections/meta.ts) and the section registry
 * (lib/sections/registry.tsx) do not list exactly the same section types.
 * Adding a section type means adding it in both places; this makes forgetting impossible.
 */
import { readFileSync } from "node:fs";
import { SECTION_META } from "../lib/sections/meta";

const source = readFileSync("lib/sections/registry.tsx", "utf8");
const registryTypes = [...source.matchAll(/^ {2}(\w+): define\(/gm)].map(
  (m) => m[1],
);
const metaTypes = Object.keys(SECTION_META);

const missingMeta = registryTypes.filter((t) => !metaTypes.includes(t));
const missingRegistry = metaTypes.filter((t) => !registryTypes.includes(t));

if (
  missingMeta.length ||
  missingRegistry.length ||
  registryTypes.length === 0
) {
  if (missingMeta.length)
    console.error(
      "In the registry but not in meta.ts:",
      missingMeta.join(", "),
    );
  if (missingRegistry.length)
    console.error(
      "In meta.ts but not in the registry:",
      missingRegistry.join(", "),
    );
  if (registryTypes.length === 0)
    console.error("Could not read any section types from registry.tsx");
  process.exit(1);
}
console.log(`Section check OK (${registryTypes.length} types).`);
