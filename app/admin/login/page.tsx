import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { adminEnabled } from "@/lib/admin/auth";
import { LoginForm } from "./LoginForm";

// Decided per request (not at build time), because the password variables can be added later.
async function LoginCard() {
  await connection();
  // No password set yet: the admin is open, so there is nothing to sign in to.
  if (!adminEnabled()) redirect("/admin");
  return (
    <div className="w-full max-w-sm border border-line bg-white p-8">
      <p className="font-display text-3xl text-heading">Tangie</p>
      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-stone">
        Admin sign in
      </p>
      <LoginForm />
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Suspense fallback={null}>
        <LoginCard />
      </Suspense>
    </main>
  );
}
