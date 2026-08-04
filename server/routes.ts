import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getRelationshipsFor } from "./relationships-resolver";
import { insertMemberSchema, insertRelationshipSchema, insertTempleSchema, insertUserSchema, loginUserSchema } from "@shared/schema";
import { whatsappService } from "./whatsapp";
import { z } from "zod";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import rateLimit from "express-rate-limit";
import { pool } from "./db";
import { db } from "./db";
import { relationships as relationshipsTable, members as membersTable } from "@shared/schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "./password";
import { sendPasswordResetEmail } from "./email";
import crypto from "crypto";

const VALID_ROLES = ["system_admin", "temple_admin", "user"] as const;

// ---------------------------------------------------------------------------
// syncNameRelationships — auto-creates relationship rows from the
// father_name / mother_name / spouse_name text fields on a member.
//
// Rules:
//  • Only links when exactly ONE registry member matches the name (avoids
//    ambiguous duplicate-name cases).
//  • Does NOT create a row if any relationship row already exists between
//    the two members in either direction (prevents duplicates).
//  • Reverse direction is handled automatically by the bidirectional resolver
//    at query time — no extra rows are needed.
// ---------------------------------------------------------------------------
async function syncNameRelationships(memberId: number): Promise<void> {
  try {
    const member = await storage.getMember(memberId);
    if (!member) return;

    const allMembers = await storage.getAllMembers();

    // Case-insensitive name → Member[] index (excluding self)
    const byName = new Map<string, typeof allMembers>();
    for (const m of allMembers) {
      if (m.id === memberId) continue;
      const key = m.fullName.trim().toLowerCase();
      if (!byName.has(key)) byName.set(key, []);
      byName.get(key)!.push(m);
    }

    // All existing relationship rows involving this member (both directions)
    const fwdRows = await db
      .select({ relatedId: relationshipsTable.relatedMemberId })
      .from(relationshipsTable)
      .where(eq(relationshipsTable.memberId, memberId));
    const revRows = await db
      .select({ subjectId: relationshipsTable.memberId })
      .from(relationshipsTable)
      .where(eq(relationshipsTable.relatedMemberId, memberId));

    const alreadyLinked = new Set<number>([
      ...fwdRows.map((r) => r.relatedId),
      ...revRows.map((r) => r.subjectId),
    ]);

    const tryLink = (nameField: string | null | undefined, type: string) => {
      if (!nameField) return;
      const matches = byName.get(nameField.trim().toLowerCase());
      if (!matches || matches.length !== 1) return; // not found or ambiguous
      const target = matches[0];
      if (alreadyLinked.has(target.id)) return; // already linked
      alreadyLinked.add(target.id); // prevent double-creation in same pass
      storage.createRelationship({ memberId, relationshipType: type, relatedMemberId: target.id })
        .then(() => syncReverseNameFields(memberId, type, target.id))
        .catch((err) => console.error(`syncNameRelationships: failed to create ${type} row`, err));
    };

    tryLink(member.fatherName, "Father");
    tryLink(member.motherName, "Mother");
    if (member.spouseName) {
      tryLink(member.spouseName, member.gender === "Female" ? "Husband" : "Wife");
    }
  } catch (err) {
    // Non-fatal — log and continue
    console.error("syncNameRelationships error:", err);
  }
}

