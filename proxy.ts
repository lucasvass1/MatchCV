import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const AUTH_ROUTES = ["/login", "/register"];

export default auth((req) => {
  const isAuthRoute = AUTH_ROUTES.includes(req.nextUrl.pathname);

  if (isAuthRoute && req.auth) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }
});

export const config = {
  matcher: ["/login", "/register"],
};
