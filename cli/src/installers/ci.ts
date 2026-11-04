import fs from "fs-extra";
import path from "node:path";

import { ADDONS_DIR } from "../constants.js";
import {
  ciInstallCommand,
  getPackageManager,
} from "../helpers/package-manager.js";
import type { ScaffoldOptions } from "../types.js";
import type { Installer } from "./types.js";

function workflowYaml(options: ScaffoldOptions): string {
  const pm = getPackageManager(options.packageManager);
  const run = (script: string) => pm.runScript(script);

  const setupSteps: string[] = [
    `      - name: Checkout
        uses: actions/checkout@v4
`,
  ];

  if (options.packageManager === "pnpm") {
    setupSteps.push(`      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9
`);
  }

  if (options.packageManager === "yarn") {
    setupSteps.push(`      - name: Enable Corepack
        run: corepack enable
`);
  }

  setupSteps.push(`      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: ${options.packageManager}
`);

  const steps: string[] = [
    ...setupSteps,
    `      - name: Install
        run: ${ciInstallCommand(options.packageManager)}

      - name: Typecheck
        run: ${run("typecheck")}`,
  ];

  if (options.eslint) {
    steps.push(`
      - name: Lint
        run: ${run("lint")}`);
  }

  if (options.prettier) {
    steps.push(`
      - name: Format check
        run: ${run("format:check")}`);
  }

  if (options.testing) {
    steps.push(`
      - name: Test
        run: ${run("test")}`);
  }

  steps.push(`
      - name: Build
        run: ${run("build")}
        env:
          NEXT_PUBLIC_APP_URL: http://localhost:3000
          NEXT_PUBLIC_API_URL: http://localhost:8000`);

  return `name: CI

on:
  push:
    branches: [main, master]
  pull_request:

concurrency:
  group: ci-\${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  checks:
    name: Checks
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
${steps.join("\n")}
`;
}

export const ciInstaller: Installer = {
  id: "ci",
  active: (o) => o.ci,
  async run({ projectDir, options }) {
    const addon = path.join(ADDONS_DIR, "ci");

    await fs.outputFile(
      path.join(projectDir, ".github", "workflows", "ci.yml"),
      workflowYaml(options),
    );
    await fs.copy(
      path.join(addon, ".cursor", "rules", "ci.mdc"),
      path.join(projectDir, ".cursor", "rules", "ci.mdc"),
    );
    await fs.copy(
      path.join(addon, "docs", "style-guide", "ops", "ci.md"),
      path.join(projectDir, "docs", "style-guide", "ops", "ci.md"),
    );
  },
};
