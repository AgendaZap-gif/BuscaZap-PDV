import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

// Initialize Google OAuth2 client
const getGoogleOAuthClient = () => {
  if (!ENV.googleClientId || !ENV.googleClientSecret) {
    throw new Error("Google OAuth credentials not configured");
  }
  
  const callbackUrl = ENV.publicApiUrl.startsWith("http") 
    ? `${ENV.publicApiUrl}/api/oauth/callback`
    : `https://${ENV.publicApiUrl}/api/oauth/callback`;
  
  return new OAuth2Client(
    ENV.googleClientId,
    ENV.googleClientSecret,
    callbackUrl
  );
};

export function registerGoogleOAuthRoutes(app: Express) {
  // Route to initiate Google OAuth flow
  app.get("/api/oauth/login", (req: Request, res: Response) => {
    try {
      const client = getGoogleOAuthClient();
      const redirectUri = getQueryParam(req, "redirect") || "/";
      
      const authUrl = client.generateAuthUrl({
        access_type: "offline",
        scope: [
          "https://www.googleapis.com/auth/userinfo.profile",
          "https://www.googleapis.com/auth/userinfo.email",
        ],
        state: Buffer.from(redirectUri).toString("base64"),
      });

      res.redirect(authUrl);
    } catch (error) {
      console.error("[Google OAuth] Login initiation failed", error);
      res.status(500).json({ error: "OAuth login failed" });
    }
  });

  // Callback route after Google authentication
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code) {
      res.status(400).json({ error: "code is required" });
      return;
    }

    try {
      const client = getGoogleOAuthClient();
      
      // Exchange authorization code for tokens
      const { tokens } = await client.getToken(code);
      client.setCredentials(tokens);

      // Get user info from Google
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token!,
        audience: ENV.googleClientId,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.sub) {
        res.status(400).json({ error: "Invalid user info from Google" });
        return;
      }

      const googleUserId = payload.sub;
      const email = payload.email || null;
      const name = payload.name || null;

      // Upsert user in database
      await db.upsertUser({
        openId: googleUserId,
        name: name,
        email: email,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      // Create session token
      const sessionToken = await sdk.createSessionToken(googleUserId, {
        name: name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      // Set session cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { 
        ...cookieOptions, 
        maxAge: ONE_YEAR_MS 
      });

      // Redirect to original destination or home
      const redirectUri = state 
        ? Buffer.from(state, "base64").toString("utf-8")
        : "/";
      
      res.redirect(302, redirectUri);
    } catch (error) {
      console.error("[Google OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
