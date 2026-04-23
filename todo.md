# Yume Multiramo - TODO

## Fase 1: Schema e Banco de Dados
- [x] Adicionar campo 'businessType' (enum: 'commerce', 'services', 'restaurant') na tabela sellers
- [x] Criar migration para atualizar schema
- [x] Adicionar tipos TypeScript para businessType

## Fase 2: Contexto React e Hooks
- [x] Criar BusinessTypeContext para gerenciar tipo de negócio globalmente
- [x] Implementar hook useBusinessType() para consumir contexto
- [x] Implementar hook useBusinessConfig() para retornar configurações específicas do ramo
- [x] Criar provider BusinessTypeProvider

## Fase 3: Onboarding
- [x] Criar tela BusinessTypeSelection para seleção inicial de ramo
- [x] Implementar fluxo de onboarding no App.tsx
- [x] Integrar seleção com banco de dados via tRPC

## Fase 4: Componente ProductForm Adaptável
- [x] Criar ProductForm com campos condicionais por businessType
- [x] Implementar validações específicas por ramo
- [x] Adaptar labels e placeholders dinamicamente

## Fase 5: Dashboard e Navegação
- [x] Adaptar labels de navegação por businessType
- [x] Atualizar ícones e terminologia no dashboard
- [x] Implementar breadcrumbs contextuais

## Fase 6: PDV Adaptável
- [ ] Adaptar fluxo de venda para comércio (estoque)
- [ ] Adaptar fluxo de venda para serviços (agendamento)
- [ ] Adaptar fluxo de venda para restaurantes (delivery)

## Fase 11: Páginas de Produtos/Serviços/Cardápio
- [x] Criar página Products com listagem adaptável
- [x] Criar página ProductNew para criar/editar
- [x] Integrar com rotas no App.tsx

## Fase 7: Procedures tRPC
- [x] Criar procedure para atualizar businessType
- [x] Criar procedure para retornar configurações por ramo
- [x] Criar procedure para listar categorias pré-configuradas

## Fase 8: Sistema de Categorias
- [ ] Implementar templates de categorias por ramo
- [ ] Criar procedure para inicializar categorias padrão
- [ ] Implementar UI para seleção de categorias

## Fase 9: Validações e Testes
- [x] Adicionar validações específicas por ramo
- [x] Implementar testes unitários com Vitest
- [x] Testar fluxos de cada ramo

## Fase 10: Entrega
- [ ] Revisar todas as funcionalidades
- [ ] Criar checkpoint final
- [ ] Entregar projeto ao usuário


## Fase 15: Página de Detalhes de Cliente
- [ ] Criar página CustomerDetails com histórico de pedidos
- [ ] Implementar análise de compras (frequência, ticket médio)
- [ ] Adicionar opções de comunicação direta (WhatsApp, Email)
- [ ] Integrar com tRPC para carregar dados reais

## Fase 16: Dashboard de Estoque
- [ ] Criar página Stock com listagem de produtos
- [ ] Implementar alertas de baixo estoque
- [ ] Adicionar histórico de movimentações
- [ ] Implementar previsão de reposição baseada em vendas
- [ ] Integrar com tRPC

## Fase 17: Dashboard de Relatórios Financeiros
- [ ] Criar página Reports com gráficos de receita
- [ ] Implementar gráfico de despesas
- [ ] Adicionar análise de margem de lucro
- [ ] Implementar gráfico de cash flow por período
- [ ] Integrar com tRPC

## Fase 18: Página de Configurações da Loja
- [ ] Criar página Settings com formulário de edição
- [ ] Implementar campos de dados da empresa
- [ ] Adicionar horários de funcionamento
- [ ] Implementar informações bancárias
- [ ] Adicionar dados de contato
- [ ] Integrar com tRPC

## Fase 19: Integração com tRPC e Navegação
- [x] Adicionar rotas para todas as novas páginas
- [x] Atualizar navegação do dashboard
- [x] Implementar links de navegação entre páginas
- [x] Testar fluxos completos

## Fase 20: Integração tRPC com Dados Reais
- [ ] Corrigir schema do banco de dados
- [ ] Executar migração completa do banco
- [ ] Conectar Customers ao tRPC
- [ ] Conectar Orders ao tRPC
- [ ] Conectar Stock ao tRPC
- [ ] Conectar Reports ao tRPC

## Fase 21: Módulo de PDV
- [ ] Criar página de PDV com interface de carrinho
- [ ] Implementar adicionar/remover itens do carrinho
- [ ] Criar modal de checkout com formas de pagamento
- [ ] Integrar com tRPC para criar pedidos
- [ ] Implementar integração com estoque
- [ ] Adicionar histórico de transações do PDV

## Fase 22: Notificações em Tempo Real
- [ ] Implementar WebSocket para notificações
- [ ] Criar sistema de alertas para novos pedidos
- [ ] Criar alertas de baixo estoque
- [ ] Criar notificações de eventos importantes
- [ ] Adicionar centro de notificações na interface

## Fase 23: Sidebar de Navegação
- [x] Criar componente de Sidebar com navegação completa
- [x] Integrar Sidebar no layout principal
- [x] Adaptar Sidebar para cada tipo de negócio
- [x] Adicionar ícones e estilos visuais
- [x] Testar navegação e responsividade
