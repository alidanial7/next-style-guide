import type { Installer } from "./types.js";
import {
  needsAppProviders,
  writeAppProviders,
} from "../helpers/app-providers.js";
import { wireRootLayout } from "../helpers/layout-wiring.js";

/**
 * Compose client providers (when needed) and always wire root layout
 * (`dir` / lang / AppProviders) so fixed RTL is not skipped.
 * Runs after leaf provider installers; before surface.
 */
export const appProvidersInstaller: Installer = {
  id: "app-providers",
  active: () => true,
  async run({ projectDir, options }) {
    if (needsAppProviders(options)) {
      await writeAppProviders(projectDir, options);
    }
    await wireRootLayout(projectDir, options);
  },
};
