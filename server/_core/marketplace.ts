/**
 * Marketplace - destaque pago no BuscaZap.
 */

import * as db from "../db.js";
import { marketplaceAds } from "../../drizzle/schema.js";
import { eq, and, sql } from "drizzle-orm";

export async function getSponsored(limit = 3): Promise<Array<{ companyId: number; title: string; price: string }>> {
  const drizzleDb = await db.getDb();
  if (!drizzleDb) return [];
  const rows = await drizzleDb
    .select({ companyId: marketplaceAds.companyId, title: marketplaceAds.title, price: marketplaceAds.price })
    .from(marketplaceAds)
    .where(eq(marketplaceAds.isActive, true))
    .orderBy(sql`RAND()`)
    .limit(limit);
  return rows.map((r) => ({ companyId: r.companyId, title: r.title, price: r.price }));
}
