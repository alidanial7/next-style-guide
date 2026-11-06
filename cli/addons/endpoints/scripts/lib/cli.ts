import { writeFile } from "node:fs/promises";
import path from "node:path";

import { MANIFEST_NAME } from "./constants";
import {
  collectAllResources,
  emitEnumsFile,
  emitRootIndex,
  emitResourceIndex,
  writeEndpointFiles,
} from "./emit";
import { formatGeneratedWithPrettier } from "./format-generated";
import { groupBy } from "./helpers";
import { fetchSchema, loadConfig } from "./openapi";
import { ROOT } from "./paths";
import { buildSpecs } from "./spec";
import type { Manifest } from "./types";
import { readManifest, removeStaleGeneratedFiles, pruneEmptyDirs } from "./fs-sync";

export async function main() {
  const config = await loadConfig();
  const urlArg = process.argv.find((arg) => arg.startsWith("--url="));
  if (urlArg) {
    config.schemaUrl = urlArg.slice("--url=".length);
  }

  console.log(`Fetching schema: ${config.schemaUrl}`);
  const openapi = await fetchSchema(config.schemaUrl);
  const specs = buildSpecs(openapi, config.basePath);
  console.log(`Found ${specs.length} operations`);

  const outDir = path.join(ROOT, config.outDir);
  const previous = await readManifest(outDir);
  const written = new Set<string>();

  const enumsContent = emitEnumsFile(openapi, config.header);
  await writeFile(path.join(outDir, "enums.ts"), enumsContent, "utf8");
  written.add("enums.ts");

  const byResource = groupBy(specs, (spec) => spec.resourceRoot);

  for (const [resource, resourceSpecs] of Object.entries(byResource)) {
    if (config.preserve?.includes(resource)) {
      continue;
    }
    for (const spec of resourceSpecs) {
      for (const file of await writeEndpointFiles(outDir, spec, config.header, openapi)) {
        written.add(file);
      }
    }
    const indexRel = path.join(resource, "index.ts");
    await writeFile(
      path.join(outDir, indexRel),
      emitResourceIndex(resourceSpecs, config.header),
      "utf8",
    );
    written.add(indexRel.replaceAll("\\", "/"));
  }

  const allResources = await collectAllResources(outDir);
  const rootIndexContent = emitRootIndex(allResources, config.header);
  await writeFile(path.join(outDir, "index.ts"), rootIndexContent, "utf8");
  written.add("index.ts");

  const manifest: Manifest = {
    schemaUrl: config.schemaUrl,
    files: [...written].sort(),
  };
  await writeFile(
    path.join(outDir, MANIFEST_NAME),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
  written.add(MANIFEST_NAME);

  const removed = await removeStaleGeneratedFiles(outDir, previous, written, config.preserve);
  await pruneEmptyDirs(outDir, config.preserve);

  console.log(`Wrote ${written.size} files`);
  if (removed.length) {
    console.log(`Removed ${removed.length} stale generated files`);
  }

  formatGeneratedWithPrettier(outDir, [...written]);
  console.log("Done.");
}
