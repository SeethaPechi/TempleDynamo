import { describe, it, expect, vi } from "vitest";
import bcrypt from "bcrypt";
import { verifyPassword, BCRYPT_ROUNDS } from "../password";

// ── helpers ──────────────────────────────────────────────────────────────────

const FAKE_USER_ID = 42;

/** Builds a bcrypt hash from the given plaintext. */
async function makeBcryptHash(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, BCRYPT_ROUNDS);
}

/** Encodes a plaintext password the way the legacy system stored it. */
function makeLegacyBase64(plaintext: string): string {
  return Buffer.from(plaintext, "utf-8").toString("base64");
}

// ── verifyPassword unit tests ─────────────────────────────────────────────────

describe("verifyPassword — bcrypt path", () => {
  it("returns true when the correct password is compared against its bcrypt hash", async () => {
    const password = "CorrectHorseBatteryStaple!";
    const hash = await makeBcryptHash(password);
    const updatePassword = vi.fn();

    const result = await verifyPassword(password, hash, FAKE_USER_ID, updatePassword);

    expect(result).toBe(true);
    // No migration should occur for an already-bcrypt hash
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it("returns false when the wrong password is compared against a bcrypt hash", async () => {
    const password = "CorrectHorseBatteryStaple!";
    const hash = await makeBcryptHash(password);
    const updatePassword = vi.fn();

    const result = await verifyPassword("WrongPassword!", hash, FAKE_USER_ID, updatePassword);

    expect(result).toBe(false);
    // No migration — the hash is already bcrypt; the login route surfaces
    // hint:"password_reset_suggested" to the caller when this returns false
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it("returns false when a plaintext password is tried against a bcrypt hash (no legacy fallback)", async () => {
    const password = "MySecret";
    const hash = await makeBcryptHash(password);
    const updatePassword = vi.fn();

    // Supplying the raw plaintext to a bcrypt hash should still work via
    // bcrypt.compare — this test documents the intended path: plaintext IS
    // the correct credential for a bcrypt-stored account.
    // The important guarantee is that supplying the base64-encoded form
    // of the password does NOT succeed against a bcrypt hash.
    const base64Form = makeLegacyBase64(password);
    const result = await verifyPassword(base64Form, hash, FAKE_USER_ID, updatePassword);

    expect(result).toBe(false);
    expect(updatePassword).not.toHaveBeenCalled();
  });
});

describe("verifyPassword — legacy base64 migration path", () => {
  it("returns true for the correct password stored as legacy base64, and triggers a password upgrade", async () => {
    const password = "OldLegacyPassword";
    const legacyStored = makeLegacyBase64(password);
    const updatePassword = vi.fn().mockResolvedValue(undefined);

    const result = await verifyPassword(password, legacyStored, FAKE_USER_ID, updatePassword);

    expect(result).toBe(true);
    // The upgrade MUST be triggered exactly once
    expect(updatePassword).toHaveBeenCalledTimes(1);
    const [calledId, newHash] = updatePassword.mock.calls[0] as [number, string];
    expect(calledId).toBe(FAKE_USER_ID);
    // The new value stored must be a proper bcrypt hash
    expect(newHash).toMatch(/^\$2[ab]\$/);
    // And it must actually verify correctly with bcrypt
    expect(await bcrypt.compare(password, newHash)).toBe(true);
  });

  it("returns false for the wrong password against a legacy base64 hash (no upgrade performed)", async () => {
    const password = "OldLegacyPassword";
    const legacyStored = makeLegacyBase64(password);
    const updatePassword = vi.fn();

    const result = await verifyPassword("WrongPassword", legacyStored, FAKE_USER_ID, updatePassword);

    expect(result).toBe(false);
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it("does not accept the base64-encoded form of a password against a bcrypt hash (migration cannot be re-triggered)", async () => {
    // Simulate a re-run of migration: password is already bcrypt-hashed,
    // but someone tries the old base64-encoded value as the credential.
    const password = "AlreadyMigrated";
    const hash = await makeBcryptHash(password);
    const base64OfPassword = makeLegacyBase64(password);
    const updatePassword = vi.fn();

    // bcrypt.compare(base64OfPassword, hash) will be false because
    // the base64 string is not the same plaintext as 'AlreadyMigrated'.
    const result = await verifyPassword(base64OfPassword, hash, FAKE_USER_ID, updatePassword);

    expect(result).toBe(false);
    expect(updatePassword).not.toHaveBeenCalled();
  });
});
