# BuscaZap PDV - TODO

## 🎯 Funcionalidades Principais

### 1. Sistema de Autenticação e Perfis
- [ ] Login multiempresa
- [ ] Perfis de acesso (Garçom, Caixa, Gerente, Admin)
- [ ] Seleção de empresa ao fazer login

### 2. Gestão de Mesas e Comandas
- [ ] Visualização de mesas (disponível, ocupada, reservada)
- [ ] Abertura de comanda por mesa
- [ ] Transferência de itens entre mesas
- [ ] Junção de mesas
- [ ] Divisão de conta entre pessoas

### 3. Modo Garçom (Mobile/Tablet)
- [ ] Interface otimizada para celular/tablet
- [ ] Listagem de produtos por categoria (texto apenas)
- [ ] Adicionar itens à comanda
- [ ] Observações por item
- [ ] Enviar pedido para cozinha

### 4. Tela de Cozinha (KDS - Kitchen Display System)
- [ ] Visualização de pedidos pendentes
- [ ] Organização por setor (cozinha, bar, etc.)
- [ ] Marcar item como pronto
- [ ] Alertas de tempo de preparo
- [ ] Filtro por status (pendente, em preparo, pronto)

### 5. PDV Caixa
- [ ] Abertura de caixa
- [ ] Registro de vendas
- [ ] Múltiplos meios de pagamento (Dinheiro, Cartão, PIX, etc.)
- [ ] Fechamento de comanda
- [ ] Impressão de comprovante
- [ ] Sangria e reforço de caixa

### 6. Fechamento de Caixa
- [ ] Relatório de vendas do dia
- [ ] Conferência de valores por meio de pagamento
- [ ] Registro de diferenças (sobra/falta)
- [ ] Histórico de fechamentos

### 7. Dashboard de Relatórios
- [ ] Vendas por período
- [ ] Produtos mais vendidos
- [ ] Faturamento por categoria
- [ ] Ticket médio
- [ ] Relatório de garçons
- [ ] Gráficos e visualizações

### 8. Integração com Impressoras Térmicas
- [ ] Configuração de impressoras por setor
- [ ] Impressão automática de pedidos na cozinha
- [ ] Impressão de comprovante de pagamento
- [ ] Impressão de relatórios

### 9. Integração com API de Delivery
- [ ] Receber pedidos do BuscaZap (delivery)
- [ ] Sincronizar status do pedido
- [ ] Notificar cliente sobre status
- [ ] Atualizar app de delivery em tempo real

### 10. Modo Offline (PWA)
- [ ] Service Worker para cache
- [ ] IndexedDB para armazenamento local
- [ ] Sincronização automática ao voltar online
- [ ] Indicador de status de conexão

### 11. Gestão de Produtos
- [ ] Cadastro de produtos
- [ ] Categorias de produtos
- [ ] Preços e variações
- [ ] Controle de estoque (opcional)

### 12. Configurações
- [ ] Configurar empresa
- [ ] Configurar mesas
- [ ] Configurar impressoras
- [ ] Configurar meios de pagamento
- [ ] Configurar setores de produção

## 📊 Banco de Dados

### Tabelas Necessárias
- [ ] companies (empresas)
- [ ] tables (mesas)
- [ ] orders (pedidos/comandas)
- [ ] order_items (itens do pedido)
- [ ] products (produtos)
- [ ] categories (categorias)
- [ ] payment_methods (meios de pagamento)
- [ ] cash_registers (caixas)
- [ ] cash_movements (movimentações de caixa)
- [ ] printers (impressoras)
- [ ] production_sectors (setores de produção)

## 🔄 Fluxos de Trabalho

### Fluxo Garçom
1. Login → Selecionar empresa
2. Ver mesas disponíveis
3. Abrir comanda em mesa
4. Adicionar itens
5. Enviar para cozinha
6. Acompanhar status
7. Fechar conta

### Fluxo Cozinha
1. Receber pedido
2. Marcar como "em preparo"
3. Finalizar item
4. Notificar garçom

### Fluxo Caixa
1. Abrir caixa
2. Receber pagamentos
3. Fechar comandas
4. Fazer sangria/reforço
5. Fechar caixa

### Fluxo Delivery
1. Receber pedido do app BuscaZap
2. Enviar para cozinha automaticamente
3. Atualizar status no app
4. Notificar cliente
5. Finalizar pedido

## 🎨 Interface

### Telas Principais
- [ ] Login
- [ ] Seleção de Empresa
- [ ] Dashboard
- [ ] Mesas (grid view)
- [ ] Comanda (detalhes)
- [ ] Cardápio (modo garçom)
- [ ] Cozinha (KDS)
- [ ] Caixa (PDV)
- [ ] Fechamento
- [ ] Relatórios
- [ ] Configurações

## 🚀 Tecnologias

- Frontend: React + Tailwind + shadcn/ui
- Backend: Express + tRPC
- Banco: MySQL (Railway)
- Offline: Service Worker + IndexedDB
- Real-time: WebSocket
- Impressão: Biblioteca de impressão térmica


### 13. Chamada de Entregador
- [ ] Solicitar entregador para pedidos não feitos pelo app
- [ ] Informar endereço de entrega
- [ ] Rastreamento do status da entrega
- [ ] Notificação quando entregador aceitar
- [ ] Cancelamento de solicitação


## 🔗 Integração com BuscaZap

- [x] Usar mesmo banco de dados do BuscaZap
- [x] Compartilhar tabela de empresas
- [x] Compartilhar tabela de usuários
- [x] Mesmo sistema de login
- [ ] Sincronizar produtos entre app e PDV
- [ ] Receber pedidos do delivery no PDV
- [ ] Atualizar status de pedidos no app
