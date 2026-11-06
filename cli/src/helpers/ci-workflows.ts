import {
  ciInstallCommand,
  getPackageManager,
} from "./package-manager.js";
import type { ScaffoldOptions } from "../types.js";

function sharedScripts(options: ScaffoldOptions): string[] {
  const pm = getPackageManager(options.packageManager);
  const run = (script: string) => pm.runScript(script);
  const scripts = [run("typecheck")];
  if (options.eslint) scripts.push(run("lint"));
  if (options.prettier) scripts.push(run("format:check"));
  if (options.testing) scripts.push(run("test"));
  scripts.push(run("build"));
  return scripts;
}

export function githubWorkflow(options: ScaffoldOptions): string {
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

function gitlabBeforeScript(options: ScaffoldOptions): string[] {
  const lines: string[] = [];
  if (options.packageManager === "pnpm") {
    lines.push(
      "  - corepack enable",
      "  - corepack prepare pnpm@9.15.0 --activate",
      "  - pnpm config set store-dir .pnpm-store",
    );
  } else if (options.packageManager === "yarn") {
    lines.push(
      "  - corepack enable",
      "  - corepack prepare yarn@1.22.22 --activate",
    );
  }
  lines.push(`  - ${ciInstallCommand(options.packageManager)}`);
  return lines;
}

function gitlabCache(options: ScaffoldOptions): string {
  const lock = getPackageManager(options.packageManager).lockfile;
  if (options.packageManager === "pnpm") {
    return `cache:
  key:
    files:
      - ${lock}
  paths:
    - .pnpm-store
`;
  }
  if (options.packageManager === "yarn") {
    return `cache:
  key:
    files:
      - ${lock}
  paths:
    - .yarn
`;
  }
  return `cache:
  key:
    files:
      - ${lock}
  paths:
    - node_modules
`;
}

export function gitlabCi(options: ScaffoldOptions): string {
  const scripts = sharedScripts(options)
    .map((s) => `    - ${s}`)
    .join("\n");

  return `# GitLab CI — install → typecheck → lint/format (if enabled) → test → build
stages:
  - check

default:
  image: node:22
  interruptible: true

workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
    - if: $CI_COMMIT_BRANCH == "master"

variables:
  NEXT_PUBLIC_APP_URL: "http://localhost:3000"
  NEXT_PUBLIC_API_URL: "http://localhost:8000"
  NEXT_TELEMETRY_DISABLED: "1"

${gitlabCache(options)}
before_script:
${gitlabBeforeScript(options).join("\n")}

checks:
  stage: check
  timeout: 20 minutes
  script:
${scripts}
`;
}

export function ciRuleFor(ci: "github" | "gitlab"): string {
  if (ci === "gitlab") {
    return `---
description: GitLab CI pipeline
globs: .gitlab-ci.yml
alwaysApply: false
---

# CI (GitLab)

- Pipeline: \`.gitlab-ci.yml\` — install → typecheck → lint/format (if enabled) → test → build.
- Keep pipelines green before merge. Don't skip checks with unrelated YAML edits.
- New required scripts must be reflected in the \`checks\` job.
`;
  }

  return `---
description: GitHub Actions CI workflow
globs: .github/workflows/**
alwaysApply: false
---

# CI (GitHub Actions)

- Workflow: \`.github/workflows/ci.yml\` — install → typecheck → lint/format (if enabled) → test → build.
- Keep jobs green before merge. Don't skip checks with unrelated workflow edits.
- New required scripts must be reflected in the workflow steps.
`;
}

export function ciDocsFor(ci: "github" | "gitlab"): string {
  if (ci === "gitlab") {
    return `# CI

GitLab CI: \`.gitlab-ci.yml\`.

Typical steps: install → \`typecheck\` → \`lint\` / Prettier check (when enabled) → \`test\` → \`build\`.

Merge requests and pushes to \`main\`/\`master\` trigger the pipeline.
`;
  }

  return `# CI

GitHub Actions: \`.github/workflows/ci.yml\`.

Typical steps: checkout → package manager → install → \`typecheck\` → \`lint\` / Prettier check (when enabled) → \`test\` → \`build\`.

Push to \`main\`/\`master\` and pull requests trigger the workflow.
`;
}
