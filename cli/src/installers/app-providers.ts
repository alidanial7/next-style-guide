import type { Installer } from "./types.js";
import {
  needsAppProviders,
  wireRootLayout,
  writeAppProviders,
} from "../helpers/app-providers.js";

/**
 * Compose client providers into `app-providers.tsx` and wire root layout once.
 * Runs after leaf provider installers; before surface.
 */
export const appProvidersInstaller: Installer = {
  id: "app-providers",
  active: (o) => needsAppProviders(o) || o.i18n || o.darkMode,
  async run({ projectDir, options }) {
    await writeAppProviders(projectDir, options);
    await wireRootLayout(projectDir, options);
  },
};
