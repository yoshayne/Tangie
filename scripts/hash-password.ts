/**
 * Makes the bcrypt hash for ADMIN_PASSWORD_HASH so the password itself never goes in Railway or the repo.
 *   npm run hash-password -- "your password here"
 */
import { hash } from "bcryptjs";

async function main() {
  const password = process.argv[2];
  if (!password || password.length < 12) {
    console.error(
      'Usage: npm run hash-password -- "a password of at least 12 characters"',
    );
    process.exit(1);
  }
  console.log(await hash(password, 12));
}

main();
