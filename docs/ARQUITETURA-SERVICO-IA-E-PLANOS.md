# Arquitetura: Serviço IA, Planos e Integração App ↔ PDV

Este documento descreve a visão de produto e arquitetura do **Chat com IA por empresa**: quem vê o botão "Conversar", como habilitar por plano ou serviço separado, painel de treinamento do bot e possível **serviço separado** no Railway.

**Status da implementação:**
- **Painel da empresa**: Página "Configurar assistente / Treinamento inicial do bot" no app (`/admin/empresa/assistente-ia`). Ao ativar e salvar, o app chama a API do PDV `companyAi.upsertSettings` com `aiEnabled` e demais campos.
- **API PDV**: `companyAi.getSettings` e `companyAi.upsertSettings` implementados; `db.upsertCompanyAiSettings` no PDV.
- **Produto "Chat IA"**: Plano "Chat IA" disponível em Selecionar plano; documentado em `docs/PRODUTO-CHAT-IA.md` (app) o fluxo para definir `company_ai_settings.aiEnabled = true` ao contratar.
- **Serviço IA separado**: Documentado em `docs/SERVICO-IA-RAILWAY.md` (PDV) a visão do serviço dedicado no Railway e a API sugerida.

---

## 1. Regra do botão "Conversar" no app

- **Não** depende da IA estar ativa globalmente no PDV (ex.: GEMINI_API_KEY).
- Depende da **empresa** ter a função habilitada:
  - **Plano destaque ou superior**: `planType` em `destaque`, `premium` ou `enterprise`.
  - **Destaque no card**: `isFeatured === 1` (empresa destacada no guia).
  - **Serviço IA separado** (futuro): empresa que contrata apenas o "Chat IA" sem plano destaque — flag ou produto separado (ex.: `company_ai_settings.aiEnabled` no PDV).

O app usa os dados da empresa que já carrega (`planType`, `isFeatured`) para mostrar ou esconder o botão. Opcionalmente pode chamar `companyAi.chatEnabledForCompany({ companyId })` no PDV para confirmar.

---

## 2. Habilitar o chat por empresa (PDV)

No PDV, o chat só processa mensagens para empresas que tenham **chat habilitado**:

- Tabela **`company_ai_settings`**: campo **`aiEnabled`**.
- Quando `aiEnabled === true` para aquele `companyId`, o `companyAi.reply` aceita a conversa; caso contrário, retorna erro.

Como a empresa passa a ter `aiEnabled = true`:

1. **Plano destaque+**: no **painel da empresa** (app ou PDV), a empresa (ou admin) acessa a página de **configuração / treinamento inicial do bot**. Ao concluir (ex.: definir instruções, base de conhecimento), o sistema cria/atualiza `company_ai_settings` com `aiEnabled = true` para aquela empresa.
2. **Serviço IA separado**: empresa contrata só o "Chat IA" (sem plano destaque). O fluxo de assinatura (Stripe, etc.) ou admin libera o produto e o sistema define `company_ai_settings.aiEnabled = true` para essa empresa. A mesma página de treinamento/configuração no painel serve para configurar o bot.

Ou seja: **treinamento/configuração no painel** é o que “liga” o bot para aquela empresa no PDV; o plano (destaque+) ou o produto "Chat IA" define **quem pode** acessar essa configuração.

---

## 3. Painel da empresa: treinamento inicial do bot

- **Onde**: uma página no painel da empresa (no app BuscaZap, ex.: área admin da empresa, ou no PDV se o painel for lá).
- **O que faz**:
  - Permite ativar o "Chat com IA" para a empresa (resultado: `company_ai_settings.aiEnabled = true` no PDV, via API).
  - Treinamento/configuração inicial: instruções do bot, base de conhecimento (cardápio, FAQs, etc.), tom de voz, horário de funcionamento para a IA, etc.
- **Integração**: o painel chama a API do PDV (ou do futuro serviço IA) para criar/atualizar `company_ai_settings` e, se existir, base de conhecimento e configurações de prompt.

Assim, apenas empresas com plano destaque+ (ou com serviço IA contratado) que **configuraram o bot** no painel terão o chat funcionando no app.

---

## 4. Serviço separado no Railway (futuro)

A ideia é poder ter um **serviço dedicado** (ex.: outro app no Railway) para o "Cérebro IA", mais conectado a todo o ecossistema por API:

- **App BuscaZap**: mostra o botão "Conversar" por plano/feature; envia mensagens para o backend (PDV ou serviço IA).
- **PDV**: hoje concentra IA (Gemini), conversas, CRM, `company_ai_settings`. Pode continuar assim ou delegar a lógica de IA para o serviço separado.
- **Serviço IA (Railway)**:
  - Expõe API (ex.: `companyAi.chatEnabledForCompany`, `companyAi.reply`, configuração/treinamento).
  - Conecta ao PDV e/ou ao app por API (autenticação, companyId, etc.).
  - Pode usar o mesmo banco do PDV (compartilhado) ou próprio, com sync de empresas e `company_ai_settings`.
- **Venda do produto**: plano "Chat IA" separado — empresa paga só pelo sistema de chat/bot, sem precisar do plano destaque. O serviço (ou PDV) controla quem tem acesso via `company_ai_settings` ou equivalente.

Isso permite:
- Escalar a parte de IA em um serviço dedicado.
- Vender o "Chat IA" como produto standalone.
- Manter app e PDV interligados ao mesmo contrato de API (app ↔ PDV ou app ↔ Serviço IA ↔ PDV).

---

## 5. Resumo

| Aspecto | Regra |
|--------|--------|
| **Quem vê o botão "Conversar"** | Empresas com plano destaque+ ou destaque no card (e, no futuro, com serviço IA contratado). Não depende de IA global no PDV. |
| **Quem pode usar o chat** | Empresas com `company_ai_settings.aiEnabled = true` no PDV (configurado no painel após plano ou contratação do serviço IA). |
| **Onde se configura o bot** | Painel da empresa: página de treinamento/configuração do bot (ativa o chat e define instruções/base de conhecimento). |
| **Serviço separado** | Possível outro app no Railway para IA, conectado por API ao app e ao PDV; permite vender "Chat IA" sem plano destaque. |

Com isso, o botão "Conversar" fica atrelado ao **plano/feature da empresa**, o treinamento inicial do bot é feito **por uma página no painel da empresa**, e todo o fluxo (app ↔ PDV e, futuramente, serviço IA) se conecta por API, com possibilidade de vender o sistema de chat como serviço separado.
