import { spawn } from "node:child_process";

/** Runs `npm run db:migrate && npm run seed` in a child process and logs its output. */
export function runStartupSetup(): Promise<void> {
  return new Promise((resolve) => {
    console.log(
      "[setup] migrating the database and loading starting content...",
    );
    const child = spawn("sh", ["-c", "npm run db:migrate && npm run seed"], {
      cwd: process.cwd(),
      env: process.env,
      stdio: ["ignore", "inherit", "inherit"],
    });
    child.on("error", (e) => {
      console.error("[setup] could not start:", e);
      resolve();
    });
    child.on("exit", (code) => {
      if (code === 0) console.log("[setup] done");
      else
        console.error(
          `[setup] FAILED with exit code ${code}. See the lines above.`,
        );
      resolve();
    });
  });
}
