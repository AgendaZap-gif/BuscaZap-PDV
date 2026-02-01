# Cérebro BuscaZap no PDV

O BuscaZap-PDV expõe o **Cérebro** (IA por empresa) com persistência de conversas, CRM e comportamento.

## Variáveis de ambiente

No `.env` do PDV:

```env
GEMINI_API_KEY=sua-chave-gemini
GEMINI_MODEL=models/gemini-2.5-flash
GEMINI_FALLBACK_MODEL=models/gemini-2.5-pro
```

Obtenha a chave em [Google AI Studio](https://aistudio.google.com/).

## Rotas tRPC

- **companyAi.isConfigured** — `query()` → `{ configured: boolean }`
- **companyAi.reply** — `mutation({ companyId, messages, customerPhone?, channel?, knowledgeBaseOverride? })` → `{ text, dataBlock?, model }`

Com **companyAi.reply** o PDV:

1. Obtém ou cria conversa por `companyId` + `customerPhone` + `channel`
2. Carrega histórico da conversa, base de conhecimento da empresa e resumo de comportamento do usuário
3. Monta o prompt mestre com `buildCompanyPrompt` e chama o Gemini
4. Extrai o bloco `<DATA>` da resposta e persiste mensagem com metadados
5. Atualiza CRM (`crm_contacts`) e registra comportamento (`user_behavior`)

## Tabelas utilizadas

- `conversations` — conversas por empresa + telefone + canal
- `messages` — mensagens com `aiMetadata` (intent, lead_score, tags, crm_update)
- `company_knowledge_base` — conteúdo treinado (PDF, site, FAQ)
- `crm_contacts` — contatos com leadScore e tags
- `user_behavior` — ações (message, order, quote, etc.) para recomendações

Garanta que as migrations do Drizzle foram aplicadas (`drizzle-kit push` ou migrations aplicadas).

## Integração com o app BuscaZap

O app (guia comercial, Pedijá ou qualquer listagem) deve ter um **botão de chat em cada empresa**. Ao tocar, abre a conversa com o agente (IA) daquela empresa.

- **Doc detalhado:** [INTEGRACAO-APP-BUSCAZAP.md](./INTEGRACAO-APP-BUSCAZAP.md)
- `trpc.companyAi.isConfigured.useQuery()` — esconder botão se não configurado
- `trpc.companyAi.reply.useMutation()` com `companyId`, `messages`, `customerPhone`, `channel: 'app'`

Assim o PDV mantém histórico, CRM e comportamento **por empresa e por categoria** (delivery, roupas, agro, serviços, etc.). As notificações e recomendações são personalizadas por empresa e tipo de negócio.

## Arquivos

- `server/_core/buscazapBrain.ts` — prompt mestre, `companyToBrainData`, `parseDataBlock`
- `server/_core/gemini.ts` — `geminiChat`, `toGeminiMessages`, `isGeminiConfigured`
- `server/routers.ts` — router `companyAi`
- `server/db.ts` — funções de conversa, knowledge, CRM e behavior
