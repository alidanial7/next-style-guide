import type { ScaffoldOptions } from "../types.js";

export type InstallerContext = {
  projectDir: string;
  options: ScaffoldOptions;
};

export type Installer = {
  id: string;
  active: (options: ScaffoldOptions) => boolean;
  run: (ctx: InstallerContext) => Promise<void>;
};
