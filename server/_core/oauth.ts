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
    console.log(`[PDV-OAuth] ========== CALLBACK START ==========`);
    console.log(`[PDV-OAuth] Query params:`, JSON.stringify(req.query));
    
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      console.error("[PDV-OAuth] Missing code or state");
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      let userInfo: { openId: string; name?: string; email?: string; loginMethod?: string; platform?: string } | null = null;

      console.log("[PDV-OAuth] Processing code:", code.substring(0, 20) + "...");

      // Tenta decodificar o código (pode ser JSON Base64 ou apenas String Base64)
      try {
        const decodedString = atob(code);
        console.log("[PDV-OAuth] Decoded raw string:", decodedString);
        
        try {
          const decodedJson = JSON.parse(decodedString);
          if (decodedJson.userId) {
            userInfo = { 
              openId: decodedJson.userId,
              name: decodedJson.name || decodedJson.userId.split(':')[1] || "Usuário"
            };
          }
        } catch (jsonErr) {
          // Se não for JSON, mas contiver um formato de identificador (ex: email:xxx)
          if (decodedString.includes(':') || decodedString.includes('@')) {
            userInfo = { 
              openId: decodedString,
              name: decodedString.split(':')[1] || decodedString.split('@')[0] || "Usuário"
            };
          }
        }
        
        if (userInfo) {
          console.log("[PDV-OAuth] Successfully extracted user info:", JSON.stringify(userInfo));
        }
      } catch (e) {
        console.log("[PDV-OAuth] Code decoding failed:", e.message);
      }

      // Se não conseguimos extrair os dados do código, SÓ ENTÃO tentamos a troca oficial
      if (!userInfo) {
        console.log("[PDV-OAuth] Proceeding with standard exchange (Legacy/Official)...");
        try {
          const tokenResponse = await sdk.exchangeCodeForToken(code, state);
          userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
        } catch (sdkError) {
          console.error("[PDV-OAuth] SDK Exchange failed:", sdkError.message);
          throw new Error("Falha na troca de token: " + sdkError.message);
        }
      }

      if (!userInfo || !userInfo.openId) {
        console.error("[PDV-OAuth] Final userInfo is invalid:", userInfo);
        throw new Error("Não foi possível obter a identificação do usuário");
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
      console.log(`[PDV-OAuth] Setting session cookie with options:`, JSON.stringify(cookieOptions));
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      console.log("[PDV-OAuth] Success, redirecting to /");
      console.log(`[PDV-OAuth] ========== CALLBACK END ==========`);
      res.redirect(302, "/");
    } catch (error) {
      console.error("[PDV-OAuth] Callback failed:", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
