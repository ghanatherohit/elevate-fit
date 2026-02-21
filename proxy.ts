import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const allowedOrigins = [
  "https://elevate-fit.vercel.app",
  "http://localhost:3000",
  "http://192.168.0.109:3000",
];
const allowedMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
const allowedHeaders = ["Content-Type", "Authorization"];

const PUBLIC_PATHS = ["/auth/login", "/auth/register", "/welcome"];

const isPublicPath = (pathname: string) => {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get("origin");
  const isAllowedOrigin = origin ? allowedOrigins.includes(origin) : false;

  if (pathname.startsWith("/api")) {
    if (request.method === "OPTIONS") {
      const preflight = new NextResponse(null, { status: 204 });
      if (isAllowedOrigin && origin) {
        preflight.headers.set("Access-Control-Allow-Origin", origin);
        preflight.headers.set("Access-Control-Allow-Credentials", "true");
      }
      preflight.headers.set(
        "Access-Control-Allow-Methods",
        allowedMethods.join(", "),
      );
      preflight.headers.set(
        "Access-Control-Allow-Headers",
        allowedHeaders.join(", "),
      );
      preflight.headers.set("Vary", "Origin");
      return preflight;
    }

    const response = NextResponse.next();
    if (isAllowedOrigin && origin) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Credentials", "true");
    }
    response.headers.set("Access-Control-Allow-Methods", allowedMethods.join(", "));
    response.headers.set("Access-Control-Allow-Headers", allowedHeaders.join(", "));
    response.headers.set("Vary", "Origin");
    return response;
  }

  const sessionToken = request.cookies.get("ef_session")?.value;
  const signedIn = Boolean(sessionToken);

  if (pathname === "/") {
    if (!signedIn) {
      return NextResponse.redirect(new URL("/welcome", request.url));
    }
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    if (
      signedIn &&
      (pathname.startsWith("/auth/login") ||
        pathname.startsWith("/auth/register") ||
        pathname.startsWith("/welcome"))
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!signedIn) {
    return NextResponse.redirect(new URL("/welcome", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js).*)",
  ],
};
