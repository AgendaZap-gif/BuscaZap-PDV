# BuscaZap PDV - TODO

## 🎯 Funcionalidades Principais

### 1. Autenticação e Multiempresa
- [x] Backend: Login de usuário
- [x] Frontend: Tela de login
- [ ] Perfis de acesso (Garçom, Caixa, Gerente, Admin)
- [x] Seleção de empresa ao fazer login

### 2. Gestão de Mesas e Comandas
- [x] Visualização de mesas (disponível, ocupada, reservada)
- [x] Abertura de comanda por mesa
- [ ] Transferência de itens entre mesas
- [ ] Junção de mesas
- [ ] Divisão de conta entre pessoas

### 3. Modo Garçom (Mobile/Tablet)
- [x] Interface otimizada para celular/tablet
- [x] Listagem de produtos por categoria (texto apenas)
- [x] Adicionar itens à comanda
- [x] Observações por item
- [ ] Enviar pedido para cozinha

### 4. Tela de Cozinha (KDS - Kitchen Display System)
- [x] Visualização de pedidos pendentes
- [x] Organização por setor (cozinha, bar, etc.)
- [x] Marcar item como pronto
- [ ] Alertas de tempo de preparo
- [x] Filtro por status (pendente, em preparo, pronto)

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
- [x] Cadastro de produtos
- [x] Categorias de produtos
- [x] Preços e variações
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
- [x] Login
- [x] Seleção de Empresa
- [x] Dashboard (Home)
- [x] Mesas (grid view)
- [x] Comanda (detalhes)
- [x] Cardápio (modo garçom)
- [x] Cozinha (KDS)
- [ ] Caixa (PDV)
- [ ] Fechamento
- [ ] Relatórios
- [x] Produtos (gestão)
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
- [x] Backend: Receber pedidos do delivery no PDV
- [ ] Frontend: Interface para aceitar/rejeitar pedidos
- [ ] Atualizar status de pedidos no app

### Integração BuscaZap + PDV (v2)
- [x] Backend: Schema expandido com campo source
- [x] Backend: Funções de integração (createOrderFromBuscaZap, getBuscaZapOrders, acceptBuscaZapOrder, rejectBuscaZapOrder)
- [x] Backend: Rotas tRPC completas (buscazapIntegration)
- [x] Frontend: Página de pedidos do BuscaZap
- [x] Frontend: Cards de pedidos com aceitar/rejeitar
- [x] Frontend: Modal de detalhes do pedido
- [x] Frontend: Badge de notificação de novos pedidos
- [x] Notificações: Sistema de polling para novos pedidos (5 segundos)
- [x] Notificações: Som de alerta para novos pedidos (beep duplo)
- [x] Sincronização: Importar cardápio do BuscaZap
- [x] Sincronização: Manter produtos sincronizados (mesmo banco de dados)
- [ ] Testes: Vitest para rotas de integração

## 🍔 Gestão de Produtos (Sincronização PDV ↔ App)


### Funcionalidades Principais
- [x] Página de gestão de produtos no PDV
- [x] Upload de foto do produto (S3)
- [x] CRUD completo (criar, editar, excluir)
- [x] Campos: nome, descrição, valor, categoria, foto
- [x] Sincronização bidirecional PDV ↔ App PediJá
- [x] Mesma tabela `products` compartilhada
- [x] Botão de Produtos na tela inicial
- [x] Modal de adicionar produtos na comanda

### Visualizações por Perfil
- [x] **Garçom:** Modal com busca e seleção de produtos
- [ ] **Caixa/PDV:** Cards grandes igual no app
- [x] **App PediJá:** Usa os mesmos produtos
- [x] Busca e filtro por categoria
- [ ] Ordenação por nome/preço


## 🔄 Novas Funcionalidades em Desenvolvimento

### Fechamento de Caixa Completo
- [x] Schema de banco: cashRegisters, cashMovements, cashClosures
- [x] Backend: Rotas de abertura, movimentação e fechamento
- [x] Frontend: Tela de abertura de caixa
- [x] Frontend: Registro de vendas no caixa
- [x] Frontend: Múltiplos meios de pagamento
- [x] Frontend: Sangria e reforço de caixa
- [x] Frontend: Fechamento com relatório de conferência
- [ ] Testes unitários

### Divisão de Conta
- [ ] Schema de banco: orderSplits
- [ ] Backend: Rotas de divisão de conta
- [ ] Frontend: Modal de divisão de conta
- [ ] Frontend: Divisão igual entre pessoas
- [ ] Frontend: Divisão por itens específicos
- [ ] Frontend: Geração de múltiplos pagamentos
- [ ] Testes unitários

### Dashboard de Relatórios
- [ ] Backend: Queries de análise de vendas
- [ ] Frontend: Gráfico de vendas por período
- [ ] Frontend: Produtos mais vendidos
- [ ] Frontend: Faturamento por categoria
- [ ] Frontend: Ticket médio
- [ ] Frontend: Filtros de data e período
- [ ] Testes unitários


## 🚀 NOVAS FUNCIONALIDADES (v3)

### Impressão Automática de Pedidos
- [x] Backend: Função de formatação de pedido para impressão
- [x] Backend: Integração com sistema de impressoras
- [ ] Frontend: Botão de reimprimir pedido
- [ ] Frontend: Configuração de impressora padrão
- [x] Impressão automática ao aceitar pedido do BuscaZap
- [x] Layout otimizado para impressora térmica (58mm/80mm)

### Notificações Push para Clientes
- [x] Backend: Rota para enviar notificação ao cliente
- [x] Backend: Integração com sistema de notificações do app (log por enquanto)
- [x] Notificar quando pedido é aceito
- [x] Notificar quando pedido está em preparo
- [x] Notificar quando pedido está pronto
- [x] Notificar quando pedido foi finalizado
- [x] Mensagens personalizadas por status

### Dashboard de Estatísticas
- [x] Backend: Queries de análise de pedidos BuscaZap
- [x] Frontend: Página de dashboard
- [x] Métrica: Total de pedidos recebidos
- [x] Métrica: Taxa de aceitação/rejeição
- [x] Métrica: Tempo médio de preparo
- [x] Métrica: Valor médio dos pedidos
- [x] Gráfico: Pedidos por horário (horários de pico)
- [x] Gráfico: Pedidos por dia da semana
- [x] Filtro por período (hoje, semana, mês)
