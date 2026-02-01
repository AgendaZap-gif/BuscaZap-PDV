/**
 * Resumo diário para empresa - IA gera resumo de conversas/leads do dia.
 */

import * as db from "../db.js";
import { messages, conversations, crmContacts, companies } from "../../drizzle/schema.js";
import { eq, and, gte } from "drizzle-orm";
import { geminiChat, toGeminiMessages, isGeminiConfigured } from "./gemini.js";

export async function generateDailySummary(companyId: number, date: Date): Promise<string> {
  const drizzleDb = await db.getDb();
  if (!drizzleDb) return "";

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const convs = await drizzleDb
    .select()
    .from(conversations)
    .where(and(eq(conversations.companyId, companyId), gte(conversations.lastMessageAt, startOfDay)));

  const lines: string[] = [];
  lines.push(`Resumo do dia ${date.toLocaleDateString("pt-BR")}`);
  lines.push(`Conversas ativas: ${convs.length}`);

  const msgs = await drizzleDb
    .select({ role: messages.role, content: messages.content })
    .from(messages)
    .where(eq(messages.companyId, companyId))
    .limit(200);

  const byRole = { customer: 0, assistant: 0, human: 0 };
  for (const m of msgs) {
    if (m.role in byRole) (byRole as Record<string, number>)[m.role]++;
  }
  lines.push(`Mensagens: ${byRole.customer} clientes, ${byRole.assistant} IA, ${byRole.human} humanos`);

  const contacts = await drizzleDb
    .select({ leadScore: crmContacts.leadScore, tags: crmContacts.tags })
    .from(crmContacts)
    .where(eq(crmContacts.companyId, companyId));
  const hotLeads = contacts.filter((c) => (c.leadScore ?? 0) >= 70).length;
  lines.push(`Leads quentes (score ≥ 70): ${hotLeads}`);
  lines.push("");
  lines.push("Últimas mensagens (amostra):");
  const sample = msgs.slice(-15).map((m) => `[${m.role}] ${m.content.slice(0, 80)}...`);
  lines.push(...sample);

  const prompt = `Gere um resumo empresarial curto (máx. 15 linhas) em português para o dono da empresa:\n\n${lines.join("\n")}`;

  if (!isGeminiConfigured()) {
    return lines.join("\n");
  }
  try {
    const result = await geminiChat({
      messages: toGeminiMessages([{ role: "user", content: prompt }]),
      maxOutputTokens: 1024,
      temperature: 0.3,
    });
    return result.text.trim();
  } catch {
    return lines.join("\n");
  }
}
