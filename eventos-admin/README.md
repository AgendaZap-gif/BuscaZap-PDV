# Eventos Admin (Painel CMS)

Painel web para gerenciar eventos/feiras: criar evento, cadastrar expositores, posicionar estandes no mapa, ativar/desativar, gerar QR Code.

## Endereço em produção

**URL recomendada para acessar a configuração da feira:**

- **https://admin.buscazap.com.br** (ou o domínio que você configurar no deploy do `eventos-admin`)

Após publicar o projeto (Vercel, Railway, Netlify, etc.), aponte o domínio desejado (ex.: `admin.buscazap.com.br`) para o deploy. Não há URL fixa no código: o endereço é o que você definir no painel do provedor.

- **Login** → JWT (email/senha na tabela `admins` do eventos-service).
- **Dashboard** → eventos ativos, total, botão criar evento.
- **Eventos** → listar, novo, editar, ativar/desativar, gerenciar expositores, abrir mapa.
- **Form evento** → nome, cidade, datas, URL banner, URL mapa, ativo. Na edição: bloco para **baixar QR Code**.
- **Expositores** → lista por evento, novo, editar, excluir.
- **Form expositor** → nome, categoria, WhatsApp, estande, promoção, destaque, patrocinado, pos X/Y.
- **Editor de mapa** → carrega imagem do mapa; seleciona expositor e **clica no mapa** para salvar posição (pos_x, pos_y) automaticamente.

## Setup

1. API: garantir que o **eventos-service** está rodando (com `migration-admin.sql` e pelo menos um admin criado).
2. Copiar `.env.example` para `.env`:
   - `VITE_API_URL`: URL do eventos-service (em dev com proxy use `/api`).
   - `VITE_APP_BASE_URL`: base do app para link/QR (ex: `https://buscazap.com.br`).
3. Instalar e rodar:
   ```bash
   cd eventos-admin
   npm install
   npm run dev
   ```
4. Acessar `http://localhost:5174` e fazer login.

## Build / Deploy

- Build: `npm run build` (saída em `dist/`).
- Deploy: Vercel, Railway (static) ou qualquer host de arquivos estáticos. Configurar `VITE_API_URL` para a URL do eventos-service em produção.

### Evitar 404 em rotas (SPA)

Se ao acessar uma URL como `/eventos` ou `/login` o servidor retornar **404**, é porque o host está procurando um arquivo em vez de servir o app. Ajuste:

- **Vercel**: já está coberto pelo `vercel.json` (rewrite tudo para `/index.html`).
- **Netlify**: o arquivo `public/_redirects` (copiado para `dist/`) faz `/* → /index.html`.
- **Railway (static)**: use um servidor com fallback SPA, por exemplo:
  - Build: `npm run build`
  - Start: `npx serve -s dist -l 3000`  
  (ou instale `serve` e use `serve -s dist`).
- **Outros**: configure "single page application" ou "fallback to index.html" para todas as rotas.

## Permissões

- **master**: vê todos os eventos, cria evento, edita qualquer evento e expositores.
- **produtor**: vê e edita apenas o evento vinculado (`admins.evento_id`). Não cria novo evento.
