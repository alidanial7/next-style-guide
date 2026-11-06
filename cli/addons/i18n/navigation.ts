import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

/** Locale-aware wrappers around Next.js navigation APIs. Prefer these over `next/link`. */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
