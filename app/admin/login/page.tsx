import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm border border-line bg-white p-8">
        <p className="font-display text-3xl text-heading">Tangie</p>
        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-stone">
          Admin sign in
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
