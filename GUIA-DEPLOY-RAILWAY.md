# Guia de Deploy do BuscaZap PDV no Railway

Este documento fornece instruções detalhadas para realizar o deploy do sistema PDV (Ponto de Venda) do BuscaZap na plataforma Railway, garantindo integração completa com o app mobile e o website institucional.

## Arquitetura do Sistema

O ecossistema BuscaZap é composto por três componentes principais que compartilham o mesmo banco de dados MySQL hospedado no Railway:

**Componente** | **URL** | **Hospedagem** | **Função**
---|---|---|---
Website Institucional | buscazapbrasil.com.br | Externa | Portal de busca e informações
App Mobile Backend | API pública Railway | Railway | Backend do aplicativo mobile
PDV (Ponto de Venda) | pdv.buscazap.com.br | Railway | Sistema de gestão para estabelecimentos

### Vantagens da Arquitetura Unificada

A utilização do mesmo banco de dados entre o app mobile e o PDV proporciona benefícios significativos para a operação do sistema. Quando um produto é cadastrado no PDV, ele aparece automaticamente no cardápio do aplicativo mobile, eliminando a necessidade de sincronização manual. Os pedidos realizados pelos clientes através do app são recebidos instantaneamente no PDV, permitindo que o estabelecimento aceite, prepare e atualize o status em tempo real. Além disso, a conexão interna do Railway (`mysql.railway.internal`) entre o PDV e o banco de dados não gera custos adicionais de tráfego, tornando a solução economicamente viável.

## Pré-requisitos

Antes de iniciar o processo de deploy, certifique-se de que os seguintes requisitos estão atendidos:

