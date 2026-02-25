# Camadas de segurança para o BuscaZap
_Exported on 2/25/2026 at 17:15:00 GMT-3 from Cursor (2.5.25)_

---

**User**

no aplicativo e site que usa a mesma função e rota, criar essa forma dentro de "Busca/Entrega:

2️⃣ Camadas de Segurança que o BuscaZap pode implementar
🔹 1. Verificação Rígida de Entregadores

Modelo tipo:
Documento validado (CPF + selfie)
Validação facial
Checagem de antecedentes (opcional, futuro)
Conta bancária vinculada
Termo jurídico assinado
Exemplo de comunicação:
“Todos os entregadores do BuscaZap são verificados com documento e validação facial.”
Isso já muda a percepção.

🔹 2. Sistema de Avaliação Bidirecional

Modelo tipo Uber
Usuário avalia entregador
Entregador avalia usuário
Média pública no perfil
Transparência gera confiança.

🔹 3. Código de Entrega (PIN de Segurança)

Modelo tipo iFood
Fluxo:
Usuário solicita entrega
App gera um PIN único (ex: 4821)
Entregador só confirma retirada digitando esse código
Usuário só confirma recebimento digitando outro código
Isso evita:
Entregador falso
Entrega errada
Fraude

🔹 4. Foto Obrigatória da Encomenda

Antes de retirar:
📸 Entregador tira foto do pacote
Antes de finalizar:
📸 Foto no local de entrega
Isso cria:
Prova visual
Histórico no pedido
Segurança jurídica

🔹 5. Rastreamento em Tempo Real

Mapa ao vivo:
Localização do entregador
Status: “A caminho”, “Retirado”, “Entregue”
Isso reduz ansiedade.

🔹 6. Seguro de Entrega (Diferencial Forte)

Você pode criar:
🟢 Seguro BuscaZap
Cobertura até R$ X por pedido
Incluso na taxa
Ou opcional (premium)
Isso muda o jogo.
Usuário pensa:
“Se algo acontecer, eu não perco.”

🔹 7. Pagamento Retido (Escrow Light)

Modelo marketplace:
Cliente paga
Valor fica retido
Só libera para entregador após confirmação
Isso cria confiança automática.

🧠 3️⃣ Como comunicar isso no app?

Segurança não é só existir.
Tem que ser visível.

Exemplo de seção na tela de pedido:

🔒 Sua entrega está protegida:
✔ Entregador verificado
✔ Código de confirmação
✔ Rastreamento ao vivo
✔ Suporte 24h
✔ Seguro até R$ 500

Isso reduz fricção.

Modelo ideal: Sistema em Camadas
Você pode ter:

🟢 1️⃣ Entrega Express (rápida e simples)

Para:
Itens de baixo valor
Pequenas compras
Esquecidos, documentos simples
Segurança básica:
✔ Entregador verificado
✔ Rastreamento ao vivo
✔ Avaliação
✔ Código PIN de confirmação

Sem seguro incluso.

🔵 2️⃣ Entrega Protegida (premium)
Para:
Eletrônicos
Itens de valor
Compras maiores
Objetos frágeis
Segurança avançada:
✔ Tudo da Express
✔ Seguro incluso até R$ X
✔ Fotos obrigatórias na retirada e entrega
✔ Pagamento retido até confirmação
✔ Prioridade para entregadores Ouro
✔ Suporte prioritário

Taxa maior.

🧠 Por que isso funciona?

Você atende:

Perfil	O que ele quer	O que você oferece
Usuário casual	Preço baixo e rapidez	Express
Usuário cauteloso	Segurança e garantia	Protegida

Você aumenta:
Ticket médio
Receita por pedido
Confiança
Retenção

> Verificação Forte de Entregadores

Documento validado
Selfie com prova de vida
CPF verificado
Conta bancária vinculada
Termo jurídico assinado digitalmente
Isso já te protege legalmente.

