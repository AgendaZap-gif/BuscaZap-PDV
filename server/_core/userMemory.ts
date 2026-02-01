/**
 * Memória por usuário/empresa - preferências, fatos (ex.: alergia, nome).
 */

import * as db from "../db.js";
import { userMemory } from "../../drizzle/schema.js";
import { eq, and } from "drizzle-orm";

export async function saveMemory(
  companyId: number,
  customerPhone: string,
  key: string,
  value: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const normalized = customerPhone.replace(/\D/g, "").slice(-11) || customerPhone;
  const existing = await db
    .select()
    .from(userMemory)
    .where(
      and(
        eq(userMemory.companyId, companyId),
        eq(userMemory.customerPhone, normalized),
        eq(userMemory.key, key)
      )
    )
    .limit(1);
  if (existing.length > 0) {
    await drizzleDb
      .update(userMemory)
      .set({ value })
      .where(eq(userMemory.id, existing[0].id));
  } else {
    await drizzleDb.insert(userMemory).values({
      companyId,
      customerPhone: normalized,
      key,
      value,
    });
  }
}

export async function getUserMemory(
  companyId: number,
  customerPhone: string
): Promise<Record<string, string>> {
  const drizzleDb = await db.getDb();
  if (!drizzleDb) return {};
  const normalized = customerPhone.replace(/\D/g, "").slice(-11) || customerPhone;
  const rows = await drizzleDb
    .select({ key: userMemory.key, value: userMemory.value })
    .from(userMemory)
    .where(
      and(
        eq(userMemory.companyId, companyId),
        eq(userMemory.customerPhone, normalized)
      )
    );
  const out: Record<string, string> = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}

/** Retorna texto formatado para o prompt da IA. */
export async function getUserMemoryForPrompt(
  companyId: number,
  customerPhone: string
): Promise<string> {
  const mem = await getUserMemory(companyId, customerPhone);
  if (Object.keys(mem).length === 0) return "";
  return Object.entries(mem)
    .map(([k, v]) => `${k}: ${v}`)
    .join(". ");
}
