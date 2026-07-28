import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const AUTH_ROUTES = ["/login", "/register"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/analysis") || pathname.startsWith("/api/job-applications")) {
    if (!req.auth) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (
    (pathname.startsWith("/vagas") || pathname.startsWith("/comparar")) &&
    !req.auth
  ) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  if (isAuthRoute && req.auth) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }
});

export const config = {
  matcher: [
    "/login",
    "/register",
    "/vagas/:path*",
    "/comparar/:path*",
    "/api/analysis/:path*",
    "/api/job-applications/:path*",
  ],
};
