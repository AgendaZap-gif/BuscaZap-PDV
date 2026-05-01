import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    console.log(`[OAuth] Callback received from: ${req.headers.referer || "unknown"}`);
    console.log(`[OAuth] Query params:`, { code: req.query.code ? "present" : "missing", state: req.query.state ? "present" : "missing" });

    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      console.error("[OAuth] Missing code or state");
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      console.log("[OAuth] Exchanging code for token...");
      console.log("[OAuth] Code:", code.substring(0, 5) + "...");
      console.log("[OAuth] State (decoded):", atob(state));
      
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      console.log("[OAuth] Token response received:", { hasToken: !!tokenResponse.accessToken });
      
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      console.log("[OAuth] User info received:", { openId: userInfo.openId, name: userInfo.name });

      if (!userInfo.openId) {
        console.error("[OAuth] openId missing from user info");
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      console.log(`[OAuth] User authenticated: ${userInfo.openId}`);
      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      console.log(`[OAuth] Setting cookie ${COOKIE_NAME}, options:`, cookieOptions);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      console.log("[OAuth] Redirecting to / with session cookie set");
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
