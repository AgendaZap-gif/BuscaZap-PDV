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


## 🚀 NOVAS FUNCIONALIDADES (v4)

### Chat Direto PDV ↔ Cliente
- [x] Backend: Schema de mensagens (tabela chat_messages)
- [x] Backend: Rotas tRPC para enviar/receber mensagens
- [x] Backend: Sistema de polling para novas mensagens (2 segundos)
- [x] Frontend PDV: Interface de chat na página de pedidos
- [x] Frontend PDV: Marcação automática de mensagens como lidas
- [ ] Frontend PDV: Badge de mensagens não lidas
- [ ] Frontend PDV: Notificação sonora para novas mensagens
- [ ] Frontend App: Interface de chat no pedido ativo
- [x] Mensagens pré-definidas (endereço, troco, pronto)

### Sistema de Avaliação Pós-Entrega
- [x] Backend: Schema de avaliações (tabela order_ratings)
- [x] Backend: Rotas tRPC para criar/buscar avaliações
- [x] Backend: Cálculo de média de avaliações e distribuição
- [ ] Frontend App: Modal de avaliação após entrega
- [ ] Frontend App: Estrelas (1-5) + comentário opcional
- [x] Frontend PDV: Visualização de avaliações recebidas
- [x] Frontend PDV: Métricas de satisfação no dashboard (média, distribuição, insights)
- [ ] Notificação automática para avaliar após 5min da entrega


## 🔄 SINCRONIZAÇÃO DE BANCO DE DADOS (v5)

### Unificar PDV e App Mobile no Mesmo Banco
- [x] Criar script de migração unificado para o banco do app mobile
- [ ] Aplicar migrations do PDV no banco do Railway
- [ ] Testar sincronização de produtos entre PDV e app
- [ ] Testar sincronização de pedidos entre PDV e app
- [ ] Verificar se website consulta dados corretamente
- [x] Documentar estrutura unificada do banco de dados

### Deploy do PDV no Railway
- [x] Criar guia de deploy passo a passo
- [ ] Configurar variáveis de ambiente no Railway
- [ ] Configurar domínio pdv.buscazap.com.br
- [ ] Testar acesso ao PDV em produção
- [x] Documentar integração completa (Website + App + PDV)


## 🔌 WEBSOCKET EM TEMPO REAL (v6)

### Substituir Polling por WebSocket
- [x] Instalar dependências (socket.io)
- [x] Implementar servidor WebSocket no backend
- [x] Criar eventos para novos pedidos
- [x] Criar eventos para novas mensagens de chat
- [x] Criar eventos para atualização de status
- [x] Atualizar frontend para conectar via WebSocket
- [x] Remover polling de pedidos (5s)
- [x] Remover polling de chat (2s)
- [x] Testar comunicação em tempo real
- [x] Documentar uso do WebSocket



## 🚚 SEPARAÇÃO GUIA COMERCIAL vs PEDIJÁ + ENTREGADORES PRÓPRIOS (v14)

### Backend (Implementado)
- [x] Schema: Tabela company_delivery_settings
- [x] Schema: Tabela company_drivers
- [x] Migration v14 criada (migration-delivery-own-drivers-v14.sql)
- [x] Backend: 11 funções de banco de dados (db.ts)
- [x] Backend: Router delivery com 11 endpoints tRPC
- [x] Endpoint: getSettings (buscar configurações de delivery)
- [x] Endpoint: activateOnPedija (ativar empresa no PediJá)
- [x] Endpoint: deactivateFromPedija (desativar empresa do PediJá)
- [x] Endpoint: toggleOnlineStatus (controlar status online via PDV)
- [x] Endpoint: getOnlineCompanies (buscar empresas online)
- [x] Endpoint: addDriver (adicionar entregador próprio)
- [x] Endpoint: removeDriver (remover entregador próprio)
- [x] Endpoint: getDrivers (listar entregadores da empresa)
- [x] Endpoint: getOrdersForDriver (pedidos para entregador próprio)
- [x] Endpoint: enableOwnDrivers (habilitar addon)
- [x] Endpoint: disableOwnDrivers (desabilitar addon)
- [x] Documentação completa (DELIVERY-ENTREGADORES-PROPRIOS-V14.md)
- [x] Testes unitários (13 testes passando)
- [x] Roles admin_global e delivery_driver adicionados ao schema

### Frontend PDV (A Implementar)
- [ ] Página: DeliveryControl.tsx (controle de status online)
- [ ] Página: ManageDrivers.tsx (gerenciar entregadores próprios)
- [ ] Botão na Home: Acessar controle de delivery
- [ ] Botão na Home: Acessar gerenciamento de entregadores
- [ ] Toggle grande e visível para status online
- [ ] Estatísticas de pedidos do dia
- [ ] Lista de entregadores com estatísticas
- [ ] Formulário de adicionar entregador
- [ ] Confirmação de remoção de entregador
- [ ] Validação de limite de entregadores

### Frontend App Mobile (A Implementar)
- [ ] Tela: pedija-settings.tsx (ativar empresa no PediJá)
- [ ] Tela: driver-panel-own.tsx (painel do entregador próprio)
- [ ] Botão "Ativar no PediJá" no painel da empresa
- [ ] Explicação dos benefícios do PediJá
- [ ] Filtro de empresas online no PediJá
- [ ] Separação visual entre Guia Comercial e PediJá
- [ ] Painel do entregador próprio (ver apenas pedidos da sua empresa)
- [ ] Notificações push para entregadores próprios

### Sistema de Planos e Addons
- [ ] Adicionar campo hasOwnDriversAddon nos planos
- [ ] Adicionar campo ownDriversPrice nos planos
- [ ] Adicionar campo maxOwnDrivers nos planos
- [ ] Tela de compra de addon de entregadores
- [ ] Cobrança automática do addon
- [ ] Validação de limite de entregadores no plano

### Integração e Testes
- [ ] Aplicar migration v14 no banco do Railway
- [ ] Testar ativação/desativação no PediJá
- [ ] Testar toggle de status online
- [ ] Testar adição/remoção de entregadores
- [ ] Testar filtro de pedidos por empresa para entregadores próprios
- [ ] Testar notificações para entregadores próprios
- [ ] Vitest: Testes unitários para endpoints de delivery
- [ ] Vitest: Testes unitários para entregadores próprios


### Implementação Imediata (Próximos Passos)
- [x] Aplicar migration v14 no banco do Railway (script SQL criado)
- [x] Criar página DeliveryControl.tsx no PDV
- [x] Criar página ManageDrivers.tsx no PDV
- [x] Adicionar sistema de preços editáveis para addon de entregadores (padrão R$ 49/mês)
- [x] Adicionar botões na Home do PDV para acessar delivery e entregadores
- [x] Adicionar rotas no App.tsx
- [ ] Enviar código para repositório GitHub BuscaZap-PDV
- [ ] Configurar deploy automático no Railway