2️⃣ Sistema de Código PIN Duplo
Modelo tipo Uber
Fluxo:
Usuário recebe PIN de retirada
Entregador só inicia após digitar
Usuário recebe PIN de entrega
Só finaliza após confirmação
Evita fraude.

3️⃣ Foto Obrigatória (somente no modo Protegido)

Antes da retirada:
📸 Foto do item

Antes da entrega:
📸 Foto no destino

Isso vira prova jurídica.

4️⃣ Seguro Embutido (no modo Protegido)

Você pode começar simples:
Cobertura até R$ 500
Incluso na taxa premium
Limite por categoria
Não precisa virar seguradora.
Pode criar fundo interno.

5️⃣ Pagamento Retido (Escrow)

Modelo marketplace:
Cliente paga
Dinheiro fica retido
Libera após confirmação
Isso muda a percepção de segurança instantaneamente.

6️⃣ Entregador Ouro

Crie hierarquia:
Requisitos:
+100 entregas
Avaliação > 4.8
Zero incidentes graves

Usuário vê:
⭐ Entregador Ouro
Confiança automática.

📊 Estratégia de Comunicação Dentro do App

Na tela de escolha:

🚀 Entrega Express
Entrega rápida e econômica
Ideal para itens simples

🛡️ Entrega Protegida
Entrega com seguro e proteção extra
Ideal para itens de maior valor

✔ Seguro incluso
✔ Fotos obrigatórias
✔ Pagamento protegido

Banco precisa ter:

delivery_type (express | protected)
declared_value
insurance_coverage
pickup_photo_url
dropoff_photo_url
confirmation_pin
status_history

Isso permite escalar o modelo.

---

**Cursor**

Vou localizar onde fica hoje o fluxo de "Busca/Entrega" no app/site (tela e rota/função compartilhada) e, a partir disso, desenhar/implementar o modelo com `delivery_type`, PIN duplo, fotos, seguro etc. Depois ajusto o front (app+site) para mostrar Express x Protegida e os textos de segurança.

### Visão geral

Vou te passar um desenho completo de como implementar isso **usando a mesma função/rota** para app e site, com:

- **camada de modelo/banco**
- **rota de criação de entrega**
- **lógica de PIN, fotos e histórico**
- **UI “Busca/Entrega” com Express x Protegida e comunicação de segurança**

Vou usar nomes em inglês/camelCase no código, mas mantendo exatamente os conceitos que você descreveu.

---

### 1. Modelagem de banco (`delivery_requests`)

Na tabela `delivery_requests` você já tem bastante coisa (endereços, tipo de entrega, distância etc.).  
Para o modelo que você descreveu, eu adicionaria:

```sql
ALTER TABLE `delivery_requests`
  ADD COLUMN `deliveryMode` ENUM('express', 'protected') NOT NULL DEFAULT 'express',
  ADD COLUMN `declaredValue` INT NULL,          -- em centavos, ex: R$ 500,00 = 50000
  ADD COLUMN `insuranceCoverage` INT NULL,      -- em centavos
  ADD COLUMN `pickupPhotoUrl` TEXT NULL,
  ADD COLUMN `dropoffPhotoUrl` TEXT NULL,
  ADD COLUMN `confirmationPinPickup` VARCHAR(10) NULL,
  ADD COLUMN `confirmationPinDropoff` VARCHAR(10) NULL,
  ADD COLUMN `statusHistory` JSON NULL;
```

Mapeando com o que você pediu:

- **delivery_type (express | protected)** → `deliveryMode` (enum express/protected)
- **declared_value** → `declaredValue` (int em centavos)
- **insurance_coverage** → `insuranceCoverage` (int em centavos)
- **pickup_photo_url** → `pickupPhotoUrl`
- **dropoff_photo_url** → `dropoffPhotoUrl`
- **confirmation_pin** → `confirmationPinPickup` + `confirmationPinDropoff` (modelo PIN duplo)
- **status_history** → `statusHistory` (JSON com array de eventos)

Exemplo de `statusHistory`:

