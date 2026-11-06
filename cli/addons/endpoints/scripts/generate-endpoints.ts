/**
 * Generate / sync `src/endpoints/*` from an OpenAPI (Swagger) schema URL.
 *
 * Usage:
 *   pnpm endpoints:generate
 *   pnpm endpoints:generate --url=http://localhost:8000/api/docs/schema/?format=json
 */

import { main } from "./lib/cli.ts";

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
