import { spawn } from "node:child_process";

import type { PackageManagerMeta } from "./package-manager.js";

/**
 * Run package-manager install without blocking the event loop.
 * Uses inherited stdio so the user sees real progress (download bars, etc.).
 */
export function runPackageInstall(
  projectDir: string,
  pm: PackageManagerMeta,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(pm.id, pm.installArgs, {
      cwd: projectDir,
      stdio: "inherit",
      env: process.env,
      shell: process.platform === "win32",
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${pm.id} ${pm.installArgs.join(" ")} exited with ${code}`));
    });
  });
}

/** Yield so clack spinner can paint an updated message before heavy work. */
export function yieldUi(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}