// ---------------------------------------------------------------------------
// syncReverseNameFields — when a relationship row is created, update the
// reverse member's text name-fields so both sides stay in sync.
//
// Examples:
//   (Geetha → Husband → Venkat)  → Venkat.spouseName = "Geetha"
//   (Dad    → Son     → Child)   → Child.fatherName  = "Dad" (if male)
//   (Mum    → Daughter→ Child)   → Child.motherName  = "Mum" (if female)
//   (Child  → Father  → Dad)     → Child.fatherName  = "Dad" (if empty/Don't Know)
//   (Child  → Mother  → Mum)     → Child.motherName  = "Mum" (if empty/Don't Know)
// ---------------------------------------------------------------------------
async function syncReverseNameFields(
  memberId: number,
  relationshipType: string,
  relatedMemberId: number,
): Promise<void> {
  try {
    const [memberA, memberB] = await Promise.all([
      storage.getMember(memberId),
      storage.getMember(relatedMemberId),
    ]);
    if (!memberA || !memberB) return;

    const EMPTY = ["", "don't know", "dont know", "unknown", "n/a"];
    const isEmpty = (v: string | null | undefined) =>
      !v || EMPTY.includes(v.trim().toLowerCase());

    // Helper: update a single text field on a member row (no-op if already correct)
    const patch = async (targetId: number, field: "spouseName" | "fatherName" | "motherName", value: string) => {
      await db
        .update(membersTable)
        .set({ [field]: value } as Record<string, string>)
        .where(eq(membersTable.id, targetId));
    };

    switch (relationshipType) {
      // ── Spouse: both members get each other's name ─────────────────────
      case "Husband":
      case "Wife":
        // B is the spouse of A → B.spouseName = A's name
        if (isEmpty(memberB.spouseName) || memberB.spouseName?.toLowerCase() === "don't know") {
          await patch(memberB.id, "spouseName", memberA.fullName);
        }
        // A.spouseName should already be set, but fill it if missing
        if (isEmpty(memberA.spouseName) || memberA.spouseName?.toLowerCase() === "don't know") {
          await patch(memberA.id, "spouseName", memberB.fullName);
        }
        break;

      // ── A has Son/Daughter B → update B's parent name field ───────────
      case "Son":
      case "Step-Son":
        if (memberA.gender === "Female") {
          if (isEmpty(memberB.motherName)) await patch(memberB.id, "motherName", memberA.fullName);
        } else {
          if (isEmpty(memberB.fatherName)) await patch(memberB.id, "fatherName", memberA.fullName);
        }
        break;

      case "Daughter":
      case "Step-Daughter":
        if (memberA.gender === "Female") {
          if (isEmpty(memberB.motherName)) await patch(memberB.id, "motherName", memberA.fullName);
        } else {
          if (isEmpty(memberB.fatherName)) await patch(memberB.id, "fatherName", memberA.fullName);
        }
        break;

      // ── A's Father/Mother is B → fill A's name field if missing ───────
      case "Father":
      case "Step Father":
        if (isEmpty(memberA.fatherName)) await patch(memberA.id, "fatherName", memberB.fullName);
        break;

      case "Mother":
      case "Step Mother":
        if (isEmpty(memberA.motherName)) await patch(memberA.id, "motherName", memberB.fullName);
        break;
    }
  } catch (err) {
    console.error("syncReverseNameFields error:", err);
  }
}

// ── Cloudflare Turnstile CAPTCHA verification ───────────────────────────────

/**
 * Verify a Turnstile token server-side.
 *
 * @param token      - The CAPTCHA response token from the browser widget.
 * @param remoteip   - The visitor's IP address (forwarded from the request).
 *                     Passing this ties the token to the origin IP so a token
 *                     captured on tamilkovil.com cannot be replayed from a
 *                     different host/IP.
 *
 * Domain restriction (which hostnames may issue tokens) must also be
 * configured in the Cloudflare Turnstile dashboard — see docs/captcha-setup.md.
 */
// How long (ms) to wait for Cloudflare's siteverify endpoint before giving up.
// On timeout the request is treated as a network outage and the login is
// allowed through (fail-open) so a Cloudflare outage cannot lock users out.
const CAPTCHA_TIMEOUT_MS = 5_000;

async function verifyCaptcha(
  token: string | undefined,
  remoteip?: string,
): Promise<boolean> {
  // ── Dev bypass ──────────────────────────────────────────────────────────────
  // In development the Turnstile widget can't load on *.replit.dev domains
  // (Cloudflare restricts it to the registered production domain).
  // Accept a sentinel token so the dev workflow is never blocked.
  if (process.env.NODE_ENV !== "production") {
    if (token === "dev-bypass") return true;
  }

  // ── Emergency bypass ────────────────────────────────────────────────────────
  // Set CAPTCHA_REQUIRED=false in the environment to skip CAPTCHA verification
  // entirely without a code deploy.  Log a warning every time so the bypass
  // never goes unnoticed in production logs.
  if (process.env.CAPTCHA_REQUIRED === "false") {
    console.warn(
      "[captcha] CAPTCHA_REQUIRED=false — verification bypassed; " +
      "re-enable before accepting real traffic",
    );
    return true;
  }

  if (!token) return false;
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error("[captcha] TURNSTILE_SECRET_KEY not configured");
    return false;
  }
  try {
    const payload: Record<string, string> = { secret, response: token };
    if (remoteip) payload.remoteip = remoteip;

    // Abort the request if Cloudflare takes too long so the login route is
    // not stalled indefinitely during an outage.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CAPTCHA_TIMEOUT_MS);

    let resp: Response;
    try {
      resp = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        },
      );
    } finally {
      clearTimeout(timeoutId);
    }

    const data = (await resp.json()) as {
      success: boolean;
      "error-codes"?: string[];
    };
    if (!data.success) {
      console.warn(
        "[captcha] verification failed — " +
        `error_codes=${JSON.stringify(data["error-codes"] ?? [])}`,
      );
    }
    return data.success === true;
  } catch (err: any) {
    // Distinguish a deliberate timeout abort from other network errors.
    const isTimeout = err?.name === "AbortError";
    console.warn(
      isTimeout
        ? `[captcha] siteverify timed out after ${CAPTCHA_TIMEOUT_MS} ms — ` +
          "failing open to prevent Cloudflare outage from locking users out"
        : "[captcha] siteverify network error — failing open —",
      isTimeout ? undefined : err,
    );
    // Fail-open: allow the login/register through so a Cloudflare network
    // outage does not become a production lockout.  The warnings above ensure
    // the operations team is aware of the degraded state.
    return true;
  }
}

