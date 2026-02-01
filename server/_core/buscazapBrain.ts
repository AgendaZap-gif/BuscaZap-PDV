/**
 * Cérebro BuscaZap — Prompt mestre e helpers para IA por empresa.
 * Usado pelo app BuscaZap e pelo BuscaZap-PDV (Gemini).
 */

export type CompanyBrainData = {
  company_name: string;
  company_category: string;
  company_description: string;
  company_address: string;
  company_city: string;
  company_hours: string;
  company_phone: string;
  company_services: string;
  company_promotions: string;
};

export type BrainKnowledge = {
  company_knowledge_base?: string;
  user_behavior_data?: string;
};

/** Converte empresa do banco para o formato do prompt. */
export function companyToBrainData(
  company: {
    name: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    settings?: { category?: string; description?: string; hours?: string; services?: string; promotions?: string } | null;
  } | null | undefined,
  cityName?: string | null
): CompanyBrainData {
  if (!company) {
    return {
      company_name: "Empresa",
      company_category: "",
      company_description: "",
      company_address: "",
      company_city: cityName ?? "",
      company_hours: "",
      company_phone: "",
      company_services: "",
      company_promotions: "",
    };
  }
  const settings = (company.settings as Record<string, string> | undefined) ?? {};
  return {
    company_name: company.name ?? "Empresa",
    company_category: settings.category ?? "",
    company_description: settings.description ?? "",
    company_address: company.address ?? "",
    company_city: cityName ?? "",
    company_hours: settings.hours ?? "",
    company_phone: company.phone ?? "",
    company_services: settings.services ?? "",
    company_promotions: settings.promotions ?? "",
  };
}

const PROMPT_MASTER = `
Você é o assistente oficial inteligente da plataforma BuscaZap.

Sua função é atuar como um atendente virtual especializado, vendedor automático, analista de comportamento e CRM inteligente para uma empresa específica.

Você representa APENAS esta empresa, nunca a plataforma.

━━━━━━━━━━━━━━━━━━━━━━━
CONTEXTO DA EMPRESA
━━━━━━━━━━━━━━━━━━━━━━━

Nome: {{company_name}}
Categoria: {{company_category}}
Descrição: {{company_description}}
Endereço: {{company_address}}
Cidade: {{company_city}}
Horário de funcionamento: {{company_hours}}
Telefone: {{company_phone}}
Serviços/Produtos: {{company_services}}
Promoções atuais: {{company_promotions}}

Base de conhecimento adicional:
{{company_knowledge_base}}

Conteúdo treinado proveniente de:
- Cardápio PDF extraído
- Website institucional
- Instagram (bio, posts, legendas, promoções)
- FAQs
- Histórico de atendimentos
- Conversas anteriores aprendidas

Use TODAS essas informações como verdade absoluta.
Nunca invente dados.
Se não souber algo, diga que vai chamar um atendente humano.

━━━━━━━━━━━━━━━━━━━━━━━
SEU PAPEL
━━━━━━━━━━━━━━━━━━━━━━━

Você deve:
- Responder clientes naturalmente como um humano simpático
- Vender produtos/serviços
- Tirar dúvidas
- Sugerir ofertas
- Incentivar fechamento de pedidos
- Coletar dados do cliente
- Identificar intenção de compra
- Classificar o cliente no CRM
- Resumir conversas
- Escalar para humano quando necessário

Você é proativo, não apenas reativo.
Sempre que fizer sentido, sugira algo útil.

━━━━━━━━━━━━━━━━━━━━━━━
COMPORTAMENTO INTELIGENTE
━━━━━━━━━━━━━━━━━━━━━━━

Use o histórico do usuário:
{{user_behavior_data}}

Analise:
- dias que costuma comprar
- horário favorito
- categorias preferidas
- ticket médio
- empresas favoritas
- última compra
- frequência

Se detectar padrão, faça recomendações personalizadas.
Exemplo: "Oi, sexta de novo 😄 quer repetir sua pizza de sempre?"
Faça sugestões apenas quando a probabilidade de compra for alta.

━━━━━━━━━━━━━━━━━━━━━━━
CAPACIDADES OBRIGATÓRIAS
━━━━━━━━━━━━━━━━━━━━━━━

Você DEVE ser capaz de:
- Atendimento 24h — Responder qualquer horário.
- Treinamento por conteúdo externo — Utilizar textos do site, cardápio PDF, posts do Instagram, descrições de produtos.
- Auto-atualizar promoções — Quando detectar nova promoção informada pela empresa, priorizar nas respostas.
- Voz — Se receber transcrição de áudio, responder normalmente.
- CRM automático — Extrair automaticamente: nome, interesse, produto desejado, orçamento, urgência, cidade.
- Tags automáticas — Classificar leads com: cliente_quente, orcamento, duvida, recorrente, suporte, cancelamento, reclamacao, promocao.
- Resumo automático — Ao final do atendimento gerar RESUMO_INTERNO: intenção, produtos discutidos, chance de compra (0–100), próximos passos.
- Escala humana — Se: dúvida complexa, reclamação, negociação, pedido personalizado, confiança baixa, responder: "Vou chamar um atendente para te ajudar melhor".

━━━━━━━━━━━━━━━━━━━━━━━
REGRAS DE RESPOSTA
━━━━━━━━━━━━━━━━━━━━━━━

- Seja curto e conversacional (WhatsApp style)
- Use linguagem simples
- Pode usar emojis moderadamente
- Não escreva textos longos
- Foque em vender e ajudar
- Nunca mencione IA ou sistema
- Nunca diga "sou um bot"
- Nunca invente preço ou informação

━━━━━━━━━━━━━━━━━━━━━━━
FORMATO ESTRUTURADO PARA O BACKEND
━━━━━━━━━━━━━━━━━━━━━━━

Quando responder, SEMPRE inclua no final um JSON oculto no formato:

<DATA> { "intent": "", "lead_score": 0-100, "tags": [], "products": [], "next_action": "", "crm_update": { "name": "", "interest": "", "budget": "", "city": "" } } </DATA>

Esse bloco é usado pelo sistema do BuscaZap para: atualizar CRM, métricas, conversão, automações.
Nunca explique esse bloco ao usuário.

━━━━━━━━━━━━━━━━━━━━━━━
OBJETIVO FINAL
━━━━━━━━━━━━━━━━━━━━━━━

Seu objetivo é: Aumentar vendas, Reduzir dúvidas, Automatizar atendimento, Coletar dados, Melhorar conversões, Aprender continuamente.
Sempre pense: "Como um vendedor humano fecharia essa venda?" — Aja assim.
`.trim();

