import { NextRequest, NextResponse } from "next/server";

// Password gate for the whole tool. The dashboard and its API routes carry
// subscriber contact data, so nothing is served without the team password,
// set as SENA_DASHBOARD_PASSWORD in the Vercel project settings. Any username
// works; only the password is checked. If the variable is missing, the gate
// stays shut rather than falling open.
//
// One exception: GET /api/run-deep, which the GitHub Actions scheduler calls
// every 10 minutes. A GET can only advance a scan someone already started from
// the dashboard (it can't start or restart one) and returns progress counts,
// never lead data.

const REALM = 'Basic realm="Sena Prospect Pipeline", charset="UTF-8"';

function unauthorized() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": REALM },
  });
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function proxy(req: NextRequest) {
  if (req.method === "GET" && req.nextUrl.pathname === "/api/run-deep") {
    return NextResponse.next();
  }

  const password = process.env.SENA_DASHBOARD_PASSWORD;
  if (!password) {
    return new NextResponse("Access is locked until SENA_DASHBOARD_PASSWORD is set.", { status: 503 });
  }

  const header = req.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6).trim());
      const supplied = decoded.slice(decoded.indexOf(":") + 1);
      if (safeEqual(supplied, password)) return NextResponse.next();
    } catch {
      // malformed header falls through to the challenge
    }
  }
  return unauthorized();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