// ── Rate limiters ───────────────────────────────────────────────────────────

// ── Why no custom keyGenerator? ────────────────────────────────────────────
// express-rate-limit's built-in default already keys on req.ip (with full
// IPv6 normalisation).  Because `app.set("trust proxy", 1)` is set in
// server/index.ts, Express reads the first value from the X-Forwarded-For
// header and exposes it as req.ip — so the limiter throttles by the *real
// visitor IP*, not the shared CDN/proxy address.  Overriding keyGenerator
// here would bypass the library's IPv6 helper and risk keying on a raw
// socket address if trust proxy is ever misconfigured.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { message: "Too many attempts — please wait 15 minutes and try again." },
  standardHeaders: true,
  legacyHeaders: false,

  // Log every time a visitor hits the ceiling so operational issues
  // (e.g. trust proxy accidentally disabled, all traffic keying on the
  // same proxy IP) surface immediately in server logs.
  handler: (req, res, _next, options) => {
    console.warn(
      `[rate-limit] auth limit reached — ip=${req.ip} ` +
      `socket=${req.socket.remoteAddress} path=${req.path}`,
    );
    res.status(options.statusCode).json(options.message);
  },
});

// Authentication middleware
function requireAuth(req: any, res: any, next: any) {
  if (req.session?.userId) {
    next();
  } else {
    res.status(401).json({ message: "Authentication required" });
  }
}

// System admin middleware
async function requireSystemAdmin(req: any, res: any, next: any) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  const user = await storage.getUserById(req.session.userId);
  if (!user || user.role !== "system_admin") {
    return res.status(403).json({ message: "System admin access required" });
  }
  next();
}

// ── Reset-token helpers ─────────────────────────────────────────────────────

/** Generate a cryptographically random URL-safe token (48 bytes → 64 chars). */
function generateResetToken(): string {
  return crypto.randomBytes(48).toString("base64url");
}

/** SHA-256 hash of the raw token — what we store in the DB. */
function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/**
 * Return the canonical base URL used in reset links.
 *
 * Priority:
 *   1. APP_BASE_URL — set this in production (e.g. https://tamilkovil.com).
 *      Required in production: if it is absent the function throws so the
 *      misconfiguration is caught at deploy time, not discovered via a
 *      host-header poisoning exploit.
 *   2. Development only fallback — derived from the Replit dev-domain env var.
 *      This is intentionally never request-derived, so an attacker cannot
 *      poison the host header to point the link at a different origin.
 *
 * Never build this from req.headers.host / x-forwarded-host — doing so opens
 * a host-header poisoning attack where an attacker triggers a reset for a
 * victim and causes the token to be sent in a link pointing at attacker.com.
 */
function getBaseUrl(): string {
  // Explicit canonical origin — always preferred.
  if (process.env.APP_BASE_URL) {
    return process.env.APP_BASE_URL.replace(/\/$/, "");
  }

  // In production we require the explicit origin to prevent poisoning.
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[forgot-password] APP_BASE_URL must be set in production. " +
      "Password reset links cannot be generated without a trusted canonical origin.",
    );
  }

  // Development: use the Replit dev domain if available, else localhost.
  const replitDomain = process.env.REPLIT_DEV_DOMAIN;
  if (replitDomain) {
    return `https://${replitDomain}`;
  }
  return "http://localhost:5000";
}

