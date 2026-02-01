/**
 * IA que fecha venda sozinha - classificador de intenção e modo vendedor.
 */

import { geminiChat, toGeminiMessages, isGeminiConfigured } from "./gemini.js";

export type Intent = "compra" | "orcamento" | "duvida" | "suporte" | "reclamacao" | "outro";

const INTENT_PROMPT = `Classifique a intenção do cliente em UMA palavra: compra, orcamento, duvida, suporte, reclamacao, ou outro.
Frase do cliente: `;

export async function classifyIntent(text: string): Promise<Intent> {
  if (!isGeminiConfigured()) return "outro";
  const normalized = (text || "").trim().toLowerCase();
  if (normalized.includes("quero comprar") || normalized.includes("fazer pedido")) return "compra";
  if (normalized.includes("quanto") || normalized.includes("preço") || normalized.includes("preco") || normalized.includes("orçamento")) return "orcamento";
  if (normalized.includes("reclama") || normalized.includes("problema")) return "reclamacao";
  try {
    const result = await geminiChat({
      messages: toGeminiMessages([{ role: "user", content: INTENT_PROMPT + text }]),
      maxOutputTokens: 20,
      temperature: 0,
    });
    const intent = result.text.trim().toLowerCase().replace(/\s+/g, "_");
    if (["compra", "orcamento", "duvida", "suporte", "reclamacao", "outro"].includes(intent)) return intent as Intent;
    return "outro";
  } catch {
    return "outro";
  }
}

const SALES_AGENT_PROMPT = `Você é um vendedor profissional. Objetivo: FECHAR a venda.
Regras:
- Seja persuasivo e simpático
- Sugira combos ou itens complementares
- Crie leve urgência quando fizer sentido
- Ofereça desconto ou promoção se aplicável
- Peça confirmação do pedido
- Resposta curta (estilo WhatsApp)
Cliente disse: `;

export async function salesAgentReply(context: string, message: string): Promise<string> {
  if (!isGeminiConfigured()) return message;
  try {
    const result = await geminiChat({
      messages: toGeminiMessages([{ role: "user", content: SALES_AGENT_PROMPT + message + "\n\nContexto da empresa: " + context }]),
      maxOutputTokens: 512,
      temperature: 0.7,
    });
    return result.text.trim();
  } catch {
    return message;
  }
}

/**
 * Gera link de pagamento (placeholder - integrar Stripe Payment Link ou Pix).
 */
export function getPaymentLink(companyId: number, orderId: number, amount: number): string {
  const base = process.env.PUBLIC_API_URL || "https://app.buscazap.com";
  return `${base}/pay?company=${companyId}&order=${orderId}&amount=${amount}`;
}
