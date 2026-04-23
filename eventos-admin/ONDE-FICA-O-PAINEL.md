# Onde fica o eventos-admin (painel da feira)?

## Resposta direta

- **eventos-admin não faz parte do eventos-service.**  
  O **eventos-service** é só a API (backend). O **eventos-admin** é o painel web (frontend) que consome essa API.

- **Hoje o eventos-admin está no repositório do PDV.**  
  Você pode **deixar no PDV** ou **transferir para outro repositório**. As duas formas funcionam.

---

## Opções

### Opção A — Manter no repositório PDV (recomendado se o PDV é seu “hub”)

- **Onde fica:** continua a pasta `eventos-admin` dentro do repo **BuscaZap-PDV**.
- **Deploy:** você cria um deploy separado só para o painel:
  - **Vercel/Netlify:** conectar o mesmo repo PDV e configurar **Root Directory** = `eventos-admin`.
  - **Railway:** novo serviço a partir do repo PDV com **Root Directory** = `eventos-admin`; Build: `npm run build`; Start: `npx serve -s dist -l 3000`.
- **Vantagem:** um único repositório (PDV + painel da feira); deploys independentes por Root Directory.

### Opção B — Transferir para o repositório do eventos-service

- **Onde fica:** o código do **eventos-admin** vai para o mesmo repo do **eventos-service** (ex.: `buscazap-eventos-service`), por exemplo numa pasta `eventos-admin` na raiz.
- **Deploy:**
  - **eventos-service:** Railway com raiz no repo (ou na pasta do backend, se você separar).
  - **eventos-admin:** outro serviço (Vercel/Railway) no **mesmo repo**, com Root Directory = `eventos-admin`.
- **Vantagem:** tudo que é “eventos/feira” (API + painel) fica no mesmo repositório.

### Opção C — Repositório só do eventos-admin

- **Onde fica:** novo repo no GitHub só com o conteúdo da pasta `eventos-admin`.
- **Deploy:** conectar esse repo na Vercel/Railway e fazer deploy normalmente (raiz = projeto do painel).
- **Vantagem:** separação total: PDV, eventos-service e painel em três repos diferentes.

---

## Resumo

| Pergunta | Resposta |
|----------|----------|
| eventos-admin faz parte do “service”? | Não. O service é só a API. O admin é um frontend que usa essa API. |
| Continua no repo do PDV? | Pode continuar (Opção A). Ou pode ser transferido para o repo do eventos-service (B) ou para um repo próprio (C). |
| O que o Railway do “eventos-service” precisa? | Só o backend (eventos-service). O painel é outro deploy (mesmo ou outro repo, com Root = `eventos-admin` ou repo próprio). |

Recomendações práticas:
- Quer **menos repos**: deixe no **PDV** (A) e use Root Directory no deploy do painel.
- Quer **tudo de eventos junto**: coloque o **eventos-admin** no **repo do eventos-service** (B).

Em qualquer caso, no deploy do painel configure `VITE_API_URL` com a URL do serviço que está no Railway (eventos-service).
