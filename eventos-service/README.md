# Eventos Service (Feira da Cidade)

Microserviço separado para eventos/feiras por cidade. Deploy independente na Railway.

## Regras de ativação

- Evento considerado **ativo** quando:
  - `ativo = true`
  - `CURDATE() BETWEEN data_inicio AND data_fim`
- Ativa/desativa automaticamente por data; zero manutenção manual.

## Setup

1. Rodar no MySQL (Railway ou local) os scripts `migration.sql` e `migration-admin.sql`.
2. Criar primeiro admin: `node scripts/create-admin.js admin@email.com SenhaSegura` (master). Para produtor vinculado a um evento: `node scripts/create-admin.js produtor@email.com senha produtor 5` (evento_id 5).
3. Copiar `.env.example` para `.env` e configurar:
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

## Painel Admin (CMS)

| Método | Rota | Descrição |
|--------|------|------------|
| POST | `/admin/login` | Login (email, senha) → JWT |
| GET | `/admin/eventos` | Listar eventos (master: todos; produtor: só o seu) |
| POST | `/admin/eventos` | Criar evento (master) |
| GET/PUT | `/admin/eventos/:id` | Ver/editar evento |
| PATCH | `/admin/eventos/:id/ativo` | Ativar/desativar |
| GET/POST | `/admin/eventos/:id/expositores` | Listar/criar expositores |
| PUT/DELETE | `/admin/expositores/:id` | Editar/excluir expositor |

Variável de ambiente: `JWT_SECRET`. Permissões: **master** (acesso total) e **produtor** (só edita o evento vinculado em `admins.evento_id`).

## Deploy Railway

- Criar novo serviço apontando para este diretório (root: `eventos-service`).
- Variáveis: `DATABASE_URL` ou `DB_*`, `PORT`.
- Start: `npm start`.

## Deep link / QR Code

- App: `buscazap://feira/{id}`
- Web: `https://buscazap.com.br/feira/{id}` (redirecionar para app ou PWA)
