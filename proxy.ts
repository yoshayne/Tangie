import { NextResponse, type NextRequest } from "next/server";

// Stub for M1. Later milestones add the admin cookie check (M6) and the
// redirects-table lookup (M4).
export function proxy(request: NextRequest) {
  void request;
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
