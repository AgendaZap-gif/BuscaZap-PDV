# Login button placement on buscazap-site
_Exported on 2/25/2026 at 17:15:28 GMT-3 from Cursor (2.5.25)_

---

**User**

no repositorio "buscazap-site", na pagina home do site nao deve ter os botões ( Login PDV, Login Feira, Login Secretaria), esses botões devem estar na pagina "search" depois que entra no buscazap,

---

**Cursor**

Entendi. Vou localizar onde esses três botões estão sendo renderizados na Home do `buscazap-site`, remover de lá e inserir na página `search` (a tela que aparece depois que o usuário entra no BuscaZap), mantendo o mesmo visual/componente. Agora vou procurar pelos textos “Login PDV/Feira/Secretaria” no projeto para achar os arquivos exatos.

Beleza — tive dois problemas aqui: o caminho passado pro projeto não foi encontrado do jeito que enviei (provável formato de path) e a busca textual acabou estourando timeout. Vou primeiro validar o caminho real no disco e depois refazer a busca bem mais restrita (só em arquivos `.ts/.tsx/.js/.jsx`).

Vou checar o caminho do projeto pelo terminal (no ambiente aqui parece ser bash, não PowerShell) e, com o caminho confirmado, refaço a busca de forma bem focada para achar exatamente onde esses botões estão.

O terminal aqui está executando comandos como **PowerShell**, então vou usar `Get-ChildItem`/`Select-Object` em vez de `head`/`ls`. Em seguida, confirmo o caminho do `buscazap-site` e faço a busca pelos textos dos botões.

Estou aguardando o retorno do comando que valida o caminho do `buscazap-site`. Assim que confirmar a pasta correta, eu faço a busca pelos textos dos botões e movo a renderização da Home para a página `search`.

Boa — já achei exatamente onde os botões estão: `client/src/pages/Home.tsx` (eles aparecem duas vezes). Agora vou ler esse trecho, encontrar a página/rota `search`, e mover esse mesmo bloco de botões para lá.

### Ajuste feito no `buscazap-site`

- **Removi** os botões **“Login PDV / Login Feira / Login Secretaria”** da Home (`/`) em `client/src/pages/Home.tsx`.
- **Adicionei** esses mesmos botões na página **`/search`** em `client/src/pages/Search.tsx` (logo abaixo do header), para aparecerem **depois que entra no BuscaZap**.

Se quiser que esses botões apareçam só em desktop (ou também no mobile), eu ajusto as classes de responsividade.

---

**User**

entre no repositorio do aplicativo "buscazap" e veja como é a pagina do marketplace, exebi os produtos com meu link de afiliados, deve ser copiado essaa pagina do marketplace do aplicativo no site, quem acessa pelo site ve os mesmos produtos que estao no aplicativo, com os mesmos redirecionamentos e rotas

---

**Cursor**

Já existe no site a rota `/marketplace` apontando para `MarketplaceDelivery.tsx`, então eu aproveitei isso.

### O que eu fiz

- **Busquei a tela do app** `MarketplaceScreen` no repositório do aplicativo (`app/(tabs)/marketplace.tsx`) e a modal de produto (`components/product-detail-modal.tsx`), que usam `trpc.marketplace.list` e o campo `affiliateLink` para abrir o link de afiliado.
- **Usei o mesmo backend do app no site** através do `trpcClient` que o site já tem em `client/src/lib/trpc-client.ts` (aponta para `APP_SERVICE_URL/api/trpc`, igual ao app).
- **Atualizei a página do site** `client/src/pages/MarketplaceDelivery.tsx` para:
  - Chamar `trpcClient.marketplace.list.query({})` no `useEffect` e carregar os **mesmos produtos** do app (incluindo `affiliateLink`, categoria, preço, cashback).
  - Exibir um **grid de cards de produtos**, com imagem, nome, categoria, preço e cashback estimado.
  - Ter botões:
    - **“Ver detalhes”** → abre um **modal** com detalhes do produto (imagem maior, descrição, preço, cashback).
    - **“Comprar agora”** (no card e no modal) → abre `product.affiliateLink` em uma nova aba, ou seja, **mesmo redirecionamento de afiliado do app**.
  - Manter a seção “Marketplaces parceiros” como informação institucional adicional.

Agora, quem acessa o **site em `/marketplace`** vê a lista de produtos vinda do mesmo backend do aplicativo, com os **mesmos links de afiliado e lógica de redirecionamento**.

