import type { PackageManager } from "../types.js";

export type PackageManagerMeta = {
  id: PackageManager;
  /** Corepack `packageManager` field; omit for npm */
  packageManagerField: string | null;
  lockfile: string;
  installArgs: string[];
  /** Run a package.json script: `typecheck`, `dev`, … */
  runScript: (script: string, args?: string[]) => string;
  /** Run a binary from node_modules */
  exec: (bin: string, args?: string[]) => string;
};

function joinArgs(args?: string[]): string {
  return args?.length ? ` ${args.join(" ")}` : "";
}

export const PACKAGE_MANAGERS: Record<PackageManager, PackageManagerMeta> = {
  pnpm: {
    id: "pnpm",
    packageManagerField: "pnpm@9.15.0",
    lockfile: "pnpm-lock.yaml",
    installArgs: ["install", "--ignore-workspace"],
    runScript: (script, args) => `pnpm ${script}${joinArgs(args)}`,
    exec: (bin, args) => `pnpm exec ${bin}${joinArgs(args)}`,
  },
  npm: {
    id: "npm",
    packageManagerField: null,
    lockfile: "package-lock.json",
    installArgs: ["install"],
    runScript: (script, args) => `npm run ${script}${joinArgs(args)}`,
    exec: (bin, args) => `npx ${bin}${joinArgs(args)}`,
  },
  yarn: {
    id: "yarn",
    packageManagerField: "yarn@1.22.22",
    lockfile: "yarn.lock",
    installArgs: ["install"],
    runScript: (script, args) => `yarn ${script}${joinArgs(args)}`,
    exec: (bin, args) => `yarn ${bin}${joinArgs(args)}`,
  },
};

export function getPackageManager(id: PackageManager): PackageManagerMeta {
  return PACKAGE_MANAGERS[id];
}

/** CI install command (frozen lockfile when present). */
export function ciInstallCommand(id: PackageManager): string {
  switch (id) {
    case "pnpm":
      return "pnpm install --frozen-lockfile";
    case "npm":
      return "npm ci";
    case "yarn":
      return "yarn install --frozen-lockfile";
  }
}
