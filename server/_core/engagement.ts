/**
 * Engagement score (anti-churn) - reduz score de empresas inativas e notifica se < 40.
 */

import * as db from "../db.js";
import { companies } from "../../drizzle/schema.js";
import { eq, and, lt } from "drizzle-orm";
import { notifyOwner } from "./notification.js";

const LOW_ENGAGEMENT_THRESHOLD = 40;
const DECREASE_POINTS = 5;

export async function decreaseEngagementScore(companyId: number, points = DECREASE_POINTS): Promise<void> {
  const drizzleDb = await db.getDb();
  if (!drizzleDb) return;
  const rows = await drizzleDb.select({ engagementScore: companies.engagementScore }).from(companies).where(eq(companies.id, companyId)).limit(1);
  if (rows.length === 0) return;
  const current = rows[0].engagementScore ?? 100;
  const next = Math.max(0, current - points);
  await drizzleDb.update(companies).set({ engagementScore: next }).where(eq(companies.id, companyId));
}

export async function increaseEngagementScore(companyId: number, points = 5): Promise<void> {
  const drizzleDb = await db.getDb();
  if (!drizzleDb) return;
  const rows = await drizzleDb.select({ engagementScore: companies.engagementScore }).from(companies).where(eq(companies.id, companyId)).limit(1);
  if (rows.length === 0) return;
  const current = rows[0].engagementScore ?? 100;
  const next = Math.min(100, current + points);
  await drizzleDb.update(companies).set({ engagementScore: next }).where(eq(companies.id, companyId));
}

/**
 * Cron: busca empresas com engagement < 40 e envia mensagem ao dono.
 */
export async function notifyLowEngagementCompanies(): Promise<void> {
  const drizzleDb = await db.getDb();
  if (!drizzleDb) return;
  const rows = await drizzleDb
    .select({ id: companies.id, name: companies.name, phone: companies.phone, engagementScore: companies.engagementScore })
    .from(companies)
    .where(and(eq(companies.isActive, true), lt(companies.engagementScore, LOW_ENGAGEMENT_THRESHOLD)));
  for (const c of rows) {
    await notifyOwner({
      companyId: c.id,
      title: "BuscaZap - Engajamento",
      content: `Olá ${c.name}, posso te ajudar a melhorar seus resultados? 😊 Seu score de engajamento está em ${c.engagementScore ?? 0}. Entre no painel e responda seus leads para aumentar.`,
    });
  }
}
