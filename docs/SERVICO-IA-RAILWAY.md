# Serviço IA separado no Railway

Este documento descreve a visão de um **serviço de IA dedicado** no Railway, expondo API para chat, configuração e treinamento, e como conectar app e PDV a ele.

## 1. Objetivo

- Ter um **projeto separado** (ex.: outro app no Railway) para o "Cérebro IA".
- Expõe API (ex.: `chatEnabledForCompany`, `reply`, configuração/treinamento).
- Permite **escalar a parte de IA** em um serviço dedicado e **vender o "Chat IA"** como produto standalone.

## 2. API sugerida do serviço IA

O serviço IA poderia expor endpoints (REST ou tRPC) equivalentes aos do PDV:

| Procedimento | Tipo | Descrição |
|--------------|------|-----------|
| `companyAi.isConfigured` | query | Verifica se a IA (ex.: Gemini) está configurada. |
| `companyAi.chatEnabledForCompany` | query | Input: `{ companyId }`. Retorna se o chat está habilitado para a empresa. |
| `companyAi.getSettings` | query | Input: `{ companyId }`. Retorna configurações de IA da empresa. |
| `companyAi.upsertSettings` | mutation | Input: `companyId`, `aiEnabled`, `customInstructions`, etc. Cria/atualiza `company_ai_settings`. |
| `companyAi.reply` | mutation | Input: `companyId`, `messages`, `customerPhone`, `channel`. Retorna resposta do agente de IA. |

Autenticação: API key, JWT ou mesmo público com validação de `companyId` conforme contrato.

## 3. Conexão App e PDV ao serviço

- **App BuscaZap**: hoje chama o **PDV** (URL em `EXPO_PUBLIC_PDV_URL`) para `companyAi.*`. Para usar o serviço IA separado, trocar a base URL da API de IA para a URL do novo serviço (ex.: `EXPO_PUBLIC_IA_SERVICE_URL`).
- **PDV**: hoje implementa `companyAi.*` e usa Gemini. Opcionalmente:
  - **Delegar**: o PDV pode repassar as chamadas `companyAi.*` para o serviço IA (proxy).
  - **Migrar**: mover a lógica de IA (Gemini, conversas, CRM) para o serviço IA; o PDV só persiste pedidos e empresas.

## 4. Dados e banco

- O serviço IA pode:
  - **Compartilhar o banco do PDV**: ler/escrever `company_ai_settings`, `conversations`, `messages`, `company_knowledge_base`, etc.
  - **Ter banco próprio**: com sync de empresas e `company_ai_settings` (ex.: via eventos ou jobs).

## 5. Venda do produto "Chat IA"

- Plano **"Chat IA"** no app: empresa paga só pelo sistema de chat/bot, sem plano destaque.
- Ao contratar, o **serviço IA** (ou PDV) define `company_ai_settings.aiEnabled = true` para a empresa.
- O app mostra o botão "Conversar" conforme plano/feature; as mensagens são enviadas ao PDV ou ao serviço IA, conforme configuração.

## 6. Resumo

| Aspecto | Descrição |
|---------|-----------|
| **Serviço** | Novo projeto no Railway expondo API de IA (chat, configuração, reply). |
| **App** | Configurável para chamar PDV ou serviço IA (ex.: variável de ambiente). |
| **PDV** | Pode continuar com a IA ou delegar/migrar para o serviço IA. |
| **Banco** | Compartilhado com PDV ou próprio com sync. |
| **Produto** | "Chat IA" vendido separadamente; ativação via `company_ai_settings.aiEnabled`. |

Com isso, a ideia do serviço IA separado no Railway fica implementada no código e documentada para uso futuro.
