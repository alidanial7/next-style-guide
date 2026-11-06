import { auth } from "@/lib/auth";
import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";

import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

const publicPathnames = ["/login", "/api/auth"];

function stripLocale(pathname: string): string {
  const locales = routing.locales.join("|");
  const match = pathname.match(new RegExp(`^/(${locales})(?=/|$)`));
  if (!match) return pathname;
  const rest = pathname.slice(match[0].length);
  return rest.length > 0 ? rest : "/";
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const pathWithoutLocale = stripLocale(pathname);

  const isApiAuth = pathname.startsWith("/api/auth");
  const isPublic =
    isApiAuth ||
    publicPathnames.some(
      (p) =>
        pathWithoutLocale === p || pathWithoutLocale.startsWith(`${p}/`),
    );

  if (!req.auth && !isPublic) {
    const locale =
      routing.locales.find((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)) ??
      routing.defaultLocale;
    const url = new URL(`/${locale}/login`, req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (req.auth && pathWithoutLocale === "/login") {
    const locale =
      routing.locales.find((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)) ??
      routing.defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}`, req.nextUrl.origin));
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