```json
[
  { "status": "pending",   "at": "2025-02-25T10:00:00Z", "by": "user:123" },
  { "status": "accepted",  "at": "2025-02-25T10:05:00Z", "by": "driver:456" },
  { "status": "picked_up", "at": "2025-02-25T10:20:00Z", "by": "driver:456", "pin": "4821" },
  { "status": "delivered", "at": "2025-02-25T10:45:00Z", "by": "user:123",  "pin": "9374" }
]
```

---

### 2. Rota/função única para app + site

Hoje você já tem algo assim no backend (tRPC):

```ts
// server/routers.ts (resumido)
deliveryRequests: router({
  create: protectedProcedure
    .input(z.object({
      pickupAddress: z.string(),
      deliveryAddress: z.string(),
      estimatedWeight: z.string().optional(),
      description: z.string().optional(),
      isUrgent: z.number().optional(),
      contactName: z.string().optional(),
      contactPhone: z.string().optional(),
    }))
    .mutation(({ input, ctx }) =>
      db.createDeliveryRequest({ ...input, userId: ctx.user!.id })
    ),
}),
```

**Passo 1 – estender o input** com os campos de segurança:

```ts
// tipos sugeridos para o input
const CreateDeliveryRequestInput = z.object({
  pickupAddress: z.string(),
  deliveryAddress: z.string(),
  estimatedWeight: z.string().optional(),
  description: z.string().optional(),
  isUrgent: z.number().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),

  // NOVOS
  deliveryMode: z.enum(["express", "protected"]).default("express"),
  declaredValue: z.number().int().nonnegative().optional(),      // centavos
});
```

**Passo 2 – gerar PINs e seguro dentro da própria rota**:

```ts
function generatePin(): string {
  return String(Math.floor(1000 + Math.random() * 9000)); // 4 dígitos, ex: 4821
}

deliveryRequests: router({
  create: protectedProcedure
    .input(CreateDeliveryRequestInput)
    .mutation(async ({ input, ctx }) => {
      const now = new Date();

      const deliveryMode = input.deliveryMode ?? "express";
      const declaredValue = input.declaredValue ?? 0; // em centavos
      const maxCoverage = 50000; // R$ 500,00

      const insuranceCoverage =
        deliveryMode === "protected"
          ? Math.min(declaredValue || 0, maxCoverage)
          : 0;

      const confirmationPinPickup = generatePin();
      const confirmationPinDropoff = generatePin();

      const statusHistory = [
        {
          status: "pending",
          at: now.toISOString(),
          by: `user:${ctx.user!.id}`,
        },
      ];

      const insertData: InsertDeliveryRequest = {
        userId: ctx.user!.id,
        pickupAddress: input.pickupAddress,
        deliveryAddress: input.deliveryAddress,
        estimatedWeight: input.estimatedWeight,
        description: input.description,
        isUrgent: input.isUrgent ?? 0,
        contactName: input.contactName,
        contactPhone: input.contactPhone,

        deliveryMode,
        declaredValue: declaredValue || null,
        insuranceCoverage: insuranceCoverage || null,
        confirmationPinPickup,
        confirmationPinDropoff,
        statusHistory,
      };

      const id = await db.createDeliveryRequest(insertData);
      return { id, confirmationPinPickup, confirmationPinDropoff };
    }),
});
```

> Assim, **app e site** podem chamar **a mesma função** (`deliveryRequests.create`) e ter o mesmo comportamento de segurança.

---

### 3. Atualização de status + histórico

Você já tem `updateDeliveryStatus`. Para alimentar `statusHistory` e, se quiser, validar PIN:

