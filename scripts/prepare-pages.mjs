import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const outputDirectory = path.resolve("pages-out");
const configuredBase = process.env.GITHUB_PAGES_BASE_PATH || "/invitacion-revelacion/";
const base = `/${configuredBase.replace(/^\/+|\/+$/g, "")}/`;

async function rewriteAssets(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await rewriteAssets(fullPath);
      continue;
    }

    if (!/\.(?:html|css|js|mjs)$/.test(entry.name)) continue;
    const original = await readFile(fullPath, "utf8");
    const updated = original.replace(/(^|[^\w.-])\/images\//g, `$1${base}images/`);
    if (updated !== original) await writeFile(fullPath, updated);
  }
}

await rewriteAssets(outputDirectory);
await writeFile(path.join(outputDirectory, ".nojekyll"), "");
