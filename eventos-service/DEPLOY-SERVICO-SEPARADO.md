# Eventos Service — Deploy em repositório/serviço separado

Para rodar o **eventos-service** em outro domínio (fora do repositório PDV), use um dos caminhos abaixo.

---

## Opção 1: Novo repositório (recomendado para “outro domínio”)

Assim o serviço fica em um repo só dele e você deploya em um projeto Railway separado.

### Passo 1 — Criar o novo repositório

1. No GitHub (ou GitLab), crie um repositório **vazio**, por exemplo: `buscazap-eventos-service`.
2. **Não** inicialize com README (deixe vazio).

### Passo 2 — Copiar só o eventos-service para o novo repo

Na pasta do **eventos-service** (dentro do PDV), execute no terminal:

```bash
# Exemplo no Windows (PowerShell) — ajuste o caminho do novo repo
cd c:\dev\novo\BuscaZap-PDV\eventos-service

# Inicializar git (se ainda não existir) e adicionar remote do novo repo
git init
git remote add origin https://github.com/SEU_USUARIO/buscazap-eventos-service.git

# Adicionar tudo, commit e push (tudo que está DENTRO de eventos-service vira a raiz do novo repo)
git add .
git commit -m "Eventos service standalone"
git branch -M main
git push -u origin main
```

**Se preferir fazer manualmente:**

1. Crie uma pasta nova (ex.: `c:\dev\novo\buscazap-eventos-service`).
2. Copie para dentro dela **todo o conteúdo** da pasta `eventos-service` (arquivos na raiz, não a pasta em si):
   - `server.js`
   - `db.js`
   - `package.json`
   - `.env.example`
   - `README.md`
   - `migration.sql`
   - `migration-admin.sql`
   - pasta `middleware/` (com `auth.js`)
   - pasta `routes/` (com `admin.js`, `eventos.js`, `eventos-admin.js`)
   - pasta `scripts/` (com `create-admin.js`)
3. Dentro da pasta nova:
   ```bash
   git init
   git add .
   git commit -m "Eventos service standalone"
   git remote add origin https://github.com/SEU_USUARIO/buscazap-eventos-service.git
   git branch -M main
   git push -u origin main
   ```

### Passo 3 — Railway: novo serviço a partir do novo repo

1. Acesse [Railway](https://railway.app) e faça login.
2. **New Project** → **Deploy from GitHub repo**.
3. Escolha o repositório **buscazap-eventos-service** (não o PDV).
4. Railway vai detectar o `package.json` na raiz. **Não** é preciso configurar Root Directory (a raiz já é o serviço).
5. Clique no serviço criado → **Settings** (ou **Variables**):
   - **Variables**: adicione pelo menos:
     - `DATABASE_URL` = URL MySQL (ex.: do Railway MySQL ou externo)
     - `JWT_SECRET` = uma chave segura para login do admin
     - (opcional) `PORT` — Railway costuma injetar; se quiser, use `3002`
6. **Deploy**: o Railway usa `npm install` e `npm start` (conforme o `package.json`). Aguarde o deploy.
7. **Domínio**: na aba **Settings** do serviço, em **Networking** / **Public Networking**, clique em **Generate Domain** (ou **Add custom domain**) e use o domínio que quiser (ex.: `eventos.buscazap.com.br`).
8. Anote a URL final (ex.: `https://eventos-xxx.up.railway.app` ou `https://eventos.buscazap.com.br`). Essa será a **base URL do eventos-service**.

### Passo 4 — Banco de dados

- Se usar **Railway MySQL**: crie o serviço MySQL no mesmo projeto, pegue a `DATABASE_URL` e cole nas Variables do eventos-service.
- No banco, rode os SQLs na ordem:
  1. Conteúdo de `migration.sql`
  2. Conteúdo de `migration-admin.sql`
- Crie o primeiro admin (localmente, apontando para o mesmo banco, ou em um one-off no Railway):
  ```bash
  # Na pasta do eventos-service (ou do novo repo), com DATABASE_URL no .env
  node scripts/create-admin.js admin@email.com SuaSenhaSegura
  ```

### Passo 5 — Apontar o painel admin para o novo serviço

No **eventos-admin** (ou onde estiver o painel):

- Em produção, defina a variável de ambiente:
  - `VITE_API_URL` = URL do novo serviço (ex.: `https://eventos.buscazap.com.br` ou a URL gerada pelo Railway).

No **app BuscaZap**:

- `EXPO_PUBLIC_EVENTOS_SERVICE_URL` = mesma URL do eventos-service.

### Passo 6 — (Opcional) Remover eventos-service do repositório PDV

Depois que o novo repo estiver no ar e estável:

```bash
cd c:\dev\novo\BuscaZap-PDV
git rm -r eventos-service
git commit -m "Remove eventos-service (agora em repositório separado)"
git push
```

Assim o PDV deixa de ter a pasta `eventos-service` e o serviço roda só no novo domínio/repo.

---

## Opção 2: Mesmo repositório PDV, novo serviço no Railway com Root

Se quiser manter o código no repo PDV e só criar **outro serviço** no Railway:

1. **New Project** no Railway → **Deploy from GitHub repo** → escolha o repositório **BuscaZap-PDV**.
2. No serviço criado, vá em **Settings** → **Root Directory** (ou **Build**).
3. Defina **Root Directory**: `eventos-service`.
4. **Build Command**: deixe em branco ou `npm install`.
5. **Start Command**: `npm start` (ou deixe o padrão se Railway detectar).
6. Variables: `DATABASE_URL`, `JWT_SECRET` (e o que mais precisar).
7. **Generate Domain** ou custom domain para esse serviço.

Assim o deploy usa só a pasta `eventos-service` do mesmo repo, em outro serviço e outro domínio.

---

## Resumo rápido (novo repo + outro domínio)

| Etapa | Ação |
|-------|------|
| 1 | Criar repo vazio (ex.: buscazap-eventos-service) |
| 2 | Copiar conteúdo de `eventos-service` para a raiz do novo repo e dar push |
| 3 | Railway → New Project → Deploy from GitHub → esse novo repo |
| 4 | Variables: `DATABASE_URL`, `JWT_SECRET` |
| 5 | Rodar `migration.sql` e `migration-admin.sql` no MySQL; criar admin com `scripts/create-admin.js` |
| 6 | Generate Domain (ou domínio custom) e usar essa URL em eventos-admin e no app |
| 7 | (Opcional) Remover pasta `eventos-service` do repo PDV |

Depois disso, o endereço da **configuração da feira** continua sendo o do painel (ex.: admin.buscazap.com.br); o **eventos-service** fica no domínio que você configurou para esse novo serviço no Railway.
