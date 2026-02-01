# Integração: App BuscaZap ↔ Backend (PDV / Cérebro IA)

Este documento descreve como o **aplicativo BuscaZap** (guia comercial, Pedijá ou qualquer listagem de empresas) se conecta ao backend para o **chat com o agente de IA de cada empresa**.

---

## 1. Onde o chat aparece no app

- **Guia comercial**: em cada ficha de empresa, um botão **"Conversar"** ou **"Chat"**.
- **Pedijá** (ou outro marketplace): na página da empresa, botão **"Falar com a empresa"** / **"Chat"**.

Ao tocar nesse botão, o app abre a tela de conversa **daquela empresa** e o usuário fala com o agente (IA) que representa só essa empresa — não a plataforma BuscaZap.

### 1.1 Quando mostrar o botão "Conversar"

O botão **não** depende da IA estar ativa globalmente no PDV. Ele depende da **empresa** ter a função habilitada:

- **Plano destaque ou superior**: empresas com `planType` em `destaque`, `premium` ou `enterprise` mostram o botão.
- **Destaque no card**: empresas com `isFeatured === 1` (destaque no guia) também mostram o botão.
- **Serviço IA separado** (futuro): empresas que contratam apenas o "Chat IA" (sem plano destaque) podem ter um flag (ex.: `chatAiEnabled`) e também mostrar o botão.

No app, use os dados da empresa que você já carrega (ex.: `companies.byId`): `showChatButton = (planType === 'destaque' || planType === 'premium' || planType === 'enterprise' || isFeatured === 1)`. Opcionalmente, pode chamar `companyAi.chatEnabledForCompany({ companyId })` no PDV para confirmar se o chat está habilitado para essa empresa (útil quando existir o "serviço IA" separado).

---

## 2. O que o app precisa enviar

Para cada conversa, o app precisa de:

| Dado | Origem | Uso |
|------|--------|-----|
| **companyId** | ID da empresa na listagem (guia/Pedijá) | Identifica qual “cérebro” (IA + conhecimento) usar |
| **customerPhone** | Telefone do usuário logado no app | Histórico, CRM e recomendações por pessoa |
| **channel** | Fixo: `"app"` | Diferencia app vs WhatsApp vs web |

O backend já trata **uma conversa por (companyId + customerPhone + channel)**. Ou seja: um mesmo usuário pode ter uma conversa com a Pizzaria A e outra com a Loja de Roupas B.

---

## 3. Chamadas de API (tRPC)

O app usa a **mesma API do PDV**. Base URL: a do backend (ex.: `https://seu-pdv.up.railway.app`).

### 3.1 Verificar se a IA está configurada globalmente (opcional)

```ts
// Query – uso interno / painel
trpc.companyAi.isConfigured.useQuery()

// Resposta
{ configured: true }  // ou false se GEMINI_API_KEY não estiver configurado
```

**Não** use isso para esconder o botão "Conversar" no app. O botão deve aparecer por **plano/feature da empresa** (destaque+, isFeatured). Use `isConfigured` apenas no painel (ex.: para mostrar/ocultar configuração de IA).

### 3.2 Verificar se o chat está habilitado para uma empresa (opcional)

```ts
// Query – útil quando existir "serviço IA" separado
trpc.companyAi.chatEnabledForCompany.useQuery({ companyId: number })

// Resposta
{ enabled: true }  // ou false se company_ai_settings.aiEnabled não estiver ativo para essa empresa
```

Se o app quiser uma única fonte de verdade no PDV, pode usar isso em vez de (ou junto com) planType/isFeatured.

### 3.3 Enviar mensagem e receber resposta do agente da empresa

```ts
// Mutation
trpc.companyAi.reply.useMutation()

// Input
{
  companyId: number,        // ID da empresa (da tela atual)
  messages: Array<{
    role: "user" | "assistant" | "system",
    content: string
  }>,
  customerPhone?: string,   // Telefone do usuário (recomendado para histórico/CRM)
  channel?: "whatsapp" | "app" | "web" | "telegram",  // use "app"
  knowledgeBaseOverride?: string  // opcional; em geral não enviar
}

// Resposta
{
  text: string,            // Resposta do agente (exibir no chat)
  dataBlock?: {            // Metadados para CRM (opcional no app)
    intent?: string,
    lead_score?: number,
    tags?: string[],
    products?: string[],
    next_action?: string,
    crm_update?: { name?, interest?, budget?, city? }
  },
  model?: string
}
```

