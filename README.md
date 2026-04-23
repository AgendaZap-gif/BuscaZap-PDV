# Yume Multiramo (BuscaZap)

Projeto multiramo integrado ao ecossistema BuscaZap, com login por empresa e seleção de ramo por vendedor.

## Variáveis de ambiente mínimas

Copie `.env.example` para `.env` e ajuste:

- `VITE_OAUTH_PORTAL_URL`: URL base do portal OAuth usado no login.
- `VITE_APP_ID`: identificador do app no portal OAuth.
- `DATABASE_URL`: conexão MySQL usada pelo servidor.
- `BUSCAZAP_APP_API_URL`: URL base da API principal do BuscaZap para integrações (empresa, permissões, Pedijà/agendamentos).

## Deep link de empresa

No primeiro acesso, você pode vincular o contexto da empresa pelo parâmetro de URL:

`?buscazap_company_id=123`

Regras:

- Aceita apenas valor numérico.
- O valor é salvo em `sessionStorage` (`buscazap_company_id`) para ser usado no onboarding inicial.
- Se o parâmetro não existir, o fluxo segue normalmente sem vínculo explícito de empresa.

Exemplo:

`https://seu-app.com/?buscazap_company_id=123`
