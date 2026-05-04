# Melhorias na Vinculação de Empresa (Seller) - BuscaZap PDV

## Objetivo

Sincronizar a lógica de vinculação de empresa entre o **sitbusca** (site) e o **BuscaZap-PDV** para garantir que quando um usuário faz login no PDV, ele encontre automaticamente o perfil da empresa (seller) vinculado, assim como ocorre no site.

## Análise do Fluxo no sitbusca

No sitbusca, a vinculação de empresa ocorre em duas etapas:

### 1. Login (`auth.login`)
- Autentica o usuário por email/senha
- Retorna o usuário com `companyId` (se existir)

### 2. Autenticação de Sessão (`authenticateRequest`)
- Quando o usuário faz uma requisição com o cookie de sessão
- Se o usuário tem `role === "company"` e `companyId` está vazio:
  1. Tenta encontrar a empresa por `userId` na tabela `companies`
  2. Se não encontrar, tenta por `email` na tabela `companies`
  3. Se encontrar, atualiza o `companyId` no usuário
  4. Retorna o usuário com a empresa vinculada

## Mudanças Implementadas no BuscaZap-PDV

### 1. Melhoria no Context (`server/_core/context.ts`)

**Antes:**
- Buscava seller por `userId`
- Se não encontrasse, buscava por email
- Atualizava o vínculo, mas com logs mínimos

**Depois:**
- Adicionado fluxo de 3 passos com logs detalhados:
  1. **Step 1**: Buscar seller por `userId` (vínculo direto)
  2. **Step 2**: Se não encontrar, buscar por **email normalizado** (fallback - padrão sitbusca)
  3. **Step 3**: Se ainda não encontrar, busca na tabela `companies` (banco compartilhado) por `userId` ou `email`. Se encontrar, **cria automaticamente** o perfil de seller no PDV.
- Adicionado tratamento de erro robusto ao atualizar vínculo
- Logs estruturados com símbolos visuais (✓, ✗, ℹ️) para melhor legibilidade
- Informações completas do seller (ID e storeName) nos logs
- **Correção**: Agora o email é normalizado (lowercase e trim) antes da busca para garantir que variações de digitação não quebrem o vínculo.

**Benefícios:**
- Melhor rastreabilidade de problemas de vinculação
- Fallback automático por email (padrão sitbusca)
- Continua funcionando mesmo se falhar a atualização do vínculo
- Preparado para futuras integrações com banco compartilhado

### 2. Melhoria no OAuth Callback (`server/_core/oauth.ts`)

**Antes:**
- Lógica de vinculação com fluxo confuso (if/else if)
- Logs genéricos sem estrutura clara
- Tratamento de erro mínimo

**Depois:**
- Reorganizado em 2 estratégias claras:
  1. **Estratégia 1**: Se veio `buscazapCompanyId` no state, usar esse para vincular
  2. **Estratégia 2**: Se não veio ID, mas temos email, buscar seller por email (padrão sitbusca)
- Adicionado try/catch em cada estratégia para melhor tratamento de erro
- Logs estruturados com símbolos visuais (✓, ✗) para melhor legibilidade
- Informações completas do seller nos logs

**Benefícios:**
- Lógica mais clara e fácil de debugar
- Tratamento de erro robusto
- Suporta ambas as estratégias de vinculação (por ID e por email)
- Logs detalhados para rastrear problemas

## Fluxo de Vinculação Completo

```
1. Usuário faz login via OAuth
   ↓
2. Callback OAuth recebe código e state
   ↓
3. Extrai buscazapCompanyId do state (se existir)
   ↓
4. Estratégia 1: Se tem buscazapCompanyId
   └─ Busca seller por buscazapCompanyId
   └─ Atualiza userId do seller
   ↓
5. Estratégia 2: Se não tem buscazapCompanyId, mas tem email
   └─ Busca seller por email
   └─ Atualiza userId do seller
   ↓
6. Cria session token e redireciona para /
   ↓
7. Próxima requisição autenticada
   ↓
8. Context resolve seller para o usuário
   └─ Step 1: Busca por userId (agora vinculado)
   └─ Step 2: Se não encontrar, busca por email (fallback)
   ↓
9. Seller é resolvido e disponível no contexto
```

## Logs Estruturados

### Durante OAuth Callback
```
[OAuth] ========== Auto-linking Seller ==========
[OAuth] User ID: 123, Email: empresa@example.com
[OAuth] Step 1: Attempting auto-link to buscazapCompanyId: 456
[OAuth] ✓ Found seller 789, re-linking to user 123
[OAuth] ========== Auto-linking Complete ==========
```

### Durante Resolução de Seller no Context
```
[Auth] ========== Resolving Seller for User ==========
[Auth] User ID: 123, Email: empresa@example.com
[Auth] Step 1: Searching seller by userId: 123
[Auth] ✓ Found seller by userId: 789 storeName: Minha Loja
[Auth] ========== Seller Resolution Complete ==========
```

## Compatibilidade com sitbusca

As mudanças seguem o mesmo padrão do sitbusca:

1. **Busca por ID primeiro**: Vínculo direto e rápido
2. **Fallback por email**: Compatibilidade com usuários que ainda não têm vínculo por ID
3. **Atualização automática**: Quando encontra por email, atualiza o vínculo para ID
4. **Logs estruturados**: Facilita debug e troubleshooting

## Próximos Passos (Opcional)

1. **Integração com banco compartilhado**: Implementar busca na tabela `companies` do sitbusca se necessário
2. **Sincronização bidirecional**: Garantir que mudanças no sitbusca se reflitam no PDV
3. **Testes automatizados**: Adicionar testes para os fluxos de vinculação
4. **Documentação de API**: Documentar os endpoints de vinculação

## Arquivos Modificados

- `server/_core/context.ts`: Implementação do Step 3 (busca em banco compartilhado) e criação automática de seller
- `server/_core/oauth.ts`: Melhorias no callback OAuth, auto-linking e normalização de email
- `server/db.ts`: Adição de funções de busca na tabela `companies` (`getCompanyByEmail`, `getCompanyByUserId`)
- `drizzle/schema.ts`: Adição da definição da tabela `companies` espelhada do banco principal
