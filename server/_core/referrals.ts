/**
 * Sistema de indicação viral - recompensa quem indicou.
 */

import * as db from "../db.js";
import { subscriptions } from "../../drizzle/schema.js";
import { eq, sql } from "drizzle-orm";

const REWARD_MESSAGES = 1000;

export async function rewardReferral(referrerCompanyId: number): Promise<void> {
  const drizzleDb = await db.getDb();
  if (!drizzleDb) return;
  const rows = await drizzleDb.select().from(subscriptions).where(eq(subscriptions.companyId, referrerCompanyId)).limit(1);
  if (rows.length > 0) {
    const current = rows[0];
    await drizzleDb.update(subscriptions).set({
      messagesLimit: (current.messagesLimit ?? 200) + REWARD_MESSAGES,
      updatedAt: new Date(),
    }).where(eq(subscriptions.id, current.id));
  }
}
