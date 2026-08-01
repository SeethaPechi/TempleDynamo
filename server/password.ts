import bcrypt from "bcrypt";

export const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verify password with automatic migration from legacy base64 storage.
 *
 * @param input          - The plaintext password the user submitted.
 * @param stored         - The value stored in the database (bcrypt hash or legacy base64).
 * @param userId         - The user's id, used only during the lazy migration write.
 * @param updatePassword - Callback to persist the new bcrypt hash (injected for testability).
 *
 * Returns true when the password is correct.
 * For bcrypt hashes: delegates to bcrypt.compare (correct constant-time compare).
 * For legacy base64:  decodes and compares; on success, silently re-hashes and stores.
 */
export async function verifyPassword(
  input: string,
  stored: string,
  userId: number,
  updatePassword: (id: number, hash: string) => Promise<void>,
): Promise<boolean> {
  if (stored.startsWith("$2b$") || stored.startsWith("$2a$")) {
    // Already bcrypt — correct constant-time comparison
    return bcrypt.compare(input, stored);
  }

  // Legacy base64 — decode and compare (migration path, runs at most once per account)
  const decoded = Buffer.from(stored, "base64").toString("utf-8");
  if (decoded !== input) return false;

  // Upgrade: re-hash with bcrypt then store (do NOT log input)
  const newHash = await bcrypt.hash(input, BCRYPT_ROUNDS);
  await updatePassword(userId, newHash);
  return true;
}
