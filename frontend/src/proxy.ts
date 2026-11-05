import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);

/**
 * Proxy Next.js 16 (pengganti middleware.ts):
 * - /dashboard/* → wajib cookie sesi `mp_access` (validasi sebenarnya di API). Tanpa cookie → login.
 *   Cookie refresh ber-path /api/v1/auth sehingga tidak terlihat di sini; halaman login mencoba refresh senyap.
 * - path lain → routing bahasa next-intl (/ → /id atau /en).
 */
export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    if (pathname === "/dashboard/login") {
      if (request.nextUrl.searchParams.has("expired")) {
        const res = NextResponse.next();
        res.cookies.delete("mp_access");
        return res;
      }
      if (request.cookies.has("mp_access")) {
        const nextParam = request.nextUrl.searchParams.get("next");
        const targetPath =
          nextParam &&
          nextParam.startsWith("/dashboard") &&
          !nextParam.startsWith("//") &&
          !nextParam.startsWith("/dashboard/login")
            ? nextParam
            : "/dashboard";
        const url = request.nextUrl.clone();
        const [pathOnly, queryOnly] = targetPath.split("?");
        url.pathname = pathOnly || "/dashboard";
        url.search = queryOnly ? `?${queryOnly}` : "";
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    }
    if (!request.cookies.has("mp_access")) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard/login";
      url.search = `?next=${encodeURIComponent(pathname + search)}`;
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }
  return intl(request);
}

export const config = {
  // Kecualikan API, route internal, aset Next, dan file statis (mengandung titik: robots.txt, llms.txt, gambar).
  matcher: ["/((?!api|internal|_next|_vercel|.*\\..*).*)"],
};
