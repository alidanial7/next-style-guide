import fs from "fs-extra";
import path from "node:path";

import {
  addDependencies,
  removeDependencies,
} from "../helpers/package-json.js";
import type { ValidationOption } from "../types.js";
import type { Installer } from "./types.js";

const ENV_NONE = `/**
 * Public env helpers. Import from Client Components only for NEXT_PUBLIC_*.
 * Server-only secrets stay out of this module until needed.
 */
export type PublicEnv = {
  NEXT_PUBLIC_APP_URL: string;
  NEXT_PUBLIC_API_URL: string;
};

export const env: PublicEnv = {
  NEXT_PUBLIC_APP_URL:
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  NEXT_PUBLIC_API_URL:
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
};
`;

const ENV_ZOD = `import { z } from "zod";

/**
 * Validated public env. Import from Client Components only for NEXT_PUBLIC_*.
 * Server-only secrets stay out of this schema until needed.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:8000"),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

export const env: PublicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});
`;

const ENV_YUP = `import * as yup from "yup";

/**
 * Validated public env. Import from Client Components only for NEXT_PUBLIC_*.
 * Server-only secrets stay out of this schema until needed.
 */
const publicEnvSchema = yup.object({
  NEXT_PUBLIC_APP_URL: yup
    .string()
    .url()
    .default("http://localhost:3000"),
  NEXT_PUBLIC_API_URL: yup
    .string()
    .url()
    .default("http://localhost:8000"),
});

export type PublicEnv = yup.InferType<typeof publicEnvSchema>;

export const env: PublicEnv = publicEnvSchema.validateSync({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});
`;

function formsRule(validation: ValidationOption): string {
  const schemaLine =
    validation === "zod"
      ? "- RHF + `Controller` + Zod `zodResolver`. Schema `satisfies z.ZodType<*Body>` when endpoints codegen exists; field names = API keys."
      : validation === "yup"
        ? "- RHF + `Controller` + Yup `yupResolver`. Schemas in `src/lib/validations/`; field names = API keys when endpoints codegen exists."
        : "- RHF + `Controller`. Add a schema library later if needed; field names = API keys when endpoints codegen exists.";

  return `---
description: RHF forms aligned to API body types
globs: src/**/*form*/**,src/**/*-form*/**,src/**/*.form.tsx,src/components/forms/**,src/lib/**/*form*.ts,src/lib/validations/**
alwaysApply: false
---

# Forms

- \`"use client"\` + named exports. \`page.tsx\` stays server when metadata-only.
- Placement: shared → \`src/components/forms/<name>/\`; one route → \`src/app/<route>/_components/forms/<name>/\`.
${schemaLine}
- Reuse shared/UI controls — no ad-hoc inputs. Extend with props; do not redesign a parallel form control per page.
- Required: derive from schema / \`*Body\`; use \`required\` on Field/Label (no handmade \`*\` text).
- Invalid: \`data-invalid\`, \`aria-invalid\`, \`FieldError\`.
- Server 400 envelope: \`getApiErrorMessage\` / \`extractApiFieldErrors\` (\`@/utils/api-error\`); map to \`setError\` when using RHF.
- Never duplicate the same form state/submit logic across pages.
`;
}

function validationRule(validation: Exclude<ValidationOption, "none">): string {
  return `---
description: ${validation === "zod" ? "Zod" : "Yup"} validation conventions
globs: src/lib/env.ts,src/lib/validations/**,src/**/*schema*.{ts,tsx}
alwaysApply: false
---

# Validation (${validation})

- Public env: \`src/lib/env.ts\` (${validation} schema).
- Domain schemas: \`src/lib/validations/<name>.ts\`.
- Forms: use \`${validation === "zod" ? "zodResolver" : "yupResolver"}\` from \`@hookform/resolvers\`.
- Prefer one library — do not mix Zod and Yup in the same app.
`;
}

export const validationInstaller: Installer = {
  id: "validation",
  active: () => true,
  async run({ projectDir, options }) {
    await fs.writeFile(
      path.join(projectDir, ".cursor", "rules", "forms.mdc"),
      formsRule(options.validation),
      "utf8",
    );

    if (options.validation === "none") {
      await fs.writeFile(
        path.join(projectDir, "src", "lib", "env.ts"),
        ENV_NONE,
        "utf8",
      );
      await removeDependencies(projectDir, ["zod", "yup"]);
      await fs.outputFile(
        path.join(projectDir, "docs", "style-guide", "validation", "none.md"),
        `# Validation — none

Env: \`src/lib/env.ts\` (plain defaults, no schema library).
Add Zod or Yup later if forms need shared schemas.
`,
      );
      return;
    }

    const validationsDir = path.join(projectDir, "src", "lib", "validations");
    await fs.ensureDir(validationsDir);
    await fs.writeFile(path.join(validationsDir, ".gitkeep"), "", "utf8");

    if (options.validation === "yup") {
      await fs.writeFile(
        path.join(projectDir, "src", "lib", "env.ts"),
        ENV_YUP,
        "utf8",
      );
      await removeDependencies(projectDir, ["zod"]);
      await addDependencies(projectDir, { yup: "^1.6.1" });
    } else {
      await fs.writeFile(
        path.join(projectDir, "src", "lib", "env.ts"),
        ENV_ZOD,
        "utf8",
      );
      await addDependencies(projectDir, { zod: "^3.24.1" });
    }

    await fs.writeFile(
      path.join(projectDir, ".cursor", "rules", "validation.mdc"),
      validationRule(options.validation),
      "utf8",
    );

    await fs.outputFile(
      path.join(
        projectDir,
        "docs",
        "style-guide",
        "validation",
        `${options.validation}.md`,
      ),
      `# Validation — ${options.validation}

Env: \`src/lib/env.ts\`
Schemas: \`src/lib/validations/\`
Forms: \`@hookform/resolvers/${options.validation}\` when using RHF.
`,
    );
  },
};
