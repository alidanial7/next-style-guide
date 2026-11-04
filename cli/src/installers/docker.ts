import fs from "fs-extra";
import path from "node:path";

import { ADDONS_DIR } from "../constants.js";
import type { Installer } from "./types.js";

const STANDALONE_CONFIG = `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
};

export default nextConfig;
`;

export const dockerInstaller: Installer = {
  id: "docker",
  active: (o) => o.docker,
  async run({ projectDir, options }) {
    const addon = path.join(ADDONS_DIR, "docker");

    await fs.copy(
      path.join(addon, "docker"),
      path.join(projectDir, "docker"),
    );
    await fs.copy(
      path.join(addon, ".dockerignore"),
      path.join(projectDir, ".dockerignore"),
    );
    await fs.copy(
      path.join(addon, ".cursor", "rules", "docker.mdc"),
      path.join(projectDir, ".cursor", "rules", "docker.mdc"),
    );

    let doc = await fs.readFile(
      path.join(addon, "docs", "style-guide", "ops", "docker.md"),
      "utf8",
    );
    doc = doc.replaceAll("__PROJECT_SLUG__", options.slug);
    await fs.outputFile(
      path.join(projectDir, "docs", "style-guide", "ops", "docker.md"),
      doc,
    );

    await fs.writeFile(
      path.join(projectDir, "next.config.ts"),
      STANDALONE_CONFIG,
      "utf8",
    );
  },
};
