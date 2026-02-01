/**
 * Multi número WhatsApp - rotear webhook por display_phone_number.
 */

import * as db from "../db.js";

export async function getCompanyByPhone(phone: string): Promise<number | null> {
  const drizzleDb = await db.getDb();
  if (!drizzleDb) return null;
  const { whatsappNumbers } = await import("../../drizzle/schema.js");
  const { eq, and } = await import("drizzle-orm");
  const normalized = phone.replace(/\D/g, "").slice(-11) || phone;
  const rows = await drizzleDb
    .select({ companyId: whatsappNumbers.companyId })
    .from(whatsappNumbers)
    .where(and(eq(whatsappNumbers.phone, normalized), eq(whatsappNumbers.isActive, true)))
    .limit(1);
  return rows.length > 0 ? rows[0].companyId : null;
}
