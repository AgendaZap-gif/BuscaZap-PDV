# Eventos Service (Feira da Cidade)

Microserviço separado para eventos/feiras por cidade. Deploy independente na Railway.

## Regras de ativação

- Evento considerado **ativo** quando:
  - `ativo = true`
  - `CURDATE() BETWEEN data_inicio AND data_fim`
- Ativa/desativa automaticamente por data; zero manutenção manual.

## Setup

1. Rodar no MySQL (Railway ou local) o script `migration.sql`.
2. Copiar `.env.example` para `.env` e configurar:
   - `PORT` (default 3002)
   - `DATABASE_URL` ou `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`
3. Instalar e rodar:
   ```bash
   cd eventos-service
   npm install
   npm run dev   # ou npm start
   ```

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/eventos/ativos?cidade=Nome da Cidade` | Lista eventos ativos na cidade |
| GET | `/eventos/:id` | Detalhes do evento |
| GET | `/eventos/:id/expositores` | Expositores (patrocinados/destaques primeiro) |
| GET | `/eventos/:id/promocoes` | Expositores com promoção |
| GET | `/eventos/:id/mapa` | URL e dimensões do mapa |
| GET | `/health` | Health check |

## Deploy Railway

- Criar novo serviço apontando para este diretório (root: `eventos-service`).
- Variáveis: `DATABASE_URL` ou `DB_*`, `PORT`.
- Start: `npm start`.

## Deep link / QR Code

- App: `buscazap://feira/{id}`
- Web: `https://buscazap.com.br/feira/{id}` (redirecionar para app ou PWA)