```ts
export async function updateDeliveryStatus(
  deliveryId: number,
  status: string,
  opts?: { actorId?: number; actorType?: "user" | "driver"; pin?: string }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [current] = await db
    .select()
    .from(deliveryRequests)
    .where(eq(deliveryRequests.id, deliveryId))
    .limit(1);

  if (!current) throw new Error("Entrega não encontrada");

  // Validação básica de PIN (opcional, mas alinhada ao que você descreveu)
  if (status === "picked_up" && current.confirmationPinPickup && opts?.pin) {
    if (opts.pin !== String(current.confirmationPinPickup)) {
      throw new Error("PIN de retirada inválido");
    }
  }

  if (status === "delivered" && current.confirmationPinDropoff && opts?.pin) {
    if (opts.pin !== String(current.confirmationPinDropoff)) {
      throw new Error("PIN de entrega inválido");
    }
  }

  const history: any[] = Array.isArray(current.statusHistory)
    ? [...current.statusHistory]
    : [];

  history.push({
    status,
    at: new Date().toISOString(),
    by: opts?.actorId ? `${opts.actorType ?? "system"}:${opts.actorId}` : "system",
    pin: opts?.pin ?? undefined,
  });

  await db
    .update(deliveryRequests)
    .set({
      status: status as any,
      statusHistory: history,
      updatedAt: new Date(),
    })
    .where(eq(deliveryRequests.id, deliveryId));

  return { success: true };
}
```

Depois, o router `deliveries.updateDeliveryStatus` pode simplesmente aceitar um `pin` opcional e repassar para esse método.

---

### 4. Fotos obrigatórias (modo Protegido)

- **pickupPhotoUrl**: preenchido quando o entregador tira foto na retirada.
- **dropoffPhotoUrl**: preenchido quando tira foto na entrega.

Fluxo sugerido:

1. App do **entregador**, antes de mudar para `picked_up`:
   - Abre câmera → faz upload (ex.: rota `/api/upload` que devolve URL).
   - Chama `deliveries.updateDeliveryStatus({ deliveryId, status: "picked_up", pin, pickupPhotoUrl })`.

2. Antes de `delivered`:
   - Mesmo processo, mas com `dropoffPhotoUrl` e `pin` de entrega.

Banco já está pronto para guardar as URLs; o suporte jurídico que você quer (prova visual) vem daí.

---

### 5. UI única “Busca/Entrega” – App e Site

A ideia é **compartilhar o mesmo modelo mental**:

- Escolha entre:
  - **Entrega Express** (rápida e simples)
  - **Entrega Protegida** (premium, com seguro, fotos, PIN, escrow)

#### 5.1. Estrutura de estado (React/React Native)

```ts
type DeliveryMode = "express" | "protected";

const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("express");
const [declaredValue, setDeclaredValue] = useState(""); // ex: "500" (reais)
```

Na hora de chamar a rota única:

```ts
await createDeliveryMutation.mutateAsync({
  pickupAddress,
  deliveryAddress,
  estimatedWeight: weight,
  description,
  isUrgent: isUrgent ? 1 : 0,
  contactName,
  contactPhone,
  deliveryMode,
  declaredValue: declaredValue
    ? Math.round(parseFloat(declaredValue.replace(",", ".")) * 100)
    : 0,
});
```

#### 5.2. Bloco de escolha de tipo de entrega

Algo assim, tanto no app (`envio.tsx`) quanto no site (`envio-local/index.tsx`):

