/**
 * Auth por empresa (painel BuscaZap IA) - JWT com companyId.
 */

import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import * as db from "../db.js";
import { companies, subscriptions } from "../../drizzle/schema.js";
import { eq } from "drizzle-orm";
import { ENV } from "./env.js";

const JWT_ISSUER = "buscazap-company";
const JWT_AUDIENCE = "buscazap-panel";
const JWT_EXP = "7d";

export async function registerCompany(name: string, email: string, password: string, referralCode?: string): Promise<{ token: string; companyId: number }> {
  const drizzleDb = await db.getDb();
  if (!drizzleDb) throw new Error("Database not available");
  const existing = await drizzleDb.select().from(companies).where(eq(companies.email, email.toLowerCase().trim())).limit(1);
  if (existing.length > 0) throw new Error("Já existe uma empresa com este e-mail.");
  const passwordHash = await bcrypt.hash(password, 10);
  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + nanoid(6);
  const refCode = nanoid(8);
  const [inserted] = await drizzleDb.insert(companies).values({
    name,
    slug,
    email: email.toLowerCase().trim(),
    passwordHash,
    referralCode: refCode,
    isActive: true,
  });
  const companyId = inserted.insertId;
  const userId = await db.createCompanyAdminUser(companyId, email.toLowerCase().trim(), passwordHash, name);
  await drizzleDb.insert(subscriptions).values({
    companyId,
    userId,
    planType: "free",
    status: "active",
    messagesLimit: 200,
    messagesUsed: 0,
  });
  if (referralCode?.trim()) {
    const referrer = await drizzleDb.select().from(companies).where(eq(companies.referralCode, referralCode.trim())).limit(1);
    if (referrer.length > 0) {
      const { rewardReferral } = await import("./referrals.js");
      await rewardReferral(referrer[0].id);
    }
  }
  const token = await signCompanyToken(companyId);
  return { token, companyId };
}

export async function loginCompany(email: string, password: string): Promise<{ token: string; companyId: number }> {
  const drizzleDb = await db.getDb();
  if (!drizzleDb) throw new Error("Database not available");
  // Seleciona só as colunas necessárias para login (evita 500 se a tabela tiver colunas a mais/menos, ex.: cityId)
  const rows = await drizzleDb
    .select({ id: companies.id, email: companies.email, passwordHash: companies.passwordHash })
    .from(companies)
    .where(eq(companies.email, email.toLowerCase().trim()))
    .limit(1);
  if (rows.length === 0) throw new Error("E-mail ou senha inválidos.");
  const company = rows[0];
  if (!company.passwordHash) throw new Error("Login por senha não configurado para esta empresa.");
  const valid = await bcrypt.compare(password, company.passwordHash);
  if (!valid) throw new Error("E-mail ou senha inválidos.");
  const token = await signCompanyToken(company.id);
  return { token, companyId: company.id };
}

async function signCompanyToken(companyId: number): Promise<string> {
  const secret = new TextEncoder().encode(ENV.companyJwtSecret);
  return new SignJWT({ companyId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(JWT_EXP)
    .sign(secret);
}

export async function verifyCompanyToken(token: string): Promise<{ companyId: number } | null> {
  try {
    const secret = new TextEncoder().encode(ENV.companyJwtSecret);
    const { payload } = await jwtVerify(token, secret, { issuer: JWT_ISSUER, audience: JWT_AUDIENCE });
    const companyId = payload.companyId as number;
    return companyId ? { companyId } : null;
  } catch {
    return null;
  }
}