// ── One-time DB table setup ─────────────────────────────────────────────────
async function ensureResetTokensTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash  TEXT    NOT NULL UNIQUE,
      expires_at  TIMESTAMP NOT NULL,
      created_at  TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_prt_token_hash ON password_reset_tokens (token_hash);
    CREATE INDEX IF NOT EXISTS idx_prt_user_id    ON password_reset_tokens (user_id);
  `);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Ensure the password_reset_tokens table exists before the app starts.
  await ensureResetTokensTable();

  // Configure session middleware with Postgres-backed store so sessions
  // survive server restarts and scale across multiple processes.
  const PgSession = connectPgSimple(session);
  app.use(session({
    store: new PgSession({
      pool,                        // reuse the existing connection pool
      tableName: "session",        // default table name
      createTableIfMissing: true,  // auto-create session table on first run
      pruneSessionInterval: 900,   // delete expired rows every 15 minutes
    }),
    secret: process.env.SESSION_SECRET || 'temple-management-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Authentication Routes
  app.post("/api/auth/register", authLimiter, async (req, res) => {
    try {
      // Verify CAPTCHA before anything else
      const captchaOk = await verifyCaptcha(req.body.captchaToken, req.ip);
      if (!captchaOk) {
        return res.status(400).json({ message: "CAPTCHA verification failed. Please try again." });
      }

      const userData = insertUserSchema.parse(req.body);

      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      const hashedPassword = await hashPassword(userData.password);
      const user = await storage.createUser({ ...userData, password: hashedPassword });

      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error registering user:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  app.post("/api/auth/login", authLimiter, async (req, res) => {
    try {
      // Verify CAPTCHA before anything else
      const captchaOk = await verifyCaptcha(req.body.captchaToken, req.ip);
      if (!captchaOk) {
        return res.status(400).json({ message: "CAPTCHA verification failed. Please try again." });
      }

      const { email, password } = loginUserSchema.parse(req.body);

      const user = await storage.getUserByEmail(email);
      // Use generic message to avoid user-enumeration
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const passwordOk = await verifyPassword(
        password,
        user.password,
        user.id,
        (id, hash) => storage.updateUserPassword(id, hash),
      );
      if (!passwordOk) {
        // When the stored hash is already bcrypt the account has been migrated.
        // A wrong password here likely means the user still has their old
        // password in mind — surface a reset hint so they can self-serve.
        const isBcrypt =
          user.password.startsWith("$2b$") || user.password.startsWith("$2a$");
        return res.status(401).json({
          message: "Invalid email or password",
          ...(isBcrypt && { hint: "password_reset_suggested" }),
        });
      }

      (req.session as any).userId = user.id;

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error logging in:", error);
      res.status(500).json({ message: "Failed to log in" });
    }
  });

  // ── Forgot password: request a reset link ───────────────────────────────
  app.post("/api/auth/forgot-password", authLimiter, async (req, res) => {
    try {
      const { email } = z.object({ email: z.string().email() }).parse(req.body);

      // Always respond generically — don't reveal whether the email exists.
      const genericOk = () =>
        res.json({ message: "If that email is registered you will receive a reset link shortly." });

      const user = await storage.getUserByEmail(email);
      if (!user) return genericOk();

      // Invalidate any previous tokens for this user so there is only one live
      // reset link at a time.
      await storage.deletePasswordResetTokensByUser(user.id);

      const rawToken = generateResetToken();
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await storage.createPasswordResetToken(user.id, tokenHash, expiresAt);

      const resetUrl = `${getBaseUrl()}/reset-password?token=${rawToken}`;
      await sendPasswordResetEmail({
        toEmail: user.email,
        firstName: user.firstName,
        resetUrl,
      });

      return genericOk();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Please provide a valid email address." });
      }
      console.error("[forgot-password] error:", error);
      res.status(500).json({ message: "Failed to process request. Please try again." });
    }
  });

  // ── Reset password: set a new password using the token ──────────────────
  app.post("/api/auth/reset-password", authLimiter, async (req, res) => {
    try {
      const { token, password } = z
        .object({
          token: z.string().min(1),
          password: z.string().min(8, "Password must be at least 8 characters"),
        })
        .parse(req.body);

      const tokenHash = hashToken(token);
      const record = await storage.getPasswordResetToken(tokenHash);

      if (!record) {
        return res.status(400).json({ message: "Invalid or expired reset link. Please request a new one." });
      }

      if (new Date() > record.expiresAt) {
        await storage.deletePasswordResetToken(tokenHash);
        return res.status(400).json({ message: "This reset link has expired. Please request a new one." });
      }

      const hash = await hashPassword(password);
      await storage.updateUserPassword(record.userId, hash);

      // Consume the token so it cannot be reused.
      await storage.deletePasswordResetToken(tokenHash);

      console.info(`[reset-password] password updated for userId=${record.userId}`);
      res.json({ message: "Password updated successfully. You can now sign in with your new password." });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message ?? "Invalid request." });
      }
      console.error("[reset-password] error:", error);
      res.status(500).json({ message: "Failed to reset password. Please try again." });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session?.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({ message: "Failed to log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!(req.session as any)?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUserById((req.session as any).userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  // ── Admin Routes (system_admin only) ──────────────────────────────────────

  // List all users with their roles
  app.get("/api/admin/users", requireSystemAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const sanitized = allUsers.map(({ password, ...u }) => u);
      res.json(sanitized);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Update a user's role
  app.put("/api/admin/users/:id/role", requireSystemAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid user ID" });

      const { role } = req.body;
      if (!VALID_ROLES.includes(role)) {
        return res.status(400).json({ message: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` });
      }

      const updated = await storage.updateUserRole(id, role);
      if (!updated) return res.status(404).json({ message: "User not found" });

      const { password, ...userWithoutPassword } = updated;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  // List all available roles
  app.get("/api/admin/roles", requireSystemAdmin, async (req, res) => {
    try {
      const allRoles = await storage.getAllRoles();
      res.json(allRoles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch roles" });
    }
  });

  // ── One-shot: sync name-field relationships for all members ─────────────
  app.post("/api/admin/sync-name-relationships", requireSystemAdmin, async (req, res) => {
    try {
      const allMembers = await storage.getAllMembers();
      for (const m of allMembers) {
        await syncNameRelationships(m.id);
      }
      res.json({ ok: true, synced: allMembers.length });
    } catch (err) {
      console.error("sync-name-relationships error:", err);
      res.status(500).json({ message: "Sync failed" });
    }
  });

  // ── Relationship Types (system_admin only) ────────────────────────────────
  app.get("/api/admin/relationship-types", requireSystemAdmin, async (req, res) => {
    try { res.json(await storage.getAllRelationshipTypes()); }
    catch { res.status(500).json({ message: "Failed to fetch relationship types" }); }
  });

  app.post("/api/admin/relationship-types", requireSystemAdmin, async (req, res) => {
    try {
      const { name, labelEn, labelTa, category } = req.body;
      if (!name || !labelEn) return res.status(400).json({ message: "name and labelEn are required" });
      const rt = await storage.createRelationshipType({ name, labelEn, labelTa: labelTa || null, category: category || null });
      res.json(rt);
    } catch (e: any) {
      if (e?.code === "23505") return res.status(400).json({ message: "Relationship type name already exists" });
      res.status(500).json({ message: "Failed to create relationship type" });
    }
  });

  app.put("/api/admin/relationship-types/:id", requireSystemAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const { name, labelEn, labelTa, category } = req.body;
      const updated = await storage.updateRelationshipType(id, { name, labelEn, labelTa: labelTa || null, category: category || null });
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch { res.status(500).json({ message: "Failed to update relationship type" }); }
  });

  app.delete("/api/admin/relationship-types/:id", requireSystemAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      await storage.deleteRelationshipType(id);
      res.json({ message: "Deleted" });
    } catch { res.status(500).json({ message: "Failed to delete relationship type" }); }
  });

  // ── Relationship Map (all relationships with member names) ────────────────
  app.get("/api/admin/relationship-map", requireSystemAdmin, async (req, res) => {
    try { res.json(await storage.getAllRelationshipsForMap()); }
    catch { res.status(500).json({ message: "Failed to fetch relationship map" }); }
  });

  // ── Temple Members (full member info + temple name join) ──────────────────
  app.get("/api/admin/temple-members", requireSystemAdmin, async (req, res) => {
    try { res.json(await storage.getAllMembersWithTemple()); }
    catch { res.status(500).json({ message: "Failed to fetch temple members" }); }
  });

  // ── Temple Admin assignments ───────────────────────────────────────────────
  app.get("/api/admin/temple-admins", requireSystemAdmin, async (req, res) => {
    try { res.json(await storage.getAllTemplesWithAdmin()); }
    catch { res.status(500).json({ message: "Failed to fetch temple admins" }); }
  });

  app.put("/api/admin/temple-admins/:templeId", requireSystemAdmin, async (req, res) => {
    try {
      const templeId = parseInt(req.params.templeId);
      if (isNaN(templeId)) return res.status(400).json({ message: "Invalid temple ID" });
      const { adminUserId } = req.body; // null to clear
      const updated = await storage.updateTempleAdmin(templeId, adminUserId ?? null);
      if (!updated) return res.status(404).json({ message: "Temple not found" });
      res.json(updated);
    } catch { res.status(500).json({ message: "Failed to update temple admin" }); }
  });

  // ── Admin: Overview Doc ────────────────────────────────────────────────────
  app.get("/api/admin/overview-doc", requireSystemAdmin, async (req, res) => {
    try {
      const fs = await import("fs/promises");
      const path = await import("path");
      const filePath = path.resolve(process.cwd(), "TAMIL_KOVIL_APP_OVERVIEW.md");
      const content = await fs.readFile(filePath, "utf-8");
      res.json({ content });
    } catch {
      res.status(500).json({ message: "Could not read overview document" });
    }
  });

  // ── Health check endpoint ───────────────────────────────────────────────────
  // Rows beyond this count trigger a warning in the health response.
  // Override by setting SESSION_TABLE_WARN_THRESHOLD in the environment.
  const SESSION_TABLE_WARN_THRESHOLD =
    parseInt(process.env.SESSION_TABLE_WARN_THRESHOLD ?? "", 10) || 10_000;

  app.get("/api/health", async (req, res) => {
    try {
      // Test database connection by trying to get members
      await storage.getAllMembers();

      // Count session table rows so operators can spot unbounded growth without
      // querying the database directly.
      let sessionTableRows: number | null = null;
      let sessionTableWarning = false;
      try {
        const result = await pool.query<{ count: string }>(
          "SELECT COUNT(*) AS count FROM session",
        );
        sessionTableRows = parseInt(result.rows[0].count, 10);
        if (sessionTableRows > SESSION_TABLE_WARN_THRESHOLD) {
          sessionTableWarning = true;
          console.warn(
            `[health] session table has ${sessionTableRows} rows ` +
            `(threshold: ${SESSION_TABLE_WARN_THRESHOLD}) — ` +
            "consider investigating whether pruning is running",
          );
        }
      } catch (sessionErr: any) {
        // Non-fatal: report null rather than failing the whole health check
        console.warn("[health] could not count session table rows:", sessionErr?.message);
      }

      res.json({
        status: "healthy",
        database: "connected",
        timestamp: new Date().toISOString(),
        sessionTableRows,
        ...(sessionTableWarning && {
          sessionTableWarning: `Row count exceeds threshold of ${SESSION_TABLE_WARN_THRESHOLD}`,
        }),
      });
    } catch (error: any) {
      console.error("Health check failed:", error);
      res.status(500).json({ status: "unhealthy", database: "disconnected", error: error?.message || "Unknown error" });
    }
  });

  // Serve Tamil Kovil interface
  app.get("/tamil-kovil-interface.html", (req, res) => {
    import("path").then(({ default: path }) => {
      import("fs").then(({ default: fs }) => {
        const filePath = path.join(process.cwd(), "deployment", "tamil-kovil-interface.html");
        
        if (fs.existsSync(filePath)) {
          res.sendFile(filePath);
        } else {
          res.status(404).send("Tamil Kovil interface file not found");
        }
      });
    });
  });

  // Serve production React app (exact development UI)
  app.get("/production-app.html", (req, res) => {
    import("path").then(({ default: path }) => {
      import("fs").then(({ default: fs }) => {
        const filePath = path.join(process.cwd(), "deployment", "production-react-app.html");
        
        if (fs.existsSync(filePath)) {
          res.sendFile(filePath);
        } else {
          res.status(404).send("Production React app file not found");
        }
      });
    });
  });

  // Member routes (protected)
  app.post("/api/members", requireAuth, async (req, res) => {
    try {
      const memberData = insertMemberSchema.parse(req.body);
      
      // Allow duplicate emails and phone numbers - no uniqueness check
      
      const member = await storage.createMember(memberData);
      // Fire-and-forget: link any name fields that match registry members
      syncNameRelationships(member.id);
      res.json(member);
    } catch (error) {
      console.error("Error creating member:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create member" });
    }
  });

  // Helper: apply Tamil field fallback when lang=ta is requested
  const applyLangCoalesce = (member: any, lang: string) => {
    if (lang !== "ta") return member;
    return {
      ...member,
      fullName: member.fullNameTa || member.fullName,
      fatherName: member.fatherNameTa || member.fatherName,
      motherName: member.motherNameTa || member.motherName,
      spouseName: member.spouseNameTa || member.spouseName,
      birthCity: member.birthCityTa || member.birthCity,
      currentCity: member.currentCityTa || member.currentCity,
    };
  };

  app.get("/api/members", requireAuth, async (req, res) => {
    try {
      const { search, city, state, lang } = req.query;
      
      if (search || city || state) {
        const memberList = await storage.searchMembers(
          search as string || "",
          city as string,
          state as string
        );
        res.json(memberList.map((m) => applyLangCoalesce(m, lang as string)));
      } else {
        const memberList = await storage.getAllMembers();
        res.json(memberList.map((m) => applyLangCoalesce(m, lang as string)));
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  app.get("/api/members/search", async (req, res) => {
    try {
      const { term, city, state } = req.query;
      
      if (!term || typeof term !== 'string' || term.length < 2) {
        return res.json([]);
      }
      
      const members = await storage.searchMembers(
        term as string,
        city as string,
        state as string
      );
      res.json(members);
    } catch (error) {
      console.error("Error searching members:", error);
      res.status(500).json({ message: "Failed to search members" });
    }
  });

  // Get unique cities from members - MUST come before /:id route
  app.get("/api/members/cities", async (req, res) => {
    try {
      const cities = await storage.getUniqueCities();
      res.json(cities);
    } catch (error) {
      console.error("Error fetching cities:", error);
      res.status(500).json({ message: "Failed to fetch cities" });
    }
  });

  // Get unique states from members - MUST come before /:id route
  app.get("/api/members/states", async (req, res) => {
    try {
      const states = await storage.getUniqueStates();
      res.json(states);
    } catch (error) {
      console.error("Error fetching states:", error);
      res.status(500).json({ message: "Failed to fetch states" });
    }
  });

  app.get("/api/members/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const member = await storage.getMember(id);
      
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      console.log(`API returning member ${id}:`, {
        id: member.id,
        name: member.fullName,
        hasProfilePicture: !!member.profilePicture,
        profilePictureLength: member.profilePicture?.length || 0,
        photosCount: member.photos?.length || 0,
        photos: member.photos?.map((p, i) => `Photo ${i}: ${p.substring(0, 30)}...`)
      });
      
      res.json(member);
    } catch (error) {
      console.error("Error fetching member:", error);
      res.status(500).json({ message: "Failed to fetch member" });
    }
  });

  // Update member (PUT for full updates)
  app.put("/api/members/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid member ID" });
      }

      const existingMember = await storage.getMember(id);
      if (!existingMember) {
        return res.status(404).json({ message: "Member not found" });
      }

      const memberData = insertMemberSchema.parse(req.body);
      const updatedMember = await storage.updateMember(id, memberData);
      syncNameRelationships(id);
      res.json(updatedMember);
    } catch (error) {
      console.error("Error updating member:", error);
      res.status(500).json({ message: "Failed to update member" });
    }
  });

  // Update member (PATCH for partial updates)
  app.patch("/api/members/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid member ID" });
      }

      const existingMember = await storage.getMember(id);
      if (!existingMember) {
        return res.status(404).json({ message: "Member not found" });
      }

      // Log request size for debugging
      const requestSize = JSON.stringify(req.body).length;
      console.log(`PATCH /api/members/${id} - Request size: ${requestSize} bytes`);
      
      // Validate photos array if present
      if (req.body.photos && Array.isArray(req.body.photos)) {
        console.log(`Photos array length: ${req.body.photos.length}`);
        req.body.photos.forEach((photo: string, index: number) => {
          if (typeof photo === 'string' && photo.length > 0) {
            console.log(`Photo ${index}: ${photo.substring(0, 50)}...`);
          }
        });
      }
      
      // Validate profile picture if present
      if (req.body.profilePicture) {
        console.log(`Profile picture: ${req.body.profilePicture.substring(0, 50)}...`);
      }

      const memberData = insertMemberSchema.parse(req.body);
      const updatedMember = await storage.updateMember(id, memberData);
      syncNameRelationships(id);
      console.log(`Member updated successfully - ID: ${id}`);
      res.json(updatedMember);
    } catch (error) {
      console.error("Error updating member:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: error.errors,
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        });
      }
      res.status(500).json({ message: "Failed to update member", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Delete member
  app.delete("/api/members/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid member ID" });
      }

      const existingMember = await storage.getMember(id);
      if (!existingMember) {
        return res.status(404).json({ message: "Member not found" });
      }

      await storage.deleteMember(id);
      res.json({ message: "Member deleted successfully" });
    } catch (error) {
      console.error("Error deleting member:", error);
      res.status(500).json({ message: "Failed to delete member" });
    }
  });

  // Relationship routes (protected)  
  app.post("/api/relationships", requireAuth, async (req, res) => {
    try {
      const relationshipData = insertRelationshipSchema.parse(req.body);
      
      // Verify both members exist
      const member1 = await storage.getMember(relationshipData.memberId);
      const member2 = await storage.getMember(relationshipData.relatedMemberId);
      
      if (!member1 || !member2) {
        return res.status(400).json({ message: "One or both members not found" });
      }
      
      const relationship = await storage.createRelationship(relationshipData);
      // Keep reverse name-fields in sync (fire-and-forget, non-fatal)
      syncReverseNameFields(
        relationshipData.memberId,
        relationshipData.relationshipType,
        relationshipData.relatedMemberId,
      ).catch((e) => console.error("syncReverseNameFields:", e));
      res.json(relationship);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create relationship" });
    }
  });

  app.get("/api/relationships/:memberId", async (req, res) => {
    try {
      const memberId = parseInt(req.params.memberId);
      if (isNaN(memberId)) {
        return res.status(400).json({ message: "Invalid member ID" });
      }

      const lang = (req.query.lang as string) || "en";
      const resolved = await getRelationshipsFor(memberId, lang);
      res.json(resolved);
    } catch (error) {
      console.error("Error fetching member relationships:", error);
      res.status(500).json({ message: "Failed to fetch relationships" });
    }
  });

  app.get("/api/relationships", requireAuth, async (req, res) => {
    try {
      const relationships = await storage.getAllRelationships();
      console.log('Fetching all relationships:', relationships);
      res.json(relationships);
    } catch (error) {
      console.error("Error fetching all relationships:", error);
      res.status(500).json({ message: "Failed to fetch relationships" });
    }
  });

  app.patch("/api/relationships/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid relationship ID" });
      }

      const { relationshipType } = req.body;
      if (!relationshipType) {
        return res.status(400).json({ message: "Relationship type is required" });
      }

      await storage.updateRelationship(id, { relationshipType });
      res.json({ message: "Relationship updated successfully" });
    } catch (error) {
      console.error("Error updating relationship:", error);
      res.status(500).json({ message: "Failed to update relationship" });
    }
  });

  app.delete("/api/relationships/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteRelationship(id);
      res.json({ message: "Relationship deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete relationship" });
    }
  });

  // Member search route
  app.get("/api/members/search", async (req, res) => {
    try {
      const { term, city, state } = req.query;
      if (!term && !city && !state) {
        return res.json([]);
      }
      const members = await storage.searchMembers(
        term as string || "", 
        city as string || "", 
        state as string || ""
      );
      res.json(members);
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ message: "Failed to search members" });
    }
  });

  // Search members for relationship linking
  app.get("/api/members/search/:term", async (req, res) => {
    try {
      const searchTerm = req.params.term;
      const members = await storage.searchMembers(searchTerm);
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Failed to search members" });
    }
  });

  // Family graph endpoint — returns all members as nodes with BFS-computed generations + edges
  app.get("/api/family-graph", requireAuth, async (req, res) => {
    try {
      const { buildFamilyGraph } = await import("./family-graph");
      const graph = await buildFamilyGraph();
      res.json(graph);
    } catch (error) {
      console.error("Error building family graph:", error);
      res.status(500).json({ message: "Failed to build family graph" });
    }
  });

  // WhatsApp routes
  app.post("/api/whatsapp/generate-url", (req, res) => {
    try {
      const { phoneNumber, message } = req.body;
      
      if (!phoneNumber || !message) {
        return res.status(400).json({ message: "Phone number and message are required" });
      }

      const url = whatsappService.generateWhatsAppURL(phoneNumber, message);
      res.json({ success: true, url });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to generate WhatsApp URL" 
      });
    }
  });

  app.post("/api/whatsapp/broadcast-urls", (req, res) => {
    try {
      const { phoneNumbers, message } = req.body;
      
      if (!Array.isArray(phoneNumbers) || !message) {
        return res.status(400).json({ message: "Phone numbers array and message are required" });
      }

      const urls = whatsappService.generateBulkWhatsAppURLs(phoneNumbers, message);
      res.json({
        success: true,
        urls,
        message: `Generated WhatsApp URLs for ${urls.length} recipients`
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to generate broadcast URLs" 
      });
    }
  });

  app.post("/api/whatsapp/process-template", (req, res) => {
    try {
      const { templateId, variables } = req.body;
      
      if (!templateId || !variables) {
        return res.status(400).json({ message: "Template ID and variables are required" });
      }

      const processedMessage = whatsappService.processTemplate(templateId, variables);
      res.json({ success: true, message: processedMessage });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to process template" 
      });
    }
  });

  // Template messages for temple announcements
  app.get("/api/whatsapp/templates", (req, res) => {
    try {
      const templates = whatsappService.getTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to get templates" });
    }
  });

  // Temple routes
  app.get("/api/temples", async (req, res) => {
    try {
      const temples = await storage.getAllTemples();
      res.json(temples);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch temples" });
    }
  });

  app.get("/api/temples/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid temple ID" });
      }

      const temple = await storage.getTemple(id);
      if (!temple) {
        return res.status(404).json({ message: "Temple not found" });
      }

      res.json(temple);
    } catch (error) {
      console.error("Error fetching temple:", error);
      res.status(500).json({ message: "Failed to fetch temple" });
    }
  });

  app.post("/api/temples", async (req, res) => {
    try {
      const templeData = insertTempleSchema.parse(req.body);
      const temple = await storage.createTemple(templeData);
      res.json(temple);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create temple" });
    }
  });

  app.put("/api/temples/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid temple ID" });
      }

      const templeData = insertTempleSchema.parse(req.body);
      const temple = await storage.updateTemple(id, templeData);
      res.json(temple);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      if (error instanceof Error && error.message === "Temple not found") {
        return res.status(404).json({ message: "Temple not found" });
      }
      res.status(500).json({ message: "Failed to update temple" });
    }
  });

  app.delete("/api/temples/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid temple ID" });
      }

      await storage.deleteTemple(id);
      res.json({ message: "Temple deleted successfully" });
    } catch (error) {
      if (error instanceof Error && error.message === "Temple not found") {
        return res.status(404).json({ message: "Temple not found" });
      }
      res.status(500).json({ message: "Failed to delete temple" });
    }
  });

  // SPA routing: Handle client-side routing for production deployment
  // This ensures all non-API routes serve the React app (for navigation to work)
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.originalUrl.startsWith('/api/') || 
        req.originalUrl.includes('.html') || 
        req.originalUrl.includes('.js') || 
        req.originalUrl.includes('.css') ||
        req.originalUrl.includes('.png') ||
        req.originalUrl.includes('.jpg') ||
        req.originalUrl.includes('.ico')) {
      return next();
    }
    
    // For production deployment, let the static file handler take over
    // In development, Vite middleware handles this
    if (process.env.NODE_ENV === 'production') {
      // This will be handled by serveStatic in vite.ts
      return next();
    }
    
    // In development, let Vite handle it
    next();
  });

  const httpServer = createServer(app);
  return httpServer;
}
