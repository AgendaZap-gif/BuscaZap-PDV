# Configuração de Domínio Customizado no Railway

## Problema Identificado

O subdomínio `pdv.buscazapbrasil.com.br` não está acessível por dois motivos:

1. **DNS não está resolvendo** - O subdomínio não está configurado no seu provedor DNS
2. **Railway retornando 404** - O servidor estava com caminho incorreto para arquivos estáticos (já corrigido)

---

## Solução: Configurar DNS e Domínio no Railway

### Passo 1: Adicionar Domínio Customizado no Railway

1. Acesse o [Railway Dashboard](https://railway.app)
2. Selecione o projeto **BuscaZap-PDV**
3. Vá na aba **Settings**
4. Na seção **Domains**, clique em **+ Add Domain**
5. Digite: `pdv.buscazapbrasil.com.br`
6. Clique em **Add Domain**

O Railway irá fornecer um registro CNAME ou A para você configurar.

### Passo 2: Configurar DNS no seu Provedor

Dependendo do que o Railway forneceu, você precisa adicionar um dos seguintes registros no seu provedor DNS (Cloudflare, GoDaddy, Registro.br, etc):

#### Opção A: Registro CNAME (Recomendado)

```
Type: CNAME
Name: pdv
Value: [fornecido pelo Railway, geralmente algo como: xxx.railway.app]
TTL: Auto ou 3600
Proxy: Desabilitado (se usar Cloudflare)
```

#### Opção B: Registro A

```
Type: A
Name: pdv
Value: [IP fornecido pelo Railway]
TTL: Auto ou 3600
```

### Passo 3: Aguardar Propagação DNS

A propagação DNS pode levar de alguns minutos até 48 horas, mas geralmente ocorre em 5-15 minutos.

Você pode verificar se o DNS está propagado usando:

```bash
# No terminal
nslookup pdv.buscazapbrasil.com.br

# Ou online
https://dnschecker.org
```

---

## Exemplo de Configuração (Cloudflare)

Se você usa Cloudflare:

1. Acesse o painel do Cloudflare
2. Selecione o domínio `buscazapbrasil.com.br`
3. Vá em **DNS > Records**
4. Clique em **Add record**
5. Configure:
   - **Type**: CNAME
   - **Name**: pdv
   - **Target**: `appbuscazap-c-bot.up.railway.app` (ou o que o Railway forneceu)
   - **Proxy status**: DNS only (nuvem cinza, não laranja)
   - **TTL**: Auto
6. Clique em **Save**

**⚠️ IMPORTANTE**: Desabilite o proxy do Cloudflare (nuvem cinza) inicialmente para testar. Depois você pode habilitar.

---

## Exemplo de Configuração (Registro.br)

Se você usa Registro.br:

1. Acesse [registro.br](https://registro.br)
2. Faça login e selecione o domínio
3. Vá em **DNS > Editar Zona**
4. Adicione um novo registro:
   - **Nome**: pdv
   - **Tipo**: CNAME
   - **Dados**: `appbuscazap-c-bot.up.railway.app.` (note o ponto final)
   - **TTL**: 3600
5. Salve as alterações

---

## Verificação

### 1. Verificar DNS

```bash
# Linux/Mac
nslookup pdv.buscazapbrasil.com.br

# Ou use um site
https://dnschecker.org/#CNAME/pdv.buscazapbrasil.com.br
```

Deve retornar algo como:
```
pdv.buscazapbrasil.com.br canonical name = appbuscazap-c-bot.up.railway.app
```

### 2. Testar Acesso

```bash
curl -I https://pdv.buscazapbrasil.com.br
```

Deve retornar `HTTP/2 200` ou `HTTP/1.1 200`.

### 3. Acessar no Navegador

Abra: `https://pdv.buscazapbrasil.com.br`

---

## Correções Aplicadas no Código

### ✅ Corrigido: Caminho de Arquivos Estáticos

**Antes:**
```typescript
const distPath = process.env.NODE_ENV === "development"
  ? path.resolve(__dirname, "../..", "dist", "public")
  : path.resolve(__dirname, "public");
```

**Depois:**
```typescript
const distPath = path.resolve(__dirname, "public");
```

**Motivo**: Após o build com esbuild, o `__dirname` já aponta para `/app/dist`, então o caminho correto é simplesmente `__dirname + "/public"`.

---

## Troubleshooting

### Erro: "Could not resolve host"

**Causa**: DNS ainda não propagou ou está configurado incorretamente.

**Solução**:
1. Verifique se o registro DNS foi criado corretamente
2. Aguarde alguns minutos para propagação
3. Use `dnschecker.org` para verificar propagação global

### Erro: "SSL certificate error"

**Causa**: Railway ainda está gerando o certificado SSL.

**Solução**:
1. Aguarde 5-10 minutos após adicionar o domínio
2. O Railway gera automaticamente certificados Let's Encrypt
3. Verifique no painel do Railway se o status do domínio está "Active"

### Erro: 404 Not Found

**Causa**: Arquivos estáticos não estão sendo servidos corretamente.

**Solução**:
1. Verifique os logs do Railway: `railway logs`
2. Procure por: `[Static] Serving from: /app/dist/public`
3. Verifique se o build foi executado: `pnpm build`

### Erro: 502 Bad Gateway

**Causa**: O servidor não está rodando ou crashou.

**Solução**:
1. Verifique os logs do Railway
2. Certifique-se de que todas as variáveis de ambiente estão configuradas
3. Verifique se o `GOOGLE_CLIENT_SECRET` está configurado

### Erro: `Unknown column 'companies.domain' in 'where clause'` (DrizzleQueryError)

**Causa**: A tabela `companies` no MySQL ainda não tem a coluna `domain`.

**Solução**:
1. Conecte ao MySQL (Railway, DBeaver, etc.) e rode:
   ```sql
   ALTER TABLE `companies` ADD COLUMN `domain` VARCHAR(255) NULL;
   ```
2. Ou execute o arquivo `drizzle/migrations/0011_add_companies_domain.sql`
3. Depois de aplicar, reinicie o app. O middleware passará a preencher `req.companyIdByDomain` quando o host bater com `companies.domain`

---

## Variáveis de Ambiente Necessárias

Certifique-se de que estas variáveis estão configuradas no Railway:

```bash
DATABASE_URL=${{MySQL.MYSQL_URL}}
GOOGLE_CLIENT_ID=1075673171655-ds36rvitnkfgcmf35be3u2bplgriq4b3.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=SEU_SECRET_AQUI
JWT_SECRET=buscazap-secret-key-2026
EXPO_PUBLIC_APP_ID=351de608-d3c8-44cf-9514-b85a6387dcae
NODE_ENV=production
PORT=8080
PUBLIC_API_URL=pdv.buscazapbrasil.com.br
EXPO_PUBLIC_API_BASE_URL=https://pdv.buscazapbrasil.com.br
OWNER_OPEN_ID=user_373CLSwnb1V9NE7W4lT8oPRYo9A
```

**⚠️ IMPORTANTE**: Atualize `PUBLIC_API_URL` e `EXPO_PUBLIC_API_BASE_URL` para usar o novo domínio!

---

## Atualizar Google OAuth Callback

Após configurar o domínio, você precisa atualizar o Google Cloud Console:

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Vá em **APIs & Services > Credentials**
3. Edite o OAuth 2.0 Client ID
4. Em **Authorized redirect URIs**, adicione:
   ```
   https://pdv.buscazapbrasil.com.br/api/oauth/callback
   ```
5. Salve as alterações

---

## Migração do banco: coluna `companies.domain`

Para o white label por domínio funcionar (ex.: `pdv.buscazapbrasil.com.br` → empresa X), a tabela `companies` precisa da coluna `domain`. Se aparecer no log:

```
[domainMiddleware] Coluna companies.domain não existe. Rode a migração: ...
```

rode no MySQL (DBeaver, Railway MySQL console, etc.):

```sql
ALTER TABLE `companies` ADD COLUMN `domain` VARCHAR(255) NULL;
```

Ou execute o arquivo: `drizzle/migrations/0011_add_companies_domain.sql`

Depois, preencha o domínio na empresa que usa esse subdomínio:

```sql
UPDATE companies SET domain = 'pdv.buscazapbrasil.com.br' WHERE id = SEU_ID_DA_EMPRESA;
```

---

## Checklist Final

- [ ] Domínio adicionado no Railway
- [ ] Registro DNS (CNAME ou A) criado no provedor
- [ ] DNS propagado (verificado com dnschecker.org)
- [ ] **Coluna `companies.domain` criada e preenchida** (ver seção acima)
- [ ] Variáveis `PUBLIC_API_URL` e `EXPO_PUBLIC_API_BASE_URL` atualizadas no Railway
- [ ] Google OAuth callback URI atualizado
- [ ] Certificado SSL gerado pelo Railway (status "Active")
- [ ] Site acessível via `https://pdv.buscazapbrasil.com.br`

---

## Suporte

Se o problema persistir após seguir todos os passos:

1. Verifique os logs do Railway: `railway logs`
2. Teste a URL original do Railway: `https://appbuscazap-c-bot.up.railway.app`
3. Se a URL original funciona mas o domínio customizado não, o problema é DNS
4. Se nenhuma das URLs funciona, o problema é no servidor/build