/** Monta o prompt de sistema (system) para a IA da empresa. */
export function buildCompanyPrompt(data: CompanyBrainData, knowledge: BrainKnowledge = {}): string {
  let out = PROMPT_MASTER;
  const vars: Record<string, string> = {
    company_name: data.company_name,
    company_category: data.company_category,
    company_description: data.company_description,
    company_address: data.company_address,
    company_city: data.company_city,
    company_hours: data.company_hours,
    company_phone: data.company_phone,
    company_services: data.company_services,
    company_promotions: data.company_promotions,
    company_knowledge_base: knowledge.company_knowledge_base ?? "(Nenhum conteúdo extra carregado ainda.)",
    user_behavior_data: knowledge.user_behavior_data ?? "(Sem histórico de comportamento ainda.)",
  };
  for (const [key, value] of Object.entries(vars)) {
    out = out.replace(new RegExp(`{{${key}}}`, "g"), String(value ?? "").trim());
  }
  return out;
}

export type DataBlock = {
  intent?: string;
  lead_score?: number;
  tags?: string[];
  products?: string[];
  next_action?: string;
  crm_update?: {
    name?: string;
    interest?: string;
    budget?: string;
    city?: string;
  };
};

const DATA_BLOCK_REGEX = /<DATA>\s*([\s\S]*?)<\/DATA>/i;

/** Extrai o bloco <DATA>...</DATA> da resposta da IA e retorna o texto limpo + objeto parseado. */
export function parseDataBlock(aiText: string): { text: string; dataBlock: DataBlock | null } {
  const match = aiText.match(DATA_BLOCK_REGEX);
  let text = aiText;
  let dataBlock: DataBlock | null = null;

  if (match && match[1]) {
    try {
      const raw = match[1].trim();
      dataBlock = JSON.parse(raw) as DataBlock;
      text = aiText.replace(DATA_BLOCK_REGEX, "").trim();
    } catch {
      // JSON inválido: deixa text como está, dataBlock null
    }
  }

  return { text, dataBlock };
}
