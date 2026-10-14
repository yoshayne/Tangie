"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  adminEnabled,
  createSession,
  verifyLogin,
} from "@/lib/admin/auth";
import { rateLimit } from "@/lib/forms/rate-limit";

export type LoginState = { error?: string; email?: string };

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  if (!adminEnabled()) return { error: "Admin is not enabled." };

  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";
  // 5 attempts per 15 minutes per address.
  if (!(await rateLimit(`rl:login:${ip}`, 5, 900))) {
    return {
      error: "Too many attempts. Please wait 15 minutes and try again.",
    };
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const admin = email && password ? await verifyLogin(email, password) : null;
  if (!admin) return { error: "That email and password don't match.", email };

  (await cookies()).set(SESSION_COOKIE, await createSession(admin), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}
