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
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      console.error("[OAuth] Missing code or state");
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      console.log("[OAuth] Exchanging code for token...");
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      console.log("[OAuth] Getting user info...");
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        throw new Error("openId missing from user info");
      }

      console.log(`[OAuth] Syncing user: ${userInfo.openId}`);
      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const user = await db.getUserByOpenId(userInfo.openId);
      if (!user) throw new Error("Failed to retrieve user after sync");

      // Tentar vincular automaticamente se houver buscazap_company_id no estado ou cookie
      // O estado é o redirectUri em base64, que pode conter query params
      let buscazapCompanyId: number | null = null;
      try {
        const decodedState = atob(state);
        const url = new URL(decodedState);
        const id = url.searchParams.get("buscazap_company_id");
        if (id) buscazapCompanyId = parseInt(id, 10);
      } catch (e) {
        console.warn("[OAuth] Failed to parse buscazap_company_id from state");
      }

      if (buscazapCompanyId) {
        console.log(`[OAuth] Attempting auto-link to company: ${buscazapCompanyId}`);
        const existingSeller = await db.getSellerByBuscazapCompanyId(buscazapCompanyId);
        if (existingSeller && existingSeller.userId !== user.id) {
          // Se a empresa já existe mas está vinculada a outro ID (ou o ID mudou no OAuth), 
          // atualizamos o vínculo para o usuário atual
          console.log(`[OAuth] Re-linking company ${buscazapCompanyId} to user ${user.id}`);
          await db.updateSeller(existingSeller.id, { userId: user.id });
        }
      }

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      console.log("[OAuth] Success, redirecting to /");
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
