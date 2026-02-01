/**
 * Crons - recomendações, resumo diário 22h, engagement score (anti-churn).
 * Recomendações são por empresa e categoria: delivery, roupas, agro, serviços, etc.
 */

import cron from "node-cron";
import * as db from "../db.js";
import { generateDailySummary } from "./summarizer.js";
import { notifyOwner } from "./notification.js";

function normalizePhone(p: string): string {
  return p.replace(/\D/g, "").slice(-11) || p;
}

/** Retorna frase de call-to-action conforme categoria da empresa (não só delivery). */
function getRecommendationMessage(
  companyName: string,
  companyCategory: string,
  userCategory: string
): string {
  const cat = (companyCategory || userCategory || "").toLowerCase();
  const label = userCategory || companyCategory || "novidades";
  if (cat.includes("delivery") || cat.includes("food") || cat.includes("pizza") || cat.includes("restaurante") || cat.includes("lanche")) {
    return `👋 Oi! Hoje costuma ser seu dia de ${label} na ${companyName}. Quer ver o cardápio ou promoções?`;
  }
  if (cat.includes("roupa") || cat.includes("moda") || cat.includes("vestuário")) {
    return `👋 Oi! A ${companyName} tem novidades em ${label}. Quer dar uma olhada?`;
  }
  if (cat.includes("agro") || cat.includes("natural") || cat.includes("orgânico") || cat.includes("produto natural")) {
    return `👋 Oi! A ${companyName} tem novidades em ${label}. Quer ver os produtos?`;
  }
  if (cat.includes("serviço") || cat.includes("profissional")) {
    return `👋 Oi! Lembrou da ${companyName}? Hoje costuma ser um bom dia para ${label}. Quer agendar ou pedir orçamento?`;
  }
  return `👋 Oi! A ${companyName} tem novidades em ${label}. Quer ver promoções?`;
}

/** Padrões por dia da semana (0=dom .. 6=sáb), por empresa e categoria (qualquer tipo: delivery, roupas, agro, etc.). */
async function getUsersToRecommend(dayOfWeek: number): Promise<Array<{
  companyId: number;
  customerPhone: string;
  category: string;
  companyName: string;
  companyCategory: string;
}>> {
  const drizzleDb = await db.getDb();
  if (!drizzleDb) return [];
  const { userBehavior } = await import("../../drizzle/schema.js");
  const { companies } = await import("../../drizzle/schema.js");
  const { eq, sql } = await import("drizzle-orm");
  const rows = await drizzleDb
    .select({
      companyId: userBehavior.companyId,
      customerPhone: userBehavior.customerPhone,
      category: userBehavior.category,
      total: sql<number>`count(*)`.as("total"),
    })
    .from(userBehavior)
    .where(eq(userBehavior.dayOfWeek, dayOfWeek))
    .groupBy(userBehavior.companyId, userBehavior.customerPhone, userBehavior.category);
  const filtered = rows.filter((r) => (r.total as number) >= 2);
  const result: Array<{
    companyId: number;
    customerPhone: string;
    category: string;
    companyName: string;
    companyCategory: string;
  }> = [];
  for (const r of filtered) {
    const company = await db.getCompanyById(r.companyId);
    const settings = (company?.settings as Record<string, string> | undefined) ?? {};
    result.push({
      companyId: r.companyId,
      customerPhone: r.customerPhone,
      category: r.category ?? "novidades",
      companyName: company?.name ?? "Empresa",
      companyCategory: settings.category ?? "",
    });
  }
  return result;
}

/** Envia mensagem proativa por empresa e categoria (delivery, roupas, agro, serviços, etc.). */
async function runProactiveRecommendations(): Promise<void> {
  const today = new Date().getDay();
  const users = await getUsersToRecommend(today);
  for (const u of users) {
    try {
      const message = getRecommendationMessage(u.companyName, u.companyCategory, u.category);
      await db.enqueueNotification({
        companyId: u.companyId,
        customerPhone: normalizePhone(u.customerPhone),
        type: "recommendation",
        message,
        scheduledFor: new Date(),
      });
    } catch (e) {
      console.warn("[Cron] Recommendation enqueue failed:", e);
    }
  }
}

/** Resumo diário às 22h por empresa. */
async function runDailySummaries(): Promise<void> {
  const drizzleDb = await db.getDb();
  if (!drizzleDb) return;
  const { companies } = await import("../../drizzle/schema.js");
  const { eq } = await import("drizzle-orm");
  const rows = await drizzleDb.select({ id: companies.id, name: companies.name, phone: companies.phone }).from(companies).where(eq(companies.isActive, true));
  const today = new Date();
  for (const c of rows) {
    try {
      const summary = await generateDailySummary(c.id, today);
      if (c.phone) {
        await notifyOwner({ companyId: c.id, title: `Resumo ${c.name}`, content: summary });
      }
    } catch (e) {
      console.warn("[Cron] Daily summary failed for company", c.id, e);
    }
  }
}

/** Engagement: reduz score de empresas inativas e notifica se < 40. */
async function runEngagementCheck(): Promise<void> {
  await decreaseEngagementScore();
}

export function startCrons(): void {
  cron.schedule("*/30 * * * *", runProactiveRecommendations, { timezone: "America/Sao_Paulo" });
  cron.schedule("0 22 * * *", runDailySummaries, { timezone: "America/Sao_Paulo" });
  cron.schedule("0 3 * * *", runEngagementCheck, { timezone: "America/Sao_Paulo" });
}
