import { z } from "zod";

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
