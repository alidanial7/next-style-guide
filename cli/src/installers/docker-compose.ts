import fs from "fs-extra";
import path from "node:path";

import type { Installer } from "./types.js";

const COMPOSE = `services:
  api:
    image: nginx:alpine
    ports:
      - "8000:80"
    volumes:
      - ./docker/api-mock:/usr/share/nginx/html:ro
    # Replace this stub with your real API image when ready.
    # JWT apps expect NEXT_PUBLIC_API_URL=http://localhost:8000

  # Example (uncomment when you have a backend image):
  # api:
  #   image: your-org/api:latest
  #   ports:
  #     - "8000:8000"
  #   environment:
  #     DATABASE_URL: postgres://...
`;

const MOCK_README = `# Local API stub

Placeholder for Docker Compose. Point \`NEXT_PUBLIC_API_URL\` at \`http://localhost:8000\`.

Replace the nginx stub in \`docker-compose.yml\` with your real API service.
`;

const RULE = `---
description: Local API via Docker Compose (JWT + endpoints)
globs: docker-compose.yml,docker/api-mock/**
alwaysApply: false
---

# Docker Compose (local API)

- \`docker-compose.yml\` — stub API on port 8000 for JWT + endpoints apps.
- \`docker compose up\` then set \`NEXT_PUBLIC_API_URL=http://localhost:8000\`.
- Swap the stub service for your real backend image before production work.
`;

export const dockerComposeInstaller: Installer = {
  id: "docker-compose",
  active: (o) => o.dockerCompose && o.auth === "jwt" && o.endpoints,
  async run({ projectDir }) {
    await fs.writeFile(
      path.join(projectDir, "docker-compose.yml"),
      COMPOSE,
      "utf8",
    );
    await fs.outputFile(
      path.join(projectDir, "docker", "api-mock", "README.md"),
      MOCK_README,
    );
    await fs.writeFile(
      path.join(projectDir, ".cursor", "rules", "docker-compose.mdc"),
      RULE,
      "utf8",
    );
    await fs.outputFile(
      path.join(projectDir, "docs", "style-guide", "ops", "docker-compose.md"),
      `# Docker Compose (local API)

\`\`\`bash
docker compose up
\`\`\`

Stub listens on \`http://localhost:8000\`. Align with \`NEXT_PUBLIC_API_URL\`.
`,
    );
  },
};
