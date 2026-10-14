import { notFound } from "next/navigation";

// proxy.ts rewrites unknown addresses here. Calling notFound() before anything streams makes the
// response a real HTTP 404 (and Next adds noindex), rendering app/(site)/not-found.tsx.
export default function NotFoundPage() {
  notFound();
}