```tsx
<View className="mb-6">
  <Text className="text-base font-semibold mb-3">
    Escolha o tipo de entrega
  </Text>

  {/* Entrega Express */}
  <TouchableOpacity
    className={`mb-3 p-4 rounded-xl border ${
      deliveryMode === "express" ? "border-primary bg-primary/5" : "border-border"
    }`}
    onPress={() => setDeliveryMode("express")}
  >
    <Text className="text-lg font-bold">🚀 Entrega Express</Text>
    <Text className="text-sm text-muted-foreground mt-1">
      Entrega rápida e econômica. Ideal para itens simples.
    </Text>
    <Text className="text-xs text-muted-foreground mt-2">
      ✔ Entregador verificado{"\n"}
      ✔ Rastreamento ao vivo{"\n"}
      ✔ Avaliação{"\n"}
      ✔ Código PIN de confirmação
    </Text>
  </TouchableOpacity>

  {/* Entrega Protegida */}
  <TouchableOpacity
    className={`p-4 rounded-xl border ${
      deliveryMode === "protected" ? "border-primary bg-primary/5" : "border-border"
    }`}
    onPress={() => setDeliveryMode("protected")}
  >
    <Text className="text-lg font-bold">🛡️ Entrega Protegida</Text>
    <Text className="text-sm text-muted-foreground mt-1">
      Entrega com seguro e proteção extra. Ideal para itens de maior valor.
    </Text>
    <Text className="text-xs text-muted-foreground mt-2">
      ✔ Tudo da Express{"\n"}
      ✔ Seguro incluso até R$ 500{"\n"}
      ✔ Fotos obrigatórias na retirada e entrega{"\n"}
      ✔ Pagamento protegido (valor retido até confirmação){"\n"}
      ✔ Prioridade para Entregador Ouro
    </Text>
  </TouchableOpacity>
</View>
```

#### 5.3. Campo de valor declarado (somente Protegida)

```tsx
{deliveryMode === "protected" && (
  <View className="mb-6">
    <Text className="text-base font-semibold mb-3">
      Valor declarado do item
    </Text>
    <View className="bg-surface rounded-xl px-4 py-3 border border-border">
      <TextInput
        className="text-base"
        placeholder="Ex: 500 (para R$ 500,00)"
        keyboardType="numeric"
        value={declaredValue}
        onChangeText={setDeclaredValue}
      />
    </View>
    <Text className="text-xs text-muted-foreground mt-2">
      Esse valor é usado para calcular o seguro incluso na Entrega Protegida.
    </Text>
  </View>
)}
```

#### 5.4. Box de comunicação de segurança (“Sua entrega está protegida”)

Logo antes do botão de confirmar:

```tsx
<View className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
  <Text className="text-sm font-bold text-emerald-900">
    🔒 Sua entrega está protegida:
  </Text>
  <Text className="text-xs text-emerald-900 mt-2">
    ✔ Entregador verificado (documento + selfie){'\n'}
    ✔ Código PIN de retirada e entrega{'\n'}
    ✔ Rastreamento em tempo real{'\n'}
    ✔ Suporte 24h
    {deliveryMode === "protected" && "\n✔ Seguro até R$ 500\n✔ Fotos obrigatórias (retirada e entrega)\n✔ Pagamento protegido (liberado só após confirmação)"}
  </Text>
</View>
```

Isso atende exatamente a parte:

> “Segurança não é só existir. Tem que ser visível.”

---

### 6. Camadas de segurança mapeadas para o sistema

- **Verificação forte de entregadores**  
  → já está mais do lado de cadastro/role; você pode marcar entregadores com flag `isVerified`, `documentVerifiedAt`, etc., e exibir "⭐ Entregador Ouro" com base em:
  - `+100 entregas`, `rating > 4.8`, `zero incidentes graves`.

- **Sistema de avaliação bidirecional**  
  → acrescentar tabela `delivery_reviews` relacionando `deliveryId`, `fromUserId`, `toUserId`, `rating`, `comment`, e mostrar média no perfil.

- **Código PIN duplo**  
  → `confirmationPinPickup` e `confirmationPinDropoff` + validação em `updateDeliveryStatus`.

- **Foto obrigatória (Protegida)**  
  → `pickupPhotoUrl` e `dropoffPhotoUrl` preenchidos apenas quando `deliveryMode === 'protected'`.

- **Rastreamento em tempo real**  
  → já existe rota de “rotas”/`myDeliveries`; você só precisa garantir que o front sempre exiba o status (`"A caminho"`, `"Retirado"`, `"Entregue"`) em cima de `deliveryRequests.status`.

- **Seguro de entrega**  
  → `insuranceCoverage` calculado a partir de `declaredValue` e do teto por modo/categoria.

- **Pagamento retido (escrow light)**  
  → guardar no pedido/`orders` um campo indicando que o valor fica “retido” até `status === 'delivered'` com confirmação (PIN + foto).

