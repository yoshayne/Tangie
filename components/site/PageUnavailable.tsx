/** Shown instead of an error screen if the database cannot be reached. */
export function PageUnavailable() {
  return (
    <div className="mx-auto max-w-[640px] px-6 py-32 text-center">
      <h1 className="font-display text-h2 text-heading">
        We&apos;re getting things ready
      </h1>
      <p className="mt-4 text-body text-copy">
        This page isn&apos;t available just yet. Please try again in a minute.
      </p>
    </div>
  );
}
