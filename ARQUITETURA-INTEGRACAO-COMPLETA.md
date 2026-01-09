# Arquitetura e Integração Completa do Ecossistema BuscaZap

Este documento apresenta a arquitetura completa do ecossistema BuscaZap, detalhando como o website institucional, o aplicativo mobile e o sistema PDV (Ponto de Venda) se integram para formar uma solução unificada de delivery e gestão empresarial.

## Visão Geral do Ecossistema

O BuscaZap é uma plataforma integrada que conecta clientes, estabelecimentos comerciais e entregadores através de três interfaces principais. O sistema foi projetado para compartilhar um único banco de dados MySQL, garantindo sincronização automática de informações entre todos os componentes.

### Componentes do Sistema

O ecossistema é composto por três componentes principais que operam de forma integrada:

**Website Institucional (buscazapbrasil.com.br)** serve como portal de entrada para novos usuários e estabelecimentos. Através dele, clientes podem buscar empresas por categoria, cidade e estado, visualizar informações detalhadas de cada estabelecimento e acessar o sistema PDV através de um botão dedicado. O website consulta o banco de dados do app mobile via API pública para exibir resultados de busca em tempo real.

**Aplicativo Mobile** é a interface principal para clientes realizarem pedidos e para estabelecimentos gerenciarem seus negócios. Clientes podem navegar pelo cardápio, fazer pedidos, acompanhar status em tempo real, avaliar estabelecimentos e conversar via chat com o estabelecimento. Estabelecimentos podem gerenciar produtos, receber notificações de novos pedidos, atualizar status de pedidos e responder mensagens de clientes. O backend do app mobile está hospedado no Railway e utiliza tRPC para comunicação type-safe entre cliente e servidor.

**Sistema PDV (pdv.buscazap.com.br)** é a interface web completa para estabelecimentos gerenciarem operações presenciais e de delivery. O PDV oferece gestão de mesas e comandas, modo garçom otimizado para tablets, tela de cozinha (KDS), fechamento de caixa, recebimento de pedidos do app mobile, chat direto com clientes, dashboard de estatísticas e integração com impressoras térmicas. O PDV está hospedado no Railway e compartilha o mesmo banco de dados do app mobile, garantindo sincronização automática.

## Arquitetura de Banco de Dados Unificado

A decisão de utilizar um único banco de dados MySQL compartilhado entre o app mobile e o PDV traz benefícios significativos para a operação do sistema.

### Estrutura do Banco de Dados

O banco de dados MySQL está hospedado no Railway e contém todas as tabelas necessárias para o funcionamento completo do ecossistema. As tabelas principais incluem:

**Tabelas Compartilhadas (App + PDV):**
- `users` - Usuários do sistema (clientes, admins, funcionários)
- `companies` - Estabelecimentos cadastrados
- `products` - Produtos do cardápio
- `categories` - Categorias de produtos
- `orders` - Pedidos (app e PDV)
- `order_items` - Itens dos pedidos
- `delivery_requests` - Solicitações de entrega
- `chat_messages` - Mensagens do chat
- `order_ratings` - Avaliações de pedidos

**Tabelas Específicas do PDV:**
- `tables` - Mesas do restaurante
- `payment_methods` - Meios de pagamento
- `payments` - Registro de pagamentos
- `cash_registers` - Caixas abertos/fechados
- `cash_movements` - Movimentações de caixa
- `cash_closures` - Fechamentos de caixa
- `printers` - Impressoras térmicas
- `bill_splits` - Divisão de contas

### Sincronização Automática

A sincronização entre app mobile e PDV ocorre de forma automática e em tempo real através do banco de dados compartilhado. Quando um produto é cadastrado no PDV, ele é inserido na tabela `products` e imediatamente fica disponível no cardápio do app mobile. Quando um cliente faz um pedido pelo app, o registro é criado na tabela `orders` com o campo `source = 'app'`, e o PDV consulta essa tabela a cada 5 segundos através de polling, exibindo novos pedidos instantaneamente. Quando o estabelecimento atualiza o status do pedido no PDV, o app mobile detecta a mudança e notifica o cliente em tempo real.

## Fluxo de Integração: Do Pedido à Entrega

