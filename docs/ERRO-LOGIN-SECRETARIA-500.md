# Erro 500 no login (companyAuth.login)

## O que está acontecendo

A requisição vai para **`/api/trpc/companyAuth.login`**, ou seja, para o **app BuscaZap-PDV** (painel admin/empresa). Esse login usa a tabela **`companies`** do banco do PDV, **não** a tabela `admins` do eventos-service.

- **secretaria@teste.com** que você criou com `create-secretaria-teste.js` fica na tabela **`admins`** do **eventos-service** (MySQL do eventos).
- O login em **/admin/login** ou **/secretaria/agenda** do app PDV usa a tabela **`companies`** do **banco do PDV**.

São dois sistemas diferentes:

| Onde você faz login | Tabela usada | Onde criar o usuário |
|---------------------|--------------|----------------------|
| **Eventos-admin** (painel de eventos/feiras) | `admins` (eventos-service) | `node scripts/create-secretaria-teste.js` no eventos-service |
| **PDV / Admin** (painel BuscaZap IA, /admin/login) | `companies` (banco do PDV) | Cadastro no próprio app ou script abaixo |

## Por que dá 500?

1. **Colunas faltando no banco:** o código faz `SELECT` em `companies` incluindo `passwordHash`, `referralCode`, `engagementScore`, `domain`, etc. Se a tabela `companies` foi criada antes das migrations que adicionam essas colunas, o MySQL devolve erro do tipo "Unknown column 'X' in 'field list'" e o servidor responde 500.

2. **Solução (colunas):** rodar no banco **do PDV** (o mesmo que o app usa) as alterações da migration de companies. No MySQL, use (se der "Duplicate column", a coluna já existe):

```sql
ALTER TABLE companies ADD COLUMN passwordHash TEXT;
ALTER TABLE companies ADD COLUMN referralCode VARCHAR(20) UNIQUE;
ALTER TABLE companies ADD COLUMN domain VARCHAR(255);
ALTER TABLE companies ADD COLUMN engagementScore INT NOT NULL DEFAULT 100;
```

3. **Depois disso:** para conseguir logar no **PDV** com um usuário de teste, é preciso existir uma **empresa** em `companies` com esse e-mail e senha. Use o script abaixo ou **Cadastrar** na tela de login do PDV.

## Como testar o login no PDV (admin/secretaria)

- **Opção A – Cadastrar na tela:** na tela de login do PDV, use "Cadastrar" e crie uma empresa com o e-mail e senha que quiser (ex.: secretaria@teste.com / teste123).

- **Opção B – Script:** na raiz do projeto BuscaZap-PDV, com `.env` configurado (DATABASE_URL do PDV):
  ```bash
  pnpm run create-company-secretaria-teste
  ```
  Isso cria a empresa com e-mail `secretaria@teste.com` e senha `teste123`. Para outro e-mail/senha:
  ```bash
  pnpm exec tsx scripts/create-company-secretaria-teste.ts email@exemplo.com MinhaSenha "Nome Empresa"
  ```

Depois de criar a empresa (por cadastro ou script) e de garantir que a tabela `companies` tem as colunas acima, o login em **/admin/login** deve funcionar sem 500.
