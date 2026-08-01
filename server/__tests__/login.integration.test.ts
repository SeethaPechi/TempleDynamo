/**
 * Integration tests for POST /api/auth/login
 *
 * These tests mount the real login route handler against mocked dependencies
 * (storage, DB pool, session store, email) so no live database is required.
 * They cover the three required cases:
 *   1. Correct bcrypt password  → 200 + session cookie set
 *   2. Wrong bcrypt password    → 401 with hint:"password_reset_suggested"
 *   3. Missing / empty body     → 400
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import express from "express";
import bcrypt from "bcrypt";
import { createServer, type Server } from "http";
import type { AddressInfo } from "net";

// ── Mocks (hoisted before module evaluation) ──────────────────────────────────

// Mock the DB pool so ensureResetTokensTable() and the PG session store never
// open a real database connection.
vi.mock("../db", () => ({
  pool: {
    query: vi.fn().mockResolvedValue({ rows: [] }),
    on: vi.fn(),
    connect: vi.fn(),
    end: vi.fn(),
  },
}));

// Replace connect-pg-simple with memorystore (already a project dependency)
// so the session middleware works without a live Postgres connection.
vi.mock("connect-pg-simple", async () => {
  const memorystore = await import("memorystore");
  const session = await import("express-session");
  const MemoryStore = memorystore.default(session.default);
  return {
    // connect-pg-simple exports a factory: (session) => StoreClass
    // We return a factory that ignores the `session` arg and gives MemoryStore.
    default: () => MemoryStore,
  };
});

// Storage mock — individual tests override getUserByEmail as needed.
vi.mock("../storage", () => ({
  storage: {
    getUserByEmail: vi.fn(),
    getUserById: vi.fn(),
    updateUserPassword: vi.fn().mockResolvedValue(undefined),
    createUser: vi.fn(),
    getAllUsers: vi.fn(),
    updateUserRole: vi.fn(),
    getAllRoles: vi.fn(),
    getAllRelationshipTypes: vi.fn(),
    createRelationshipType: vi.fn(),
    updateRelationshipType: vi.fn(),
    deletePasswordResetTokensByUser: vi.fn().mockResolvedValue(undefined),
    createPasswordResetToken: vi.fn().mockResolvedValue(undefined),
    getPasswordResetToken: vi.fn(),
    deletePasswordResetToken: vi.fn().mockResolvedValue(undefined),
  },
}));

// Email mock — not exercised by login, but routes.ts imports it.
vi.mock("../email", () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

// ── Test setup ────────────────────────────────────────────────────────────────

import { storage } from "../storage";

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  // Bypass CAPTCHA so tests never call Cloudflare's API.
  process.env.CAPTCHA_REQUIRED = "false";
  process.env.SESSION_SECRET = "integration-test-secret";

  const app = express();
  app.use(express.json());
  app.set("trust proxy", 1);

  // Import registerRoutes AFTER mocks are set up.
  const { registerRoutes } = await import("../routes");
  await registerRoutes(app);

  server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(() => {
  server?.close();
  delete process.env.CAPTCHA_REQUIRED;
  delete process.env.SESSION_SECRET;
});

beforeEach(() => {
  vi.clearAllMocks();
  // Re-apply the default no-op mock for updateUserPassword after clearAllMocks.
  vi.mocked(storage.updateUserPassword).mockResolvedValue(undefined);
});

// ── Helper ────────────────────────────────────────────────────────────────────

async function postLogin(body: unknown) {
  return fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/auth/login", () => {
  it("returns 200 and sets a session cookie when the correct bcrypt password is supplied", async () => {
    const plaintext = "CorrectPassword1!";
    const storedHash = await bcrypt.hash(plaintext, 10);

    vi.mocked(storage.getUserByEmail).mockResolvedValue({
      id: 1,
      email: "user@example.com",
      password: storedHash,
      firstName: "Test",
      lastName: "User",
      role: "user",
      templeId: null,
      phone: null,
      createdAt: new Date(),
    } as any);

    const res = await postLogin({ email: "user@example.com", password: plaintext });

    expect(res.status).toBe(200);

    const body = await res.json();
    // Password must NOT be included in the response.
    expect(body).not.toHaveProperty("password");
    expect(body.email).toBe("user@example.com");

    // Session cookie must be present so the client is authenticated.
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBeTruthy();
  });

  it("returns 401 with hint:password_reset_suggested when the wrong password is supplied for a bcrypt-hashed account", async () => {
    const storedHash = await bcrypt.hash("ActualPassword!", 10);

    vi.mocked(storage.getUserByEmail).mockResolvedValue({
      id: 2,
      email: "migrated@example.com",
      password: storedHash,
      firstName: "Migrated",
      lastName: "User",
      role: "user",
      templeId: null,
      phone: null,
      createdAt: new Date(),
    } as any);

    const res = await postLogin({ email: "migrated@example.com", password: "WrongPassword!" });

    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.message).toBe("Invalid email or password");
    // The hint guides the user toward self-service password reset rather than
    // leaving them locked out with no direction.
    expect(body.hint).toBe("password_reset_suggested");
  });

  it("does NOT include hint when an unknown email is submitted (no user found)", async () => {
    vi.mocked(storage.getUserByEmail).mockResolvedValue(null as any);

    const res = await postLogin({ email: "unknown@example.com", password: "anyPassword" });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.message).toBe("Invalid email or password");
    // Hint must be absent — we have no knowledge of the account's hash type.
    expect(body).not.toHaveProperty("hint");
  });

  it("returns 400 when the request body is missing entirely", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "",
    });

    expect(res.status).toBe(400);
  });

  it("returns 400 when email is missing from the request body", async () => {
    const res = await postLogin({ password: "SomePassword1!" });

    expect(res.status).toBe(400);
  });

  it("returns 400 when password is missing from the request body", async () => {
    const res = await postLogin({ email: "user@example.com" });

    expect(res.status).toBe(400);
  });

  it("returns 400 when email is not a valid email address", async () => {
    const res = await postLogin({ email: "not-an-email", password: "SomePassword1!" });

    expect(res.status).toBe(400);
  });
});