---

### 7. Resumindo o que fica unificado

- **Banco** com campos:
  - `deliveryMode`, `declaredValue`, `insuranceCoverage`,
  - `pickupPhotoUrl`, `dropoffPhotoUrl`,
  - `confirmationPinPickup`, `confirmationPinDropoff`,
  - `statusHistory`.

- **Rota única** (tanto app quanto site chamam o mesmo `deliveryRequests.create`).

- **UI “Busca/Entrega”**:
  - escolha **Express** vs **Protegida**;
  - comunicação clara da segurança (box “Sua entrega está protegida”);
  - no modo Protegida, valor declarado + destaque de seguro/fotos/pagamento protegido.

Se você quiser, no próximo passo posso adaptar esse desenho diretamente nos arquivos específicos do seu projeto (app e site) com o código já pronto para colar.

---

**User**

nao quero que me passe o que fazer nos arquivos do projeto, é pra voce fazer e entregar os arquivos corrigidos pra mim, tudo pronto no projeto

---

**Cursor**

Vou implementar direto no projeto: atualizar modelo/banco, rotas tRPC/REST e telas de envio no app/site para suportar Express x Protegida, PIN duplo, seguro, fotos e histórico, e depois checar lints.

Vou começar atualizando o schema/migração de `delivery_requests` e depois ajusto as rotas e telas de envio para usar o novo modelo de segurança completo.

Primeira parte pronta: já atualizei o `delivery_requests` no schema Drizzle e no sistema de migrações para incluir `deliveryMode`, valor declarado, seguro, fotos, PINs e `statusHistory`. Agora vou ajustar o backend (tRPC/REST) e em seguida as telas de envio do app e web para usar esse modelo novo.

---

**User**

continue e faça todos os ajustes

---

**Cursor**

### O que já está pronto no projeto

- **Banco / Drizzle**  
  - Tabela `delivery_requests` agora tem:
    - `deliveryMode` (`"express"` | `"protected"`) com default `"express"`.
    - `declaredValue` (valor declarado em centavos) e `insuranceCoverage` (cobertura do seguro em centavos).
    - `pickupPhotoUrl` e `dropoffPhotoUrl`.
    - `confirmationPinPickup` e `confirmationPinDropoff`.
    - `statusHistory` (JSON com histórico de status).  
  - `server/db-migrations.ts` passa a garantir essas colunas via migração automática.

- **Backend tRPC – criação da entrega (app+web podem usar a mesma lógica)**  
  - Em `server/routers.ts`, no router `deliveryRequests.create`:
    - Input estendido com:
      - `deliveryMode?: "express" | "protected"`;
      - `declaredValue?: number` (centavos).
    - Na mutação:
      - Define `deliveryMode` (default `"express"`).
      - Calcula `insuranceCoverage` (até **R$ 500** em centavos, se `protected`).
      - Gera **PIN duplo**: `confirmationPinPickup` e `confirmationPinDropoff`.
      - Cria `statusHistory` inicial com status `pending` e `by: "user:<id>"`.
      - Salva tudo em `delivery_requests` via `db.createDeliveryRequest`.
      - Retorna `{ id, confirmationPinPickup, confirmationPinDropoff }`.

- **Backend tRPC – atualização de status com PIN, fotos e histórico**  
  - Em `server/db.ts`, `updateDeliveryStatus` agora:
    - Assinatura:  
      `updateDeliveryStatus(deliveryId, status, { actorId?, actorType?, pin?, pickupPhotoUrl?, dropoffPhotoUrl? })`.
    - Busca a entrega atual, opcionalmente:
      - Valida PIN de retirada se `status === "picked_up"` e `pin` informado.
      - Valida PIN de entrega se `status === "delivered"` e `pin` informado.
    - Atualiza `statusHistory` com `{ status, at, by, pin? }`.
    - Atualiza `pickupPhotoUrl`/`dropoffPhotoUrl` se forem passados.
  - Em `server/routers.ts`:
    - Router `deliveries.updateDeliveryStatus`:
      - Input agora aceita `pin`, `pickupPhotoUrl`, `dropoffPhotoUrl`.
      - Passa `actorId` e `actorType` (`"driver"`, `"admin"` ou `"user"`) para `updateDeliveryStatus`.
    - Outro router de motorista (mais abaixo, linha ~3684) também foi ajustado:
      - Mesma assinatura de input e passa `actorType: "driver"`.

