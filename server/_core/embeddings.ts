/**
 * Embeddings - Memória vetorial por empresa.
 * Usa OpenAI text-embedding-3-small. Vetores armazenados como JSON no MySQL.
 */

import * as db from "../db.js";
import { embeddings } from "../../drizzle/schema.js";
import { eq } from "drizzle-orm";
import { ENV } from "./env.js";

const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMS = 1536;

function getOpenAI() {
  if (!ENV.openaiApiKey?.trim()) return null;
  // dynamic import to avoid loading openai when key is missing
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { default: OpenAI } = require("openai");
  return new OpenAI({ apiKey: ENV.openaiApiKey });
}

/** Gera embedding para um texto via OpenAI. */
async function createEmbedding(text: string): Promise<number[]> {
  const openai = getOpenAI();
  if (!openai) throw new Error("OPENAI_API_KEY não configurado para embeddings.");
  const res = await openai.embeddings.create({
    model: OPENAI_EMBEDDING_MODEL,
    input: text.slice(0, 8000),
  });
  const vec = res.data[0]?.embedding;
  if (!vec || !Array.isArray(vec)) throw new Error("Resposta de embedding inválida.");
  return vec as number[];
}

/** Cosine similarity entre dois vetores. */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const den = Math.sqrt(normA) * Math.sqrt(normB);
  return den === 0 ? 0 : dot / den;
}

/**
 * Armazena um embedding no banco (companyId + content + vector).
 */
export async function storeEmbedding(companyId: number, content: string): Promise<void> {
  const db = await getDb();
  if (!drizzleDb) throw new Error("Database not available");
  const vector = await createEmbedding(content);
  await drizzleDb.insert(embeddings).values({
    companyId,
    content,
    vector,
  });
}

/**
 * Busca conhecimento por similaridade: gera embedding da query e retorna
 * os conteúdos mais similares da empresa (até limit).
 */
export async function searchKnowledge(
  companyId: number,
  query: string,
  limit = 5
): Promise<string[]> {
  const drizzleDb = await db.getDb();
  if (!drizzleDb) return [];
  const openai = getOpenAI();
  if (!openai) {
    const rows = await drizzleDb.select({ content: embeddings.content }).from(embeddings).where(eq(embeddings.companyId, companyId)).limit(20);
    return rows.map((r) => r.content);
  }
  const queryVector = await createEmbedding(query);
  const rows = await drizzleDb.select().from(embeddings).where(eq(embeddings.companyId, companyId));
  const withScore = rows.map((r) => {
    const vec = typeof r.vector === "string" ? JSON.parse(r.vector) as number[] : (r.vector as number[]);
    return { content: r.content, score: cosineSimilarity(queryVector, vec) };
  });
  withScore.sort((a, b) => b.score - a.score);
  return withScore.slice(0, limit).map((x) => x.content);
}

/**
 * Retorna todo o conhecimento em texto (para prompt quando não há query).
 */
export async function getKnowledgeAsText(companyId: number): Promise<string> {
  const drizzleDb = await db.getDb();
  if (!drizzleDb) return "";
  const rows = await drizzleDb.select({ content: embeddings.content }).from(embeddings).where(eq(embeddings.companyId, companyId)).limit(100);
  return rows.map((r) => r.content).join("\n\n");
}

export function isEmbeddingsConfigured(): boolean {
  return Boolean(ENV.openaiApiKey?.trim());
}
