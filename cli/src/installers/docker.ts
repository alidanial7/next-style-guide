import fs from "fs-extra";
import path from "node:path";

import { ADDONS_DIR } from "../constants.js";
import { ensureStandaloneOutput } from "../helpers/next-config.js";
import { getPackageManager } from "../helpers/package-manager.js";
import type { PackageManager } from "../types.js";
import type { Installer } from "./types.js";

function dockerfileFor(pm: PackageManager): string {
  if (pm === "npm") {
    return `# ---------------------------------------------------------------------------- #
#                        Stage 1: Base & Dependencies                          #
# ---------------------------------------------------------------------------- #
FROM node:22-alpine AS builder

RUN apk add --no-cache libc6-compat

WORKDIR /app

ENV HUSKY=0 \\
    NEXT_TELEMETRY_DISABLED=1

ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_API_URL=http://localhost:8000

ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \\
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package.json package-lock.json .npmrc* ./
RUN --mount=type=cache,id=npm,target=/root/.npm \\
    npm ci

COPY . /app/

RUN npm run build

# ---------------------------------------------------------------------------- #
#                        Stage 2: Production Runner                            #
# ---------------------------------------------------------------------------- #
FROM node:22-alpine AS runner

RUN apk add --no-cache curl

WORKDIR /app

ENV NODE_ENV=production \\
    NEXT_TELEMETRY_DISABLED=1 \\
    HOSTNAME=0.0.0.0 \\
    PORT=3000

COPY --from=builder /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \\
    CMD curl -fsS http://127.0.0.1:3000/ || exit 1

CMD ["node", "server.js"]
`;
  }

  if (pm === "yarn") {
    return `# ---------------------------------------------------------------------------- #
#                        Stage 1: Base & Dependencies                          #
# ---------------------------------------------------------------------------- #
FROM node:22-alpine AS builder

RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare yarn@1.22.22 --activate

WORKDIR /app

ENV HUSKY=0 \\
    NEXT_TELEMETRY_DISABLED=1

ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_API_URL=http://localhost:8000

ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \\
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package.json yarn.lock .npmrc* ./
RUN --mount=type=cache,id=yarn,target=/usr/local/share/.cache/yarn \\
    yarn install --frozen-lockfile

COPY . /app/

RUN yarn build

# ---------------------------------------------------------------------------- #
#                        Stage 2: Production Runner                            #
# ---------------------------------------------------------------------------- #
FROM node:22-alpine AS runner

RUN apk add --no-cache curl

WORKDIR /app

ENV NODE_ENV=production \\
    NEXT_TELEMETRY_DISABLED=1 \\
    HOSTNAME=0.0.0.0 \\
    PORT=3000

COPY --from=builder /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \\
    CMD curl -fsS http://127.0.0.1:3000/ || exit 1

CMD ["node", "server.js"]
`;
  }

  // pnpm
  return `# ---------------------------------------------------------------------------- #
#                        Stage 1: Base & Dependencies                          #
# ---------------------------------------------------------------------------- #
FROM node:22-alpine AS builder

RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

ENV HUSKY=0 \\
    NEXT_TELEMETRY_DISABLED=1

ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_API_URL=http://localhost:8000

ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \\
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package.json pnpm-lock.yaml .npmrc* ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \\
    pnpm install --frozen-lockfile

COPY . /app/

RUN pnpm build

# ---------------------------------------------------------------------------- #
#                        Stage 2: Production Runner                            #
# ---------------------------------------------------------------------------- #
FROM node:22-alpine AS runner

RUN apk add --no-cache curl

WORKDIR /app

ENV NODE_ENV=production \\
    NEXT_TELEMETRY_DISABLED=1 \\
    HOSTNAME=0.0.0.0 \\
    PORT=3000

COPY --from=builder /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \\
    CMD curl -fsS http://127.0.0.1:3000/ || exit 1

CMD ["node", "server.js"]
`;
}

export const dockerInstaller: Installer = {
  id: "docker",
  active: (o) => o.deploy === "docker",
  async run({ projectDir, options }) {
    const addon = path.join(ADDONS_DIR, "docker");
    const pm = getPackageManager(options.packageManager);

    await fs.ensureDir(path.join(projectDir, "docker"));
    await fs.writeFile(
      path.join(projectDir, "docker", "production.Dockerfile"),
      dockerfileFor(options.packageManager),
      "utf8",
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
    doc = doc
      .replaceAll("__PROJECT_SLUG__", options.slug)
      .replaceAll("__PACKAGE_MANAGER__", pm.id);
    await fs.outputFile(
      path.join(projectDir, "docs", "style-guide", "ops", "docker.md"),
      doc,
    );

    // Merge into existing next.config (do not wipe next-intl / other wrappers).
    await ensureStandaloneOutput(projectDir);
  },
};
