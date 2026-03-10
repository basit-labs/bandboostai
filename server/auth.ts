import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { storage } from "./storage";
import { createHash } from "crypto";
import type { Express } from "express";
import session from "express-session";
import { pool } from "./db";
import connectPgSimple from "connect-pg-simple";

const DISPOSABLE_DOMAINS = [
  "tempmail.com", "throwaway.email", "guerrillamail.com", "mailinator.com",
  "10minutemail.com", "yopmail.com", "trashmail.com", "sharklasers.com",
  "guerrillamailblock.com", "grr.la", "dispostable.com", "maildrop.cc",
  "temp-mail.org", "fakeinbox.com", "tempail.com", "getnada.com",
  "mohmal.com", "burnermail.io", "tempmailo.com", "emailondeck.com",
  "33mail.com", "mailnesia.com", "spamgourmet.com", "tempr.email",
  "discard.email", "harakirimail.com", "jetable.org", "tmail.ws",
  "mytemp.email", "throwam.com", "tmpmail.net", "tmpmail.org",
];

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return false;
  const domain = email.split("@")[1].toLowerCase();
  if (DISPOSABLE_DOMAINS.includes(domain)) return false;
  return true;
}

function sanitizeUser(user: any) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    role: user.role,
    subscriptionStatus: user.subscriptionStatus,
    premiumOverride: user.premiumOverride,
    onboardingComplete: user.onboardingComplete,
  };
}

export function setupAuth(app: Express) {
  const PgStore = connectPgSimple(session);

  app.use(
    session({
      store: new PgStore({
        pool,
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "bandboost-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: false,
        sameSite: "lax",
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) return done(null, false, { message: "User not found" });
        if (user.password !== hashPassword(password)) return done(null, false, { message: "Incorrect password" });
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || null);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, displayName, email } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const normalizedEmail = normalizeEmail(email || "");
      if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
        return res.status(400).json({ message: "A valid, non-disposable email address is required" });
      }

      const existing = await storage.getUserByUsername(username.trim());
      if (existing) {
        return res.status(400).json({ message: "Username already taken" });
      }

      const existingEmail = await storage.getUserByEmail(normalizedEmail);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const user = await storage.createUser({
        username: username.trim(),
        password: hashPassword(password),
        displayName: displayName || username.trim(),
        email: normalizedEmail,
      });

      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: "Login failed" });
        return res.json(sanitizeUser(user));
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Login failed" });
      req.login(user, (err) => {
        if (err) return next(err);
        return res.json(sanitizeUser(user));
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    return res.json(sanitizeUser(req.user));
  });
}

export function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
  next();
}

export function requireAdmin(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
  const user = req.user as any;
  if (user.role !== "owner" && user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

export function requireOwner(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
  const user = req.user as any;
  if (user.role !== "owner") {
    return res.status(403).json({ message: "Owner access required" });
  }
  next();
}

export { hashPassword };
