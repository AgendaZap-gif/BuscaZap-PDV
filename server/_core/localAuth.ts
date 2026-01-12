import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getBodyParam(req: Request, key: string): string | undefined {
  const value = req.body[key];
  return typeof value === "string" ? value : undefined;
}

export function registerLocalAuthRoutes(app: Express) {
  // Route to register a new user with email/password
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    const email = getBodyParam(req, "email");
    const password = getBodyParam(req, "password");
    const name = getBodyParam(req, "name");

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    try {
      // Check if user already exists
      const existingUser = await db.getUserByEmail(email);
      if (existingUser) {
        res.status(400).json({ error: "Email already registered" });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate unique openId for local auth users
      const openId = `local_${nanoid(32)}`;

      // Create user in database
      await db.upsertUser({
        openId,
        email,
        password: hashedPassword,
        name: name || null,
        loginMethod: "email",
        lastSignedIn: new Date(),
      });

      // Get the created user
      const user = await db.getUserByOpenId(openId);
      if (!user) {
        res.status(500).json({ error: "Failed to create user" });
        return;
      }

      // Create session token
      const sessionToken = await sdk.createSessionToken(openId, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      // Set session cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("[Local Auth] Registration failed", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // Route to login with email/password
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const email = getBodyParam(req, "email");
    const password = getBodyParam(req, "password");

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    try {
      // Find user by email
      const user = await db.getUserByEmail(email);
      if (!user) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      // Check if user has a password (local auth)
      if (!user.password) {
        res.status(400).json({
          error: "This account uses Google login. Please use 'Login with Google'",
        });
        return;
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      // Update last signed in
      await db.upsertUser({
        openId: user.openId,
        lastSignedIn: new Date(),
      });

      // Create session token
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      // Set session cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("[Local Auth] Login failed", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
}
