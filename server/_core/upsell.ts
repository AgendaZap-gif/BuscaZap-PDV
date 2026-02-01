/**
 * Upsell automático - avisa quando empresa atinge 80% do limite de mensagens.
 */

import * as db from "../db.js";
import { notifyOwner } from "./notification.js";

export async function checkUpsell(companyId: number): Promise<boolean> {
  const drizzleDb = await db.getDb();
  if (!drizzleDb) return false;
  const { subscriptions } = await import("../../drizzle/schema.js");
  const { eq, and } = await import("drizzle-orm");
  const rows = await drizzleDb
    .select({ messagesUsed: subscriptions.messagesUsed, messagesLimit: subscriptions.messagesLimit })
    .from(subscriptions)
    .where(and(eq(subscriptions.companyId, companyId), eq(subscriptions.status, "active")))
    .limit(1);
  if (rows.length === 0) return false;
  const used = rows[0].messagesUsed ?? 0;
  const limit = rows[0].messagesLimit ?? 200;
  if (limit <= 0) return false;
  if (used < limit * 0.8) return false;
  await notifyOwner({
    companyId,
    title: "BuscaZap - Limite de mensagens",
    content: "⚠️ Você está perto do limite de mensagens. Quer fazer upgrade para continuar atendendo sem interrupções?",
  });
  return true;
}
