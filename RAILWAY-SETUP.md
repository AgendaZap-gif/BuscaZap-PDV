# Configuração do BuscaZap PDV no Railway

## Pré-requisitos

1. **Conta no Railway** - https://railway.app
2. **Projeto MySQL** criado no Railway
3. **Google Cloud Console** - Credenciais OAuth configuradas

## Passo 1: Configurar Google OAuth

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a API "Google+ API" ou "Google Identity"
4. Vá em **APIs & Services > Credentials**
5. Clique em **Create Credentials > OAuth 2.0 Client ID**
6. Configure:
   - Application type: **Web application**
   - Name: **BuscaZap PDV**
   - Authorized redirect URIs:
     - `https://appbuscazap-c-bot.up.railway.app/api/oauth/callback`
     - `http://localhost:8080/api/oauth/callback` (para desenvolvimento)
7. Copie o **Client ID** e **Client Secret**

## Passo 2: Variáveis de Ambiente no Railway

No painel do Railway, adicione as seguintes variáveis de ambiente:

```bash
# Database (Railway fornece automaticamente)
DATABASE_URL=${{MySQL.MYSQL_URL}}

# Google OAuth (copiar do Google Cloud Console)
GOOGLE_CLIENT_ID=1075673171655-ds36rvitnkfgcmf35be3u2bplgriq4b3.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=SEU_CLIENT_SECRET_AQUI

# JWT Secret (gerar um aleatório seguro)
JWT_SECRET=buscazap-secret-key-2026

# Application
EXPO_PUBLIC_APP_ID=351de608-d3c8-44cf-9514-b85a6387dcae
VITE_APP_ID=buscazap
NODE_ENV=production
PORT=8080

# Public API URL (Railway fornece)
PUBLIC_API_URL=appbuscazap-c-bot.up.railway.app
EXPO_PUBLIC_API_BASE_URL=https://appbuscazap-c-bot.up.railway.app

# Owner (seu Google User ID após primeiro login)
OWNER_OPEN_ID=user_373CLSwnb1V9NE7W4lT8oPRYo9A

# Expo (se usar app mobile)
EXPO_ACCESS_TOKEN=5is6Hxp_B_5YlrTGRvIBGRpwFuPeNeIbar4yk_dW
```

## Passo 3: Configuração de Build no Railway

O Railway detectará automaticamente o `package.json` e usará os scripts:

- **Build Command**: `pnpm build`
- **Start Command**: `pnpm start`

Se necessário, configure manualmente:

```json
{
  "scripts": {
    "build": "vite build && esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js"
  }
}
```

## Passo 4: Deploy

1. Conecte o repositório GitHub ao Railway
2. Selecione o branch `main` (ou o branch desejado)
3. O Railway fará o deploy automaticamente
4. Aguarde o build completar

## Passo 5: Configurar Database

Execute as migrações do banco de dados:

```bash
pnpm db:push
```

Ou manualmente via Railway CLI:

```bash
railway run pnpm db:push
```

## Passo 6: Testar a Aplicação

1. Acesse a URL fornecida pelo Railway: `https://appbuscazap-c-bot.up.railway.app`
2. Clique em "Entrar com Google"
3. Autorize a aplicação
4. Você será redirecionado de volta logado

## Troubleshooting

### Erro: "redirect_uri_mismatch"

- Verifique se a URL de callback está corretamente configurada no Google Cloud Console
- A URL deve ser exatamente: `https://SEU-DOMINIO.up.railway.app/api/oauth/callback`

### Erro: "Invalid session cookie"

- Verifique se o `JWT_SECRET` está configurado corretamente
- Limpe os cookies do navegador e tente novamente

### Erro de conexão com o banco de dados

- Verifique se a variável `DATABASE_URL` está correta
- Certifique-se de que o serviço MySQL está rodando no Railway
- Verifique se as migrações foram executadas

### Erro: "Google OAuth credentials not configured"

- Verifique se `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` estão configurados
- Certifique-se de que não há espaços extras nas variáveis

## Diferenças da Versão Anterior (Manus)

### Removido:
- ❌ Sistema OAuth do Manus
- ❌ APIs do Manus Forge (LLM, Storage, Maps, etc)
- ❌ Plugin `vite-plugin-manus-runtime`
- ❌ Variáveis `OAUTH_SERVER_URL`, `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`

### Adicionado:
- ✅ Google OAuth nativo
- ✅ Suporte completo ao Railway
- ✅ Configuração simplificada
- ✅ Compatibilidade com app mobile

## Próximos Passos

Se você precisar das funcionalidades que usavam as APIs do Manus Forge:

1. **LLM**: Integrar OpenAI API diretamente
2. **Storage**: Usar AWS S3 diretamente (já tem `@aws-sdk/client-s3` instalado)
3. **Maps**: Usar Google Maps API diretamente
4. **Image Generation**: Integrar DALL-E ou Stability AI

## Suporte

Para problemas ou dúvidas, abra uma issue no repositório GitHub.