O processo completo de um pedido no ecossistema BuscaZap envolve múltiplas interações entre os componentes do sistema.

### Passo 1: Cliente Faz Pedido no App

O cliente abre o aplicativo mobile, navega pelo cardápio do estabelecimento e adiciona produtos ao carrinho. Ao finalizar o pedido, o app envia uma requisição tRPC para o backend, que cria um registro na tabela `orders` com `source = 'app'` e registros correspondentes na tabela `order_items` para cada produto do pedido. O cliente recebe uma confirmação visual no app e aguarda a aceitação do estabelecimento.

### Passo 2: PDV Recebe Notificação

O PDV realiza polling a cada 5 segundos na rota `buscazapIntegration.getOrders`, consultando pedidos com `source = 'app'` e `status = 'pending'`. Quando um novo pedido é detectado, o PDV emite um som de alerta (beep duplo) e exibe um card visual com os detalhes do pedido, incluindo nome do cliente, endereço de entrega, itens do pedido, valor total e tempo estimado de entrega. O funcionário do estabelecimento pode aceitar ou rejeitar o pedido através de botões na interface.

### Passo 3: Estabelecimento Aceita e Prepara

Ao aceitar o pedido, o PDV chama a rota `buscazapIntegration.acceptOrder`, que atualiza o status do pedido para `accepted` no banco de dados e dispara a impressão automática do pedido na impressora da cozinha. O app mobile detecta a mudança de status e notifica o cliente que o pedido foi aceito. O funcionário da cozinha visualiza o pedido na tela de cozinha (KDS) e marca os itens como "em preparo". O PDV atualiza o status para `preparing` e o cliente é notificado novamente.

### Passo 4: Chat e Acompanhamento

Durante o preparo, o cliente pode enviar mensagens para o estabelecimento através do chat integrado no app. As mensagens são salvas na tabela `chat_messages` com `senderType = 'customer'`. O PDV consulta essa tabela a cada 2 segundos e exibe as mensagens na interface de chat. O estabelecimento pode responder com mensagens pré-definidas ou personalizadas, que são salvas com `senderType = 'business'` e aparecem instantaneamente no app do cliente.

### Passo 5: Pedido Pronto e Entrega

Quando o pedido está pronto, o PDV atualiza o status para `ready` e o cliente é notificado. Se o pedido for para entrega, o estabelecimento pode solicitar um entregador através do PDV, que cria um registro na tabela `delivery_requests`. O entregador aceita a solicitação e busca o pedido no estabelecimento. Durante a entrega, o status é atualizado para `out_for_delivery`. Quando o pedido é entregue, o status final é `delivered` e o cliente recebe uma notificação solicitando avaliação.

### Passo 6: Avaliação e Feedback

Após a entrega, o cliente pode avaliar o pedido com estrelas de 1 a 5 e um comentário opcional. A avaliação é salva na tabela `order_ratings` e fica disponível no dashboard do PDV. O estabelecimento pode visualizar a média de avaliações, distribuição por estrelas e insights automáticos sobre a satisfação dos clientes.

## Integração do Website com o Ecossistema

O website institucional (buscazapbrasil.com.br) serve como ponto de entrada para o ecossistema BuscaZap, oferecendo funcionalidades de busca e acesso ao PDV.

### Funcionalidades do Website

O website permite que usuários busquem estabelecimentos por nome, categoria, cidade ou estado. Os resultados da busca são obtidos através de requisições à API pública do backend do app mobile, consultando as tabelas `companies` e `categories`. Cada estabelecimento exibido mostra informações como nome, categoria, endereço, horário de funcionamento e avaliação média. O website também oferece um botão "Acessar PDV" que redireciona para a página de login do sistema PDV.

### Fluxo de Acesso ao PDV via Website

Quando um usuário clica no botão "Acessar PDV" no website, ele é redirecionado para `pdv.buscazap.com.br/login`. Após fazer login com email e senha, o sistema verifica se o usuário possui plano ativo através da rota `plan.checkPlan({ userId })`. Se o usuário tiver plano destaque ativo, ele é redirecionado para o PDV completo com todas as funcionalidades. Se o usuário não tiver plano ativo, ele é redirecionado para uma versão limitada do PDV com apenas três funcionalidades básicas: receber pedidos do app, atualizar status de pedidos e solicitar entregador.

