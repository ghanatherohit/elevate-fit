import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionEdge } from "@/lib/auth/edge-session";

const allowedOrigins = [
  "https://elevate-fit.vercel.app",
  "http://localhost:3000",
  // Dev/LAN only — leave CORS_EXTRA_ORIGINS empty in production.
  ...((process.env.NODE_ENV !== "production"
    ? (process.env.CORS_EXTRA_ORIGINS ?? "")
    : ""
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)),
];
const allowedMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
const allowedHeaders = ["Content-Type", "Authorization"];

const PUBLIC_PATHS = ["/auth/login", "/auth/register", "/welcome"];

/** API routes that do not require an authenticated session cookie. */
const PUBLIC_API_PATHS = [
  "/api/auth/session",
  "/api/auth/login",
  "/api/auth/resolve",
  "/api/auth/logout",
  "/api/auth/me",
  "/api/auth/username",
  "/api/cron/reminders",
  "/api/health",
  "/api/catalog",
];

const isPublicPath = (pathname: string) => {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
};

const isPublicApiPath = (pathname: string) => {
  return PUBLIC_API_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
};

function applyCors(response: NextResponse, origin: string | null, isAllowedOrigin: boolean) {
  if (isAllowedOrigin && origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }
  response.headers.set(
    "Access-Control-Allow-Methods",
    allowedMethods.join(", "),
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    allowedHeaders.join(", "),
  );
  response.headers.set("Vary", "Origin");
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get("origin");
  const isAllowedOrigin = origin ? allowedOrigins.includes(origin) : false;

  if (pathname.startsWith("/api")) {
    if (request.method === "OPTIONS") {
      const preflight = new NextResponse(null, { status: 204 });
      return applyCors(preflight, origin, isAllowedOrigin);
    }

    if (!isPublicApiPath(pathname)) {
      const sessionToken = request.cookies.get("ef_session")?.value;
      const session = sessionToken
        ? await verifySessionEdge(sessionToken)
        : null;
      if (!session) {
        const unauthorized = NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 },
        );
        return applyCors(unauthorized, origin, isAllowedOrigin);
      }
    }

    const response = NextResponse.next();
    return applyCors(response, origin, isAllowedOrigin);
  }

  const sessionToken = request.cookies.get("ef_session")?.value;
  const session = sessionToken ? await verifySessionEdge(sessionToken) : null;
  const signedIn = Boolean(session);

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
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/).*)",
  ],
};
