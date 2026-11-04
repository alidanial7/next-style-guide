import { apiEnvelopeInstaller } from "./api-envelope.js";
import { appProvidersInstaller } from "./app-providers.js";
import { authAuthjsInstaller } from "./auth-authjs.js";
import { authJwtInstaller } from "./auth-jwt.js";
import { ciInstaller } from "./ci.js";
import { darkModeInstaller } from "./dark-mode.js";
import { dockerComposeInstaller } from "./docker-compose.js";
import { dockerInstaller } from "./docker.js";
import { endpointsInstaller } from "./endpoints.js";
import { eslintInstaller } from "./eslint.js";
import { huskyInstaller } from "./husky.js";
import { i18nInstaller } from "./i18n.js";
import { iconsInstaller } from "./icons.js";
import { muiInstaller } from "./mui.js";
import { packageManagerInstaller } from "./package-manager.js";
import { prettierInstaller } from "./prettier.js";
import { seoInstaller } from "./seo.js";
import { shadcnInstaller } from "./shadcn.js";
import { storeInstaller } from "./store.js";
import { surfaceInstaller } from "./surface.js";
import { tailwindInstaller } from "./tailwind.js";
import { tanstackQueryInstaller } from "./tanstack-query.js";
import { testingInstaller } from "./testing.js";
import { validationInstaller } from "./validation.js";
import { vercelInstaller } from "./vercel.js";
import type { Installer, InstallerContext } from "./types.js";

export type { Installer, InstallerContext } from "./types.js";

export const installers: Installer[] = [
  packageManagerInstaller,
  iconsInstaller,
  storeInstaller,
  tanstackQueryInstaller,
  endpointsInstaller,
  apiEnvelopeInstaller,
  authJwtInstaller,
  authAuthjsInstaller,
  tailwindInstaller,
  darkModeInstaller,
  muiInstaller,
  shadcnInstaller,
  validationInstaller,
  seoInstaller,
  i18nInstaller,
  dockerComposeInstaller,
  testingInstaller,
  eslintInstaller,
  prettierInstaller,
  huskyInstaller,
  dockerInstaller,
  vercelInstaller,
  ciInstaller,
  appProvidersInstaller,
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