- Conta ativa no Railway (https://railway.app)
- Projeto Railway existente com banco MySQL configurado
- Backend do app mobile BuscaZap já deployado no Railway
- Acesso ao painel de DNS do domínio buscazap.com.br
- Git instalado localmente
- Node.js versão 18 ou superior instalado

## Passo 1: Preparar o Banco de Dados

O primeiro passo consiste em aplicar as migrations necessárias para criar as tabelas específicas do PDV no banco de dados compartilhado.

### 1.1 Conectar ao Banco de Dados

Acesse o painel do Railway, navegue até o seu projeto e localize o serviço de banco de dados MySQL. Na seção "Connect", você encontrará as credenciais de conexão. Utilize o Railway CLI ou conecte-se via MySQL Workbench/DBeaver usando as seguintes informações:

```
Host: mysql.railway.internal (interno) ou [host-publico].railway.app (externo)
Port: 3306
User: root
Password: [sua-senha]
Database: railway
```

### 1.2 Aplicar Migration Unificada

Execute o script de migration unificado que cria todas as tabelas necessárias para o PDV funcionar corretamente. O arquivo `migration-unified-railway.sql` está localizado na raiz do projeto e pode ser executado de duas formas:

**Opção A: Via Railway CLI**

```bash
railway connect mysql
source /caminho/para/migration-unified-railway.sql
```

**Opção B: Via Cliente MySQL**

```bash
mysql -h [host] -P 3306 -u root -p[senha] railway < migration-unified-railway.sql
```

### 1.3 Verificar Tabelas Criadas

Após executar a migration, verifique se todas as tabelas foram criadas corretamente:

```sql
SHOW TABLES;
```

Você deverá ver as seguintes tabelas criadas ou atualizadas:

- `tables` - Mesas do restaurante
- `payment_methods` - Meios de pagamento
- `payments` - Registro de pagamentos
- `cash_registers` - Caixas abertos/fechados
- `cash_movements` - Movimentações de caixa
- `cash_closures` - Fechamentos de caixa
- `printers` - Impressoras térmicas configuradas
- `bill_splits` - Divisão de contas
- `chat_messages` - Mensagens do chat PDV ↔ Cliente
- `order_ratings` - Avaliações de pedidos

Além disso, as tabelas existentes `users`, `companies` e `orders` foram atualizadas com novos campos necessários para o PDV.

## Passo 2: Configurar Novo Serviço no Railway

Agora vamos criar um novo serviço no Railway especificamente para o PDV.

### 2.1 Criar Novo Serviço

No painel do Railway, dentro do seu projeto existente, clique em **"New Service"** e selecione **"GitHub Repo"**. Conecte o repositório do BuscaZap PDV (ou faça upload do código).

### 2.2 Configurar Variáveis de Ambiente

Na seção **"Variables"** do novo serviço PDV, adicione as seguintes variáveis de ambiente:

**Variável** | **Valor** | **Descrição**
---|---|---
`DATABASE_URL` | `mysql://root:[senha]@mysql.railway.internal:3306/railway` | Conexão interna com o banco (sem custo)
`NODE_ENV` | `production` | Ambiente de produção
`PORT` | `3000` | Porta do servidor
`JWT_SECRET` | `[sua-chave-secreta]` | Chave para autenticação JWT
`VITE_APP_TITLE` | `BuscaZap PDV` | Título da aplicação
`VITE_APP_LOGO` | `[url-do-logo]` | URL do logo do PDV

**Importante:** Utilize `mysql.railway.internal` como host do banco de dados para aproveitar a rede interna do Railway sem custos adicionais de tráfego.

### 2.3 Configurar Build e Start

O Railway detectará automaticamente o `package.json`, mas você pode configurar manualmente os comandos:

**Build Command:**
```bash
pnpm install && pnpm run build
```

**Start Command:**
```bash
pnpm start
```

## Passo 3: Configurar Domínio Personalizado

Para acessar o PDV através do subdomínio `pdv.buscazap.com.br`, siga os passos abaixo.

### 3.1 Adicionar Domínio no Railway

No serviço PDV recém-criado, vá até a seção **"Settings"** → **"Domains"** e clique em **"Custom Domain"**. Adicione o domínio:

```
pdv.buscazap.com.br
```

O Railway fornecerá um registro CNAME que você deverá configurar no seu provedor de DNS.

### 3.2 Configurar DNS

Acesse o painel de gerenciamento de DNS do domínio `buscazap.com.br` e adicione o seguinte registro:

**Tipo** | **Nome** | **Valor** | **TTL**
---|---|---|---
CNAME | pdv | [valor-fornecido-pelo-railway].up.railway.app | 3600

Aguarde a propagação do DNS (pode levar até 48 horas, mas geralmente ocorre em minutos).

### 3.3 Verificar Certificado SSL

O Railway provisiona automaticamente um certificado SSL via Let's Encrypt. Após a propagação do DNS, acesse:

```
https://pdv.buscazap.com.br
```

Você deverá ver a tela de login do PDV com conexão segura (cadeado verde no navegador).

## Passo 4: Testar Integração

Após o deploy bem-sucedido, é fundamental testar a integração entre todos os componentes do sistema.

### 4.1 Testar Login no PDV

Acesse `https://pdv.buscazap.com.br` e faça login com as credenciais de administrador:

```
Email: admin@buscazap.com.br
Senha: admin123
```

Se o login for bem-sucedido, o sistema está conectado corretamente ao banco de dados.

### 4.2 Testar Sincronização de Produtos

No PDV, navegue até **"Produtos"** e cadastre um novo produto com foto, nome, descrição, preço e categoria. Após salvar, abra o aplicativo mobile BuscaZap e verifique se o produto aparece no cardápio da empresa. Se o produto for exibido corretamente, a sincronização está funcionando.

### 4.3 Testar Recebimento de Pedidos

No aplicativo mobile, faça um pedido de teste como cliente. No PDV, acesse **"Pedidos BuscaZap"** e verifique se o pedido aparece na lista. Aceite o pedido e atualize o status para "Em preparo". No app mobile, confirme se o status foi atualizado em tempo real.

### 4.4 Testar Chat e Avaliações

Após aceitar um pedido, teste o sistema de chat enviando mensagens do PDV para o cliente. Verifique se as mensagens aparecem no app mobile. Quando o pedido for concluído, solicite uma avaliação no app e verifique se ela aparece no dashboard de avaliações do PDV.

## Passo 5: Configurar Integrações Adicionais

Para aproveitar todos os recursos do PDV, configure as integrações opcionais.

### 5.1 Configurar Impressoras Térmicas

No PDV, acesse **"Configurações"** → **"Impressoras"** e cadastre as impressoras térmicas da cozinha, bar e caixa. Informe o endereço IP local de cada impressora e o setor correspondente. Os pedidos serão impressos automaticamente ao serem aceitos.

### 5.2 Configurar Meios de Pagamento

Os meios de pagamento padrão (Dinheiro, Cartão de Crédito, Cartão de Débito e PIX) são criados automaticamente pela migration. Para adicionar novos meios de pagamento, acesse **"Configurações"** → **"Pagamentos"** no PDV.

### 5.3 Configurar Mesas

No PDV, acesse **"Gestão de Mesas"** e cadastre as mesas do estabelecimento, informando o número e a capacidade de cada uma. As mesas podem ser gerenciadas diretamente pelo garçom no modo mobile.

## Monitoramento e Logs

O Railway fornece ferramentas integradas para monitorar o desempenho e visualizar logs do PDV.

### Visualizar Logs em Tempo Real

No painel do Railway, acesse o serviço PDV e clique na aba **"Logs"**. Você verá os logs do servidor em tempo real, incluindo requisições HTTP, erros e mensagens de debug.

### Monitorar Uso de Recursos

Na aba **"Metrics"**, você pode visualizar gráficos de uso de CPU, memória e tráfego de rede do serviço PDV. Isso ajuda a identificar gargalos de performance e planejar escalabilidade.

### Configurar Alertas

O Railway permite configurar alertas por email ou webhook quando o serviço fica offline ou ultrapassa limites de uso de recursos. Configure alertas na seção **"Settings"** → **"Notifications"**.

## Solução de Problemas Comuns

Durante o deploy ou operação do PDV, você pode encontrar alguns problemas. Abaixo estão as soluções para os mais comuns.

### Erro de Conexão com o Banco de Dados

Se o PDV não conseguir conectar ao banco de dados, verifique se a variável `DATABASE_URL` está configurada corretamente com o host `mysql.railway.internal`. Certifique-se também de que o serviço PDV e o banco MySQL estão no mesmo projeto do Railway.

### Produtos Não Sincronizam com o App

Se os produtos cadastrados no PDV não aparecem no app mobile, verifique se ambos estão usando o mesmo banco de dados. Execute a query `SELECT * FROM products LIMIT 10;` no banco para confirmar que os produtos foram salvos corretamente.

### Pedidos Não Chegam no PDV

Se os pedidos do app não aparecem no PDV, verifique se a coluna `source` da tabela `orders` foi criada pela migration. Execute `DESCRIBE orders;` e confirme a presença do campo `source ENUM('app', 'pdv', 'buscazap')`.

### Domínio Personalizado Não Funciona

Se o domínio `pdv.buscazap.com.br` não carregar, verifique a propagação do DNS usando ferramentas como `dig` ou `nslookup`. Confirme que o registro CNAME está apontando corretamente para o domínio fornecido pelo Railway.

## Manutenção e Atualizações

Para manter o PDV atualizado e funcionando corretamente, siga as práticas recomendadas de manutenção.

### Aplicar Novas Migrations

Quando novas funcionalidades forem adicionadas ao PDV, novas migrations podem ser necessárias. Execute as migrations diretamente no banco de dados do Railway usando o mesmo processo descrito no Passo 1.2.

### Atualizar Código do PDV

Para atualizar o código do PDV, faça push das alterações para o repositório GitHub conectado ao Railway. O Railway detectará automaticamente as mudanças e fará o redeploy automaticamente.

### Backup do Banco de Dados

O Railway não oferece backups automáticos no plano gratuito. Configure backups manuais periódicos exportando o banco de dados:

```bash
mysqldump -h [host] -P 3306 -u root -p[senha] railway > backup-$(date +%Y%m%d).sql
```

Armazene os backups em um serviço de armazenamento externo como Google Drive ou AWS S3.

## Considerações de Segurança

A segurança do sistema é fundamental para proteger os dados dos clientes e do estabelecimento.

### Alterar Senhas Padrão

Após o primeiro login, altere imediatamente a senha padrão do usuário administrador (`admin123`). Utilize senhas fortes com pelo menos 12 caracteres, incluindo letras maiúsculas, minúsculas, números e símbolos.

### Configurar HTTPS

O Railway provisiona automaticamente certificados SSL via Let's Encrypt. Certifique-se de que o PDV está acessível apenas via HTTPS (https://pdv.buscazap.com.br) e nunca via HTTP.

### Limitar Acesso ao Banco de Dados

Utilize sempre a conexão interna (`mysql.railway.internal`) para o PDV acessar o banco de dados. Evite expor o banco de dados publicamente, a menos que seja estritamente necessário para ferramentas de administração.

### Revisar Permissões de Usuários

No PDV, configure perfis de acesso adequados para cada tipo de usuário (garçom, caixa, gerente, administrador). Garçons devem ter acesso apenas ao modo de atendimento, enquanto caixas devem ter acesso ao fechamento de caixa.

## Próximos Passos

Após concluir o deploy do PDV no Railway, você pode expandir as funcionalidades do sistema com as seguintes melhorias:

- **Implementar modo offline (PWA):** Permitir que o PDV funcione sem conexão com a internet, sincronizando dados quando a conexão for restabelecida.
- **Adicionar relatórios avançados:** Criar dashboards com análises de vendas, produtos mais vendidos, ticket médio e performance de garçons.
- **Integrar com sistemas de pagamento:** Conectar o PDV com gateways de pagamento como Mercado Pago, PagSeguro ou Stripe para processar pagamentos diretamente.
- **Desenvolver app mobile do PDV:** Criar uma versão mobile nativa do PDV para tablets e smartphones, otimizada para o modo garçom.

## Conclusão

Este guia forneceu um passo a passo completo para realizar o deploy do BuscaZap PDV no Railway, garantindo integração total com o app mobile e o website institucional. A arquitetura unificada com banco de dados compartilhado permite sincronização automática de produtos e pedidos, proporcionando uma experiência fluida para estabelecimentos e clientes. Com o PDV deployado e funcionando corretamente, o ecossistema BuscaZap está pronto para atender estabelecimentos comerciais de forma eficiente e escalável.

---

**Autor:** Manus AI  
**Data:** 09 de Janeiro de 2025  
**Versão:** 1.0
