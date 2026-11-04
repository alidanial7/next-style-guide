import fs from "fs-extra";
import path from "node:path";

import { ADDONS_DIR } from "../constants.js";
import type { ScaffoldOptions } from "../types.js";
import type { Installer } from "./types.js";

function workflowYaml(options: ScaffoldOptions): string {
  const steps: string[] = [
    `      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install
        run: pnpm install --frozen-lockfile

      - name: Typecheck
        run: pnpm typecheck`,
  ];

  if (options.eslint) {
    steps.push(`
      - name: Lint
        run: pnpm lint`);
  }

  if (options.prettier) {
    steps.push(`
      - name: Format check
        run: pnpm format:check`);
  }

  steps.push(`
      - name: Build
        run: pnpm build
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
