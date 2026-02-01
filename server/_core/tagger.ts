/**
 * Tagger automático - detecta tags a partir do texto das mensagens.
 * Usado para enriquecer CRM quando a IA não retorna <DATA> ou como fallback.
 */

const TAG_RULES: Array<{ pattern: RegExp | string; tag: string }> = [
  { pattern: /\borçamento\b|preco|preço|quanto custa|valor\b/i, tag: "orcamento" },
  { pattern: /\bcomprar\b|quero pedir|fazer pedido|encomendar/i, tag: "cliente_quente" },
  { pattern: /\bpreco\b|preço|valor/i, tag: "preco" },
  { pattern: /\breclamação|reclamar|reclamo|problema com|insatisfeito/i, tag: "reclamacao" },
  { pattern: /\bcancelar|cancelamento|desistir\b/i, tag: "cancelamento" },
  { pattern: /\bpromoção|promo|desconto|oferta|cupom/i, tag: "promocao" },
  { pattern: /\bduvida|dúvida|não entendi|explicar|como funciona/i, tag: "duvida" },
  { pattern: /\bsuporte|ajuda|atendimento humano|falar com alguém/i, tag: "suporte" },
  { pattern: /\bassíduo|sempre|de novo|repetir pedido/i, tag: "recorrente" },
];

/**
 * Retorna tags detectadas a partir do texto (palavras-chave).
 */
export function autoTags(messages: string[]): string[] {
  const text = messages.join(" ").toLowerCase();
  const tags: string[] = [];
  for (const { pattern, tag } of TAG_RULES) {
    const match = typeof pattern === "string" ? text.includes(pattern) : pattern.test(text);
    if (match && !tags.includes(tag)) tags.push(tag);
  }
  return tags;
}

/**
 * Calcula score 0-100 a partir das tags (para CRM).
 */
export function calculateScoreFromTags(tags: string[]): number {
  const points: Record<string, number> = {
    cliente_quente: 50,
    orcamento: 30,
    preco: 20,
    promocao: 15,
    duvida: 10,
    suporte: 5,
    reclamacao: -20,
    cancelamento: -30,
    recorrente: 25,
  };
  let score = 0;
  for (const tag of tags) {
    score += points[tag] ?? 0;
  }
  return Math.min(100, Math.max(0, score));
}
