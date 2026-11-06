import fs from "fs-extra";
import path from "node:path";

import {
  ciDocsFor,
  ciRuleFor,
  githubWorkflow,
  gitlabCi,
} from "../helpers/ci-workflows.js";
import type { Installer } from "./types.js";

export const ciInstaller: Installer = {
  id: "ci",
  active: (o) => o.ci !== "none",
  async run({ projectDir, options }) {
    if (options.ci === "none") return;

    if (options.ci === "github") {
      await fs.outputFile(
        path.join(projectDir, ".github", "workflows", "ci.yml"),
        githubWorkflow(options),
      );
    } else {
      await fs.outputFile(
        path.join(projectDir, ".gitlab-ci.yml"),
        gitlabCi(options),
      );
    }

    await fs.writeFile(
      path.join(projectDir, ".cursor", "rules", "ci.mdc"),
      ciRuleFor(options.ci),
      "utf8",
    );
    await fs.outputFile(
      path.join(projectDir, "docs", "style-guide", "ops", "ci.md"),
      ciDocsFor(options.ci),
    );
  },
};
