# BuscaZap PDV

Sistema de Ponto de Venda integrado ao BuscaZap com suporte a:
- Gestão de mesas e comandas
- Modo garçom (mobile/tablet)
- Tela de cozinha (KDS)
- Fechamento de caixa
- Divisão de conta
- Chamada de entregador
- Impressoras térmicas
- Dashboard de relatórios
- Modo offline (PWA)

## 🔗 Integração com BuscaZap

Este PDV **compartilha o mesmo banco de dados** do app BuscaZap, permitindo:
- ✅ Mesmas empresas
- ✅ Mesmos usuários e login
- ✅ Mesmos produtos
- ✅ Sincronização de pedidos delivery
- ✅ Atualização de status em tempo real

## ⚙️ Configuração Inicial

### 1. Configurar Banco de Dados

O PDV precisa usar o banco do BuscaZap. Configure o `DATABASE_URL`:

1. Acesse **Settings → Secrets** no painel
2. Edite `DATABASE_URL` para:
```
mysql://root:YbFWxUdTYZMhpXkOqSHZdXUTXBNdUbLJ@caboose.proxy.rlwy.net:12791/railway
```

### 2. Aplicar Migrations

Execute o SQL abaixo no banco do BuscaZap para adicionar as tabelas do PDV:

```sql
-- Ver arquivo: pdv-migrations.sql
-- Ou executar: pnpm db:push
```

As novas tabelas criadas:
- `tables` - Mesas do restaurante
- `categories` - Categorias de produtos
- `products` - Produtos do cardápio
- `orders` - Pedidos/Comandas
- `order_items` - Itens do pedido
- `payment_methods` - Meios de pagamento
- `payments` - Pagamentos realizados
- `cash_registers` - Caixas
- `cash_movements` - Sangria e reforço
- `printers` - Impressoras térmicas
- `bill_splits` - Divisão de conta
- `delivery_requests` - Chamada de entregador

### 3. Configurar Empresa

1. Faça login no PDV
2. Selecione a empresa (mesmas do app BuscaZap)
3. Configure mesas, produtos e impressoras

## 📋 Funcionalidades Implementadas

### Backend (100%)
- ✅ 14 routers tRPC completos
- ✅ Autenticação multiempresa
- ✅ Gestão de mesas e comandas
- ✅ Produtos e categorias
- ✅ Pedidos e itens
- ✅ Pagamentos múltiplos
- ✅ Abertura/fechamento de caixa
- ✅ Sangria e reforço
- ✅ Divisão de conta
- ✅ Chamada de entregador
- ✅ Impressoras por setor

### Frontend (Em Desenvolvimento)
- [ ] Tela de login
- [ ] Seleção de empresa
- [ ] Dashboard
- [ ] Gestão de mesas
- [ ] Modo garçom
- [ ] Tela de cozinha
- [ ] PDV caixa
- [ ] Fechamento de caixa
- [ ] Relatórios

## 🚀 Próximos Passos

1. **Implementar páginas frontend**
   - Login e seleção de empresa
   - Dashboard com mesas
   - Modo garçom (mobile)
   - Tela de cozinha (KDS)
   - PDV caixa
   - Fechamento e relatórios

2. **Integração com impressoras**
   - Biblioteca de impressão térmica
   - Configuração por setor
   - Templates de impressão

3. **Modo offline (PWA)**
   - Service Worker
   - IndexedDB
   - Sincronização automática

4. **Integração com delivery**
   - Receber pedidos do app
   - Atualizar status
   - Notificar cliente

## 📡 API Endpoints

Todos os endpoints estão disponíveis via tRPC:

- `auth.*` - Autenticação
- `companies.*` - Empresas
- `tables.*` - Mesas
- `categories.*` - Categorias
- `products.*` - Produtos
- `orders.*` - Pedidos
- `orderItems.*` - Itens do pedido
- `paymentMethods.*` - Meios de pagamento
- `payments.*` - Pagamentos
- `cashRegister.*` - Caixa
- `cashMovements.*` - Movimentações
- `billSplits.*` - Divisão de conta
- `printers.*` - Impressoras
- `deliveryRequests.*` - Entregadores

## 🔧 Desenvolvimento

```bash
# Instalar dependências
pnpm install

# Aplicar migrations
pnpm db:push

# Iniciar dev server
pnpm dev

# Build para produção
pnpm build

# Testes
pnpm test
```

## 📝 Notas Importantes

- **Mesmo banco do BuscaZap**: Não crie um banco separado
- **Tabela users**: Já existe no BuscaZap, foi estendida com `companyId`
- **Tabela companies**: Já existe no BuscaZap, será reutilizada
- **Novas tabelas**: Apenas as específicas do PDV foram criadas
- **Login único**: Use as mesmas credenciais do app BuscaZap

## 🐛 Troubleshooting

### Erro de conexão com banco
- Verifique se o `DATABASE_URL` está correto
- Confirme que o banco Railway está ativo
- Teste a conexão: `mysql -h caboose.proxy.rlwy.net -P 12791 -u root -p`

### Migrations não aplicadas
- Execute manualmente: `pnpm db:push`
- Ou aplique o SQL via DBeaver/MySQL Workbench

### Empresa não aparece
- Verifique se a empresa existe no banco do BuscaZap
- Confirme que `isActive = true` na tabela companies
