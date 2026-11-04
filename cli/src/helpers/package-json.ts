import fs from "fs-extra";
import path from "node:path";

type PkgJson = {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
};

async function readPkg(projectDir: string): Promise<{ pkgPath: string; pkg: PkgJson }> {
  const pkgPath = path.join(projectDir, "package.json");
  const pkg = (await fs.readJson(pkgPath)) as PkgJson;
  return { pkgPath, pkg };
}

function sortRecord(record: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(record).sort(([a], [b]) => a.localeCompare(b)),
  );
}

export async function addDependencies(
  projectDir: string,
  deps: Record<string, string>,
  kind: "dependencies" | "devDependencies" = "dependencies",
): Promise<void> {
  const { pkgPath, pkg } = await readPkg(projectDir);
  pkg[kind] = sortRecord({
    ...(pkg[kind] ?? {}),
    ...deps,
  });
  await fs.writeJson(pkgPath, pkg, { spaces: 2 });
}

export async function addScripts(
  projectDir: string,
  scripts: Record<string, string>,
): Promise<void> {
  const { pkgPath, pkg } = await readPkg(projectDir);
  pkg.scripts = {
    ...(pkg.scripts ?? {}),
    ...scripts,
  };
  await fs.writeJson(pkgPath, pkg, { spaces: 2 });
}

export async function mergePackageField(
  projectDir: string,
  field: string,
  value: unknown,
): Promise<void> {
  const { pkgPath, pkg } = await readPkg(projectDir);
  pkg[field] = value;
  await fs.writeJson(pkgPath, pkg, { spaces: 2 });
}

export async function removeDependencies(
  projectDir: string,
  names: string[],
  kind: "dependencies" | "devDependencies" = "dependencies",
): Promise<void> {
  const { pkgPath, pkg } = await readPkg(projectDir);
  if (!pkg[kind]) return;
  for (const name of names) {
    delete pkg[kind]![name];
  }
  pkg[kind] = sortRecord(pkg[kind]!);
  await fs.writeJson(pkgPath, pkg, { spaces: 2 });
}