**Fluxo típico no app:**

1. Usuário abre a empresa (guia ou Pedijá) → você tem `companyId`.
2. Usuário toca em **"Conversar"** → abre tela de chat com `companyId` e `customerPhone` (do usuário logado).
3. Usuário digita uma mensagem → você monta `messages` (histórico da tela + nova mensagem com `role: "user"`).
4. Chama `companyAi.reply` com `companyId`, `messages`, `customerPhone` e `channel: "app"`.
5. Exibe `response.text` como mensagem do agente e pode guardar no histórico local e/ou confiar no histórico do backend.

O backend já:

- Verifica se o chat está habilitado para essa empresa (`company_ai_settings.aiEnabled`). Se não estiver, retorna erro; a empresa precisa ativar no painel (treinamento/configuração do bot) ou ter plano destaque+ com configuração feita.
- Cria/retoma a conversa por (companyId + customerPhone + channel).
- Carrega histórico, base de conhecimento e comportamento **dessa empresa**.
- Atualiza CRM e comportamento para recomendações e notificações **por empresa e por categoria** (não só delivery).

---

## 4. Canais e multi-canal

- **channel: "app"** → conversas iniciadas pelo app (guia/Pedijá).
- **channel: "whatsapp"** → quando a conversa vier do WhatsApp (mesmo usuário pode ter as duas).
- **customerPhone** pode ser `"anonymous"` se o app não tiver telefone; nesse caso não há CRM/recomendação por usuário.

Recomendação: sempre enviar `customerPhone` quando o usuário estiver logado, para histórico e notificações personalizadas por empresa.

---

## 5. Resumo para o time do app

1. **Botão de chat**: em cada empresa do guia comercial e do Pedijá que tenha **plano destaque ou superior** ou **destaque no card** (`planType` destaque/premium/enterprise ou `isFeatured === 1`). Não usar `companyAi.isConfigured` para mostrar/ocultar o botão.
2. **Ao abrir o chat**: usar `companyId` da empresa atual + `customerPhone` do usuário + `channel: "app"`.
3. **Ao enviar mensagem**: chamar `companyAi.reply` com `companyId`, `messages` (histórico + nova mensagem) e, se possível, `customerPhone` e `channel: "app"`.
4. **Exibir resposta**: usar `response.text` como mensagem do agente da empresa. Se o backend retornar erro de "Chat com IA não habilitado", a empresa ainda não configurou o bot no painel.

Assim o sistema fica conectado ao app: um botão de chat por empresa (com plano/feature adequada) que conversa com o agente (IA) daquela empresa, com histórico e aprendizado por empresa e por categoria (delivery, roupas, agro, etc.).

---

## 6. Categoria da empresa (recomendações para todos os tipos)

Para que as **notificações e recomendações** sejam adequadas a cada tipo de negócio (não só delivery), cada empresa deve ter **categoria** configurada no backend (ex.: no painel ou no cadastro):

- **Delivery / alimentação:** `delivery`, `restaurante`, `pizza`, `lanche`, `food`
- **Roupas / moda:** `roupas`, `moda`, `vestuário`
- **Produtos naturais / agro:** `agro`, `natural`, `orgânico`, `produto natural`
- **Serviços:** `serviço`, `profissional`, `consultoria`

O backend usa `company.settings.category` para:

- Montar o prompt da IA (contexto da empresa).
- Enviar mensagens proativas adequadas (ex.: “novidades em roupas” vs “cardápio ou promoções”).
- Agrupar comportamento por categoria para recomendações.

Opcional: ao exibir a ficha da empresa no app (antes de abrir o chat), o app pode chamar um endpoint que registra `action: "view"` e `category: <categoria da empresa>` para enriquecer o comportamento e as recomendações futuras.