- **App – tela `envio.tsx` (Busca/Entrega no mobile)**  
  - Estado novo:
    - `deliveryMode: "express" | "protected"` (default `"express"`).
    - `declaredValue: string` (valor em reais digitado, ex: `"500"`).
  - UI:
    - Bloco “**TIPO DE ENTREGA**” com:
      - **Entrega Express**:
        - Texto: preço baixo, rapidez.
        - Itens: “Entregador verificado”, “Rastreamento ao vivo”, “Avaliação”, “Código PIN de confirmação”.
      - **Entrega Protegida**:
        - Texto: seguro e proteção extra para itens de maior valor.
        - Itens: “Tudo da Express”, “Seguro até R$ 500”, “Fotos obrigatórias na retirada e entrega”, “Pagamento protegido”, “Prioridade para Entregadores Ouro”.
    - Quando `deliveryMode === "protected"`:
      - Campo “**VALOR DECLARADO DO ITEM**” com explicação de que serve para calcular o seguro.
    - Box “**🔒 Sua entrega está protegida:**” com:
      - Sempre: entregador verificado, PIN duplo, rastreamento, suporte 24h.
      - Se Protegida: adiciona seguro até R$ 500, fotos obrigatórias, pagamento protegido.
  - Envio:
    - Converte `declaredValue` para centavos:
      - `"500"` → `50000`.
    - Chamada para `trpc.deliveryRequests.create.mutateAsync` agora envia:
      - `deliveryMode`;
      - `declaredValue` em centavos (ou `undefined` se não informado).

- **Site/App web – tela `envio-local/index.tsx` (Busca/Entrega web)**  
  - Estado novo:
    - `deliveryMode: "express" | "protected"` (default `"express"`).
    - `declaredValue: string`.
  - UI espelhando o app:
    - Seção “**TIPO DE ENTREGA**” com Express x Protegida e mesmos bullets de segurança/confiança.
    - Campo “**VALOR DECLARADO DO ITEM**” quando Protegida, com explicação para o seguro.
    - Box “**🔒 Sua entrega está protegida:**” com a mesma lista (entregador verificado, PIN duplo, rastreamento, suporte, seguro/fotos/pagamento protegido para Protegida).
  - Envio:
    - Converte `declaredValue` para centavos.
    - Chamada `api.requestDelivery({...})` agora inclui:
      - `deliveryMode`;
      - `declaredValue` em centavos (ou `undefined`).

### Como isso atende o que você pediu

- **Camadas de segurança implementadas em modelo/rota única (app + site)**:
  - `deliveryMode` (`express`/`protected`), `declaredValue`, `insuranceCoverage`.
  - PIN duplo com colunas e geração automática.
  - Campos para fotos de retirada/entrega.
  - `statusHistory` guardando toda a linha do tempo.
- **Comunicação dentro do app/site**:
  - Seções de escolha de **Entrega Express** vs **Entrega Protegida** com textos prontos.
  - Box “**Sua entrega está protegida**” destacado na tela de pedido, igual ao modelo que você descreveu.
- **Sem erros de lint** nos arquivos alterados.

Se quiser, o próximo passo pode ser: ajustar telas do entregador (onde ele confirma retirada/entrega) para já pedir o PIN e as fotos e usar os novos campos de `updateDeliveryStatus`.

---

**User**

ajustar telas do entregador (onde ele confirma retirada/entrega) para já pedir o PIN e as fotos e usar os novos campos de updateDeliveryStatus