### Verificação de Plano

A verificação de plano é realizada através de um endpoint tRPC no backend do PDV. A rota `plan.checkPlan` recebe o ID do usuário e consulta a tabela `users` para verificar os campos `planType` e `planExpiresAt`. Se `planType = 'destaque'` e `planExpiresAt` for uma data futura, o plano é considerado ativo. Caso contrário, o acesso é limitado. Essa verificação garante que apenas estabelecimentos com plano pago tenham acesso completo ao PDV.

## Configuração de Domínios e DNS

A configuração correta dos domínios é essencial para o funcionamento do ecossistema BuscaZap.

### Website Institucional (buscazapbrasil.com.br)

O website está hospedado em um servidor externo (não Railway) e requer configuração de DNS no provedor de domínio. O registro DNS deve apontar para o IP ou CNAME fornecido pelo provedor de hospedagem. O website faz requisições à API pública do backend do app mobile no Railway para buscar dados de estabelecimentos.

### Sistema PDV (pdv.buscazap.com.br)

O PDV está hospedado no Railway e utiliza um subdomínio do domínio principal. A configuração requer a criação de um registro CNAME no provedor de DNS apontando para o domínio fornecido pelo Railway. O Railway provisiona automaticamente um certificado SSL via Let's Encrypt, garantindo conexão segura (HTTPS).

**Configuração DNS para PDV:**

```
Tipo: CNAME
Nome: pdv
Valor: [seu-servico].up.railway.app
TTL: 3600
```

Após a propagação do DNS (geralmente alguns minutos), o PDV estará acessível em `https://pdv.buscazap.com.br`.

## Segurança e Autenticação

A segurança do ecossistema BuscaZap é garantida através de múltiplas camadas de proteção.

### Autenticação de Usuários

O sistema utiliza autenticação baseada em JWT (JSON Web Tokens) para validar sessões de usuários. Quando um usuário faz login no PDV, o backend verifica as credenciais no banco de dados e, se válidas, gera um token JWT assinado com uma chave secreta (`JWT_SECRET`). Esse token é armazenado em um cookie HTTP-only e enviado em todas as requisições subsequentes. O middleware de autenticação do tRPC valida o token em cada requisição e injeta os dados do usuário no contexto (`ctx.user`).

### Níveis de Acesso

O sistema implementa controle de acesso baseado em roles (funções) definidas na tabela `users`. Os roles disponíveis incluem:

- `admin_global` - Acesso total ao sistema, pode gerenciar todas as empresas
- `admin_city` - Acesso a empresas de uma cidade específica
- `company` - Acesso ao PDV da própria empresa
- `user` - Cliente do app mobile
- `delivery_driver` - Entregador
- `waiter` - Garçom (acesso limitado no PDV)
- `cashier` - Caixa (acesso ao fechamento de caixa)
- `manager` - Gerente (acesso a relatórios)
- `kitchen` - Cozinha (acesso à tela de cozinha)

Cada rota tRPC valida o role do usuário antes de executar operações sensíveis, garantindo que apenas usuários autorizados possam acessar funcionalidades específicas.

### Proteção de Dados Sensíveis

Senhas de usuários são armazenadas com hash bcrypt no banco de dados, nunca em texto plano. A comunicação entre cliente e servidor sempre ocorre via HTTPS, criptografando dados em trânsito. Variáveis de ambiente sensíveis (como `JWT_SECRET` e `DATABASE_URL`) são armazenadas no Railway e nunca expostas no código-fonte. O banco de dados utiliza conexão interna (`mysql.railway.internal`) no Railway, evitando exposição pública.

## Escalabilidade e Performance

O ecossistema BuscaZap foi projetado para escalar conforme a demanda cresce.

### Estratégias de Escalabilidade

O Railway permite escalar horizontalmente os serviços do app mobile e do PDV, adicionando mais instâncias conforme necessário. O banco de dados MySQL pode ser migrado para uma instância maior ou para um serviço gerenciado como AWS RDS ou Google Cloud SQL quando o volume de dados aumentar. O sistema de polling para novos pedidos e mensagens pode ser substituído por WebSockets para comunicação em tempo real mais eficiente, reduzindo a carga no servidor.

