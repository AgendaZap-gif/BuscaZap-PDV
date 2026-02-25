# Map display and earnings update issues
_Exported on 2/25/2026 at 17:14:36 GMT-3 from Cursor (2.5.25)_

---

**User**

no repositorio "buscazap", no aplicativo logado como entregador, e no painel do entregador quando abre a pagina com o mapa e solicitações de entrega, o mapa continua aparecendo pequeno, atualizar pra o mapa aparecer grande, no tamnho vertical, quase em 9:16.
Na pagina "Ganhos" nao esta sendo atualizado os ganhos do entregador, nem a função de sacar e os dados

---

**Cursor**

Beleza — vou atacar em duas frentes: (1) achar a tela do **painel do entregador** que renderiza o mapa + lista de solicitações e ajustar o layout para o mapa ocupar quase toda a altura (proporção próxima de **9:16**). (2) investigar a página **“Ganhos”** do entregador para ver por que não está atualizando (dados, cálculo, refresh/polling) e por que a ação de **sacar** não funciona/atualiza. Vou primeiro localizar os arquivos e rotas envolvidos e depois aplicar os ajustes e validar com build/lints.

Vou agora localizar rapidamente as rotas/componentes dessas duas telas (painel com mapa e “Ganhos”), e em seguida ajusto o CSS/estrutura e corrijo o fluxo de dados/saque.

Achei um detalhe: as buscas falharam porque o caminho que eu passei parece não estar acessível do jeito que a ferramenta espera. Vou primeiro confirmar o diretório raiz atual do workspace e o caminho exato do repo, e aí refaço as buscas no lugar certo.

Vou rodar os comandos equivalentes em PowerShell (`Get-Location` / `Get-ChildItem`) e também listar as pastas acima para garantir que estou no repo certo antes de eu buscar pelos arquivos de “entregador”, “Ganhos” e “sacar”.

Já confirmei que o diretório atual é o repo `c:\dev\novo\24-01\buscazap-1\...\buscazap\buscazap`. O comando de listagem travou (provavelmente por volume de arquivos), então vou interromper e refazer uma listagem bem mais “leve” só das pastas principais; daí eu consigo buscar com precisão os arquivos das telas do entregador.

Vou refazer as buscas usando o diretório padrão do workspace (que já está apontando para esse repo), sem passar caminho absoluto — isso costuma resolver esse erro de “path not found” no Windows.

Agora já identifiquei os arquivos certos: `app/driver-panel.tsx` (painel do entregador com mapa/solicitações) e `app/driver-earnings.tsx` (Ganhos). Vou ler esses dois e ajustar: mapa ocupar altura quase toda da tela e a página de ganhos atualizar (dados + sacar) corretamente.

### Ajuste do mapa (painel do entregador + tela de rotas)
- **Mapa agora fica bem mais alto (quase 9:16)**: aumentei o cálculo de altura do mapa para priorizar a proporção vertical e limitar pela altura útil da tela.
- **Corrigi um problema que “encolhia” o mapa na tela de rotas**: em `app/delivery-route/index.tsx` o container tinha `height: MAP_HEIGHT` *e* o `RouteMap` também recebia `height={MAP_HEIGHT}`, então o texto acima acabava “comendo” a área do mapa e ele ficava pequeno/clippado.
- **`RouteMap` agora respeita a largura do container**: troquei de largura fixa da tela para `width: "100%"`, evitando recortes/efeitos estranhos quando o mapa está dentro de cards com margens.

Arquivos alterados:
- `app/driver-panel.tsx`
- `app/delivery-route/index.tsx`
- `components/driver/RouteMap.tsx`

### Página “Ganhos” (atualização + sacar + dados)
- **Ganhos agora atualizam de verdade**: a tela estava usando rotas tRPC que não existem nesse backend (`withdrawals.*` / `bankAccounts.*`) e também um hook de auth diferente. Troquei para **APIs reais do projeto**: `trpc.deliveries.driverEarnings` e `trpc.deliveries.driverHistory`.
- **Auto-atualização**: coloquei `refetchInterval: 15000` e `refetchOnMount: true` (além do pull-to-refresh).
- **Botão “Sacar” funcionando**: como não existe sistema de saque/banco implementado no backend atual, o botão **abre o WhatsApp do suporte** já com uma mensagem preenchida com **ID do entregador, total e nº de entregas** (em vez de não fazer nada).

Arquivo alterado:
- `app/driver-earnings.tsx`

### Validação rápida
- **Sem lints** nos arquivos mexidos.
- Rodei `pnpm check`: ele ainda falha por **erros TypeScript já existentes** em `server/routers.ts`/`server/db.ts`/tests (fora do escopo dessas telas), mas corrigi um arquivo “rascunho” que quebrava o check: `server/routers.ts-fix.ts`.

Se você me disser **qual tela exatamente** você está vendo quando “o mapa fica pequeno” (se é o **Painel do Entregador** ou a tela **Rotas e entregas**), eu também ajusto fino a altura (ex.: ocupar ainda mais, tipo 85–90% da altura útil).

---

**User**

tela Rotas e entregas,

e tambem corrija os erros TypeScript já existentes em server/routers.ts/server/db.ts/tests

