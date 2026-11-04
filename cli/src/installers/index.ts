import { ciInstaller } from "./ci.js";
import { dockerInstaller } from "./docker.js";
import { endpointsInstaller } from "./endpoints.js";
import { eslintInstaller } from "./eslint.js";
import { huskyInstaller } from "./husky.js";
import { iconsInstaller } from "./icons.js";
import { muiInstaller } from "./mui.js";
import { prettierInstaller } from "./prettier.js";
import { shadcnInstaller } from "./shadcn.js";
import { surfaceInstaller } from "./surface.js";
import { tailwindInstaller } from "./tailwind.js";
import { tanstackQueryInstaller } from "./tanstack-query.js";
import { validationInstaller } from "./validation.js";
import type { Installer, InstallerContext } from "./types.js";

export type { Installer, InstallerContext } from "./types.js";

export const installers: Installer[] = [
  iconsInstaller,
  tanstackQueryInstaller,
  endpointsInstaller,
  tailwindInstaller,
  muiInstaller,
  shadcnInstaller, // after tailwind
  validationInstaller,
  eslintInstaller,
  prettierInstaller,
  huskyInstaller,
  dockerInstaller,
  ciInstaller,
  surfaceInstaller,
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
