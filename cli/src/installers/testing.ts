import fs from "fs-extra";
import path from "node:path";

import { addDependencies, addScripts } from "../helpers/package-json.js";
import { getPackageManager } from "../helpers/package-manager.js";
import type { Installer } from "./types.js";

const VITEST_CONFIG = `import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/**/*.test.{ts,tsx}", "src/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
    },
  },
});
`;

const SAMPLE_TEST = `import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { WelcomeCard } from "@/app/_components/welcome-card";

describe("WelcomeCard", () => {
  it("renders scaffold heading", () => {
    const html = renderToStaticMarkup(<WelcomeCard />);
    expect(html).toContain("Your scaffold");
  });
});
`;

function playwrightConfig(devCommand: string): string {
  return `import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "${devCommand}",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
  },
});
`;
}

const E2E_SMOKE = `import { expect, test } from "@playwright/test";

test("home loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
`;

export const testingInstaller: Installer = {
  id: "testing",
  active: (o) => o.testing,
  async run({ projectDir, options }) {
    const pm = getPackageManager(options.packageManager);
    const testCmd = pm.runScript("test");
    const e2eCmd = pm.runScript("test:e2e");

    const rule = `---
description: Vitest (and optional Playwright) conventions
globs: "**/*.test.{ts,tsx}",vitest.config.*,e2e/**,playwright.config.*
alwaysApply: false
---

# Testing

- Vitest: colocated \`<name>.test.tsx\` next to components; also \`tests/**\`.
- Prefer \`renderToStaticMarkup\` for simple server component smoke.
- Run \`${testCmd}\`. Playwright (if enabled): \`${e2eCmd}\`.
`;

    await fs.writeFile(
      path.join(projectDir, "vitest.config.mts"),
      VITEST_CONFIG,
      "utf8",
    );
    await fs.outputFile(
      path.join(
        projectDir,
        "src",
        "app",
        "_components",
        "welcome-card",
        "welcome-card.test.tsx",
      ),
      SAMPLE_TEST,
    );
    await fs.writeFile(
      path.join(projectDir, ".cursor", "rules", "testing.mdc"),
      rule,
      "utf8",
    );
    await fs.outputFile(
      path.join(projectDir, "docs", "style-guide", "tooling", "testing.md"),
      `# Testing

Vitest: \`${testCmd}\`
Config: \`vitest.config.mts\`
Colocate \`*.test.tsx\` with components under \`src/\`.
${options.playwright ? `\nPlaywright: \`${e2eCmd}\` · config \`playwright.config.ts\` · specs in \`e2e/\`.\n` : ""}
`,
    );

    await addDependencies(
      projectDir,
      {
        vitest: "^3.0.5",
        "@vitejs/plugin-react": "^4.3.4",
        jsdom: "^26.0.0",
      },
      "devDependencies",
    );
    await addScripts(projectDir, {
      test: "vitest run",
      "test:watch": "vitest",
    });

    if (options.playwright) {
      await fs.writeFile(
        path.join(projectDir, "playwright.config.ts"),
        playwrightConfig(pm.runScript("dev")),
        "utf8",
      );
      await fs.outputFile(path.join(projectDir, "e2e", "home.spec.ts"), E2E_SMOKE);
      await addDependencies(
        projectDir,
        { "@playwright/test": "^1.50.1" },
        "devDependencies",
      );
      await addScripts(projectDir, {
        "test:e2e": "playwright test",
      });
    }
  },
};
