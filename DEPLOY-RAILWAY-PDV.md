# Deploy do BuscaZap-PDV no Railway

## Se aparecer "Ocorreu um erro ao implantar a partir do código-fonte"

### 1. Ver o log completo do build

No Railway: **Deployments** → clique no deploy que falhou → abra **View Logs** (Build e Deploy).

- **Falha na fase de install:** costuma ser `pnpm` não encontrado ou erro em `pnpm install`.
- **Falha na fase de build:** erro no `vite build` ou no `esbuild` (TypeScript, variável de ambiente, etc.).
- **Falha no start:** `node dist/index.js` não sobe (porta, variável obrigatória, etc.).

### 2. Conferir configuração do serviço no Railway

No serviço do **BuscaZap-PDV**:

| Campo | Valor esperado |
|-------|----------------|
| **Root Directory** | (vazio) — raiz do repositório |
| **Build Command** | `pnpm install && pnpm build` (ou deixar em branco para usar `railway.json` / nixpacks) |
| **Start Command** | `pnpm start` ou `node dist/index.js` |
| **Package Manager** | Se houver opção, escolha **pnpm** |

Foi adicionado um **`nixpacks.toml`** na raiz para usar Node 20 e pnpm (corepack). Se o Railway estiver usando Nixpacks, esse arquivo será respeitado.

### 3. Variáveis de ambiente

Garanta que as variáveis usadas em **build** e **runtime** estão definidas no Railway (Settings → Variables), por exemplo:

- `DATABASE_URL` (ou as que o seu `server` usa)
- Qualquer variável que o Vite ou o servidor leiam em tempo de build

Se alguma for obrigatória e estiver vazia, o build ou o start podem falhar.

### 4. Se o install ainda falhar (pnpm)

No **Build Command** do serviço, force o uso do pnpm:

```bash
corepack enable && pnpm install && pnpm build
```

Ou use apenas o que está no `railway.json` e confira se o **Nixpacks** está usando o `nixpacks.toml` (sem outro Root Directory que ignore esse arquivo).

### 5. Este repositório é o PDV, não o eventos-service

- **BuscaZap-PDV** (este repo) = aplicação PDV (client + server). Deploy com **Root Directory vazio**.
- **eventos-service** = outro repositório, outro serviço no Railway (só a API de eventos).

Se você configurou **Root Directory** como `eventos-service` em um serviço que deveria ser o PDV, apague o Root Directory (deixe em branco) para que o deploy use a raiz do repo e o `railway.json` / `nixpacks.toml` do PDV.

### 6. Resumo rápido

1. Abrir o **log do deploy** que falhou.
2. Ver em que etapa parou (install / build / start).
3. Confirmar **Root Directory** vazio para o serviço PDV.
4. Confirmar variáveis de ambiente e comandos de build/start.
5. Se o erro for de pnpm, o `nixpacks.toml` na raiz já ativa Node 20 + corepack + pnpm; se ainda assim falhar, tentar o build command com `corepack enable && pnpm install && pnpm build`.

Se puder colar aqui a **mensagem de erro exata** ou um trecho do log (install/build/start), dá para apontar o ajuste certo.
