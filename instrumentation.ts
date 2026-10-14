/**
 * Runs once when the production server starts. It creates/updates the database tables and loads
 * the starting content (both are safe to repeat: nothing existing is ever overwritten), so a
 * fresh Railway database sets itself up and no extra deploy setting is needed.
 * Set SKIP_AUTO_SETUP=true to turn this off.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NODE_ENV !== "production") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (!process.env.DATABASE_URL || process.env.SKIP_AUTO_SETUP === "true")
    return;

  const { runStartupSetup } = await import("./lib/startup-setup");
  // Not awaited: the server starts listening straight away while setup runs in the background.
  void runStartupSetup();
}