### Otimizações de Performance

O uso de índices no banco de dados garante consultas rápidas mesmo com milhares de pedidos e produtos. As tabelas principais possuem índices em campos frequentemente consultados, como `companyId`, `status`, `orderId` e `userId`. O sistema de cache pode ser implementado usando Redis para armazenar consultas frequentes, como lista de produtos e categorias, reduzindo a carga no banco de dados. O frontend do PDV utiliza React Query (via tRPC) para cache automático de dados no cliente, evitando requisições desnecessárias ao servidor.

## Monitoramento e Manutenção

A manutenção contínua do ecossistema BuscaZap garante estabilidade e confiabilidade.

### Monitoramento de Serviços

O Railway oferece ferramentas integradas de monitoramento, incluindo visualização de logs em tempo real, métricas de CPU, memória e tráfego de rede, e alertas automáticos quando serviços ficam offline. Recomenda-se configurar alertas por email ou webhook para ser notificado imediatamente em caso de problemas. Ferramentas externas como Sentry podem ser integradas para rastreamento de erros em produção.

### Backup e Recuperação

O banco de dados MySQL deve ter backups automáticos configurados. No Railway, backups manuais podem ser realizados através de exportação SQL. Recomenda-se realizar backups diários e armazená-los em um serviço de armazenamento externo como AWS S3 ou Google Cloud Storage. Em caso de falha catastrófica, o banco de dados pode ser restaurado a partir do backup mais recente, minimizando perda de dados.

### Atualizações e Migrations

Quando novas funcionalidades são adicionadas ao sistema, novas migrations de banco de dados podem ser necessárias. As migrations devem ser sempre idempotentes (podem ser executadas múltiplas vezes sem causar erros) e incrementais (não apagam dados existentes). Antes de aplicar migrations em produção, sempre teste em um ambiente de desenvolvimento ou staging. Após aplicar migrations, verifique se todas as tabelas e colunas foram criadas corretamente através de consultas SQL.

## Roadmap de Funcionalidades Futuras

O ecossistema BuscaZap está em constante evolução, com novas funcionalidades planejadas para os próximos meses.

### Modo Offline (PWA)

Implementar Progressive Web App (PWA) no PDV para permitir funcionamento sem conexão com a internet. Os dados serão armazenados localmente usando IndexedDB e sincronizados automaticamente quando a conexão for restabelecida. Isso é especialmente útil para estabelecimentos com internet instável.

### Relatórios Avançados

Criar dashboards interativos com análises detalhadas de vendas, incluindo produtos mais vendidos, faturamento por categoria, ticket médio, performance de garçons e comparações entre períodos. Os relatórios poderão ser exportados em PDF ou Excel para análise offline.

### Integração com Gateways de Pagamento

Conectar o PDV com gateways de pagamento como Mercado Pago, PagSeguro e Stripe para processar pagamentos diretamente pelo sistema. Isso permitirá que clientes paguem via PIX, cartão de crédito ou boleto sem sair do app.

### App Mobile Nativo do PDV

Desenvolver uma versão mobile nativa do PDV para iOS e Android, otimizada para tablets e smartphones. O app será focado no modo garçom, permitindo atendimento ágil e intuitivo em dispositivos móveis.

### Sistema de Fidelidade

Implementar programa de fidelidade onde clientes acumulam pontos a cada compra e podem trocá-los por descontos ou produtos gratuitos. O sistema será integrado ao app mobile e ao PDV.

## Conclusão

O ecossistema BuscaZap representa uma solução completa e integrada para delivery e gestão empresarial. A arquitetura unificada com banco de dados compartilhado garante sincronização automática entre todos os componentes, proporcionando uma experiência fluida para clientes, estabelecimentos e entregadores. O website institucional serve como porta de entrada, o aplicativo mobile conecta clientes e estabelecimentos, e o sistema PDV oferece ferramentas completas de gestão. Com deploy no Railway e configuração adequada de domínios, o ecossistema está pronto para operar em produção de forma escalável e confiável.

---

**Autor:** Manus AI  
**Data:** 09 de Janeiro de 2025  
**Versão:** 1.0
