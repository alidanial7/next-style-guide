import { endpointsInstaller } from "./endpoints.js";
import { huskyInstaller } from "./husky.js";
import { iconsInstaller } from "./icons.js";
import { surfaceInstaller } from "./surface.js";
import { tanstackQueryInstaller } from "./tanstack-query.js";
import type { Installer, InstallerContext } from "./types.js";

export type { Installer, InstallerContext } from "./types.js";

export const installers: Installer[] = [
  iconsInstaller,
  tanstackQueryInstaller,
  endpointsInstaller,
  huskyInstaller,
  surfaceInstaller, // last — choice-aware pages/docs
];

export async function runInstallers(ctx: InstallerContext): Promise<string[]> {
  const ran: string[] = [];
  for (const installer of installers) {
    if (!installer.active(ctx.options)) continue;
    await installer.run(ctx);
    ran.push(installer.id);
  }
  return ran;
}
