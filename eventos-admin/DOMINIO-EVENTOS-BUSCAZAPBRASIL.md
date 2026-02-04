# eventos.buscazapbrasil.com.br = eventos-admin (painel)

## Sim: o painel é o “root” desse domínio

O domínio **eventos.buscazapbrasil.com.br** deve abrir o **eventos-admin** (painel web React), **não** o eventos-service (API).

| O quê | Serviço | Domínio / URL exemplo |
|-------|--------|------------------------|
| **Painel** (login, eventos, expositores, mapa, QR) | **eventos-admin** (frontend SPA) | **eventos.buscazapbrasil.com.br** |
| **API** (JSON, usado pelo painel e pelo app) | **eventos-service** (backend Node) | Outra URL, ex: `https://eventos-api.xxx.railway.app` ou `api-eventos.buscazapbrasil.com.br` |

Se **eventos.buscazapbrasil.com.br** estiver apontando para o **eventos-service** (API), o navegador faz `GET /` e a API não tem página HTML na raiz → **404** e “Failed to load resource: 404”. A API só responde em rotas como `/admin/login`, `/admin/eventos`, etc., em JSON.

---

## O que fazer

1. **Deploy do eventos-admin (painel)**  
   Fazer deploy **só** do frontend do painel (esta pasta `eventos-admin`) em um lugar que sirva o build estático, por exemplo:
   - **Vercel** ou **Netlify:** repo PDV com **Root Directory** = `eventos-admin`, ou repo só do painel.
   - **Railway:** novo serviço com **Root Directory** = `eventos-admin`, Build: `npm run build`, Start: `npx serve -s dist -l 3000`.

2. **Apunte o domínio ao painel**  
   No provedor onde o **eventos-admin** está hospedado (Vercel/Netlify/Railway), configure o domínio **eventos.buscazapbrasil.com.br** para esse deploy. Assim esse domínio passa a ser o “root” do painel.

3. **Mantenha a API em outra URL**  
   O **eventos-service** continua em outra URL (ex.: a que o Railway gera ou um subdomínio tipo `api-eventos.buscazapbrasil.com.br`). Não use essa URL como “site” do painel.

4. **Variáveis do painel em produção**  
   No deploy do **eventos-admin**, defina:
   - `VITE_API_URL` = URL do **eventos-service** (ex.: `https://eventos-api.xxx.railway.app` ou `https://api-eventos.buscazapbrasil.com.br`)
   - `VITE_APP_BASE_URL` = URL do app (ex.: `https://buscazap.com.br`)

Resumo: **eventos.buscazapbrasil.com.br** = root do **eventos-admin** (painel). O eventos-service é só a API e não deve ser o root desse domínio.
