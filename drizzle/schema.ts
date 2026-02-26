import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  password: varchar("password", { length: 255 }), // Hash da senha para login direto
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "waiter", "cashier", "manager", "kitchen", "admin_global", "delivery_driver"]).default("user").notNull(),
  companyId: int("companyId"), // Empresa associada ao usuário
  planType: varchar("planType", { length: 50 }), // Tipo de plano: destaque, basico, etc
  planExpiresAt: timestamp("planExpiresAt"), // Data de expiração do plano
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Companies - Empresas que usam o PDV
 */
export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  cnpj: varchar("cnpj", { length: 18 }),
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  logo: text("logo"),
  isActive: boolean("isActive").default(true).notNull(),
  settings: json("settings").$type<{
    taxServicePercent?: number;
    enableTableService?: boolean;
    enableDelivery?: boolean;
    category?: string;
    description?: string;
    hours?: string;
    services?: string;
    promotions?: string;
    [key: string]: unknown;
  }>(),
  // Auth e growth (BuscaZap IA / SaaS)
  passwordHash: text("passwordHash"),
  referralCode: varchar("referralCode", { length: 20 }).unique(),
  domain: varchar("domain", { length: 255 }),
  engagementScore: int("engagementScore").default(100).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

/**
 * Tables - Mesas do restaurante
 */
export const tables = mysqlTable("tables", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  number: varchar("number", { length: 10 }).notNull(),
  capacity: int("capacity").default(4),
  status: mysqlEnum("status", ["available", "occupied", "reserved"]).default("available").notNull(),
  currentOrderId: int("currentOrderId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Table = typeof tables.$inferSelect;
export type InsertTable = typeof tables.$inferInsert;

/**
 * Categories - Categorias de produtos
 */
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  order: int("order").default(0),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Products - Produtos do cardápio
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  categoryId: int("categoryId"),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  image: text("image"),
  isActive: boolean("isActive").default(true).notNull(),
  productionSector: varchar("productionSector", { length: 50 }), // cozinha, bar, etc
  preparationTime: int("preparationTime").default(15), // minutos
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Orders - Pedidos/Comandas
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  orderNumber: varchar("orderNumber", { length: 20 }).notNull(),
  type: mysqlEnum("type", ["dine_in", "delivery", "takeout"]).default("dine_in").notNull(),
  tableId: int("tableId"),
  waiterId: int("waiterId"),
  customerName: varchar("customerName", { length: 255 }),
  customerPhone: varchar("customerPhone", { length: 20 }),
  status: mysqlEnum("status", ["open", "sent_to_kitchen", "preparing", "ready", "closed", "cancelled"]).default("open").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).default("0.00").notNull(),
  serviceCharge: decimal("serviceCharge", { precision: 10, scale: 2 }).default("0.00"),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0.00"),
  total: decimal("total", { precision: 10, scale: 2 }).default("0.00").notNull(),
  notes: text("notes"),
  deliveryOrderId: varchar("deliveryOrderId", { length: 255 }), // ID do pedido no sistema de delivery externo
  externalPlatform: varchar("externalPlatform", { length: 50 }), // Plataforma externa (pedija, iffod, 99food, etc.)
  source: mysqlEnum("source", ["pdv", "buscazap", "pedija", "iffod", "99food", "rappi", "uber_eats", "ifood", "other"]).default("pdv").notNull(), // Origem do pedido
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  closedAt: timestamp("closedAt"),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Order Items - Itens do pedido
 */
export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  status: mysqlEnum("status", ["pending", "preparing", "ready", "delivered"]).default("pending").notNull(),
  productionSector: varchar("productionSector", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

/**
 * Payment Methods - Meios de pagamento
 */
export const paymentMethods = mysqlTable("payment_methods", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  type: mysqlEnum("type", ["cash", "credit_card", "debit_card", "pix", "voucher", "other"]).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = typeof paymentMethods.$inferInsert;

/**
 * Payments - Pagamentos realizados
 */
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  paymentMethodId: int("paymentMethodId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * Cash Registers - Caixas
 */
export const cashRegisters = mysqlTable("cash_registers", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  userId: int("userId").notNull(),
  openingAmount: decimal("openingAmount", { precision: 10, scale: 2 }).notNull(),
  closingAmount: decimal("closingAmount", { precision: 10, scale: 2 }),
  expectedAmount: decimal("expectedAmount", { precision: 10, scale: 2 }),
  difference: decimal("difference", { precision: 10, scale: 2 }),
  status: mysqlEnum("status", ["open", "closed"]).default("open").notNull(),
  notes: text("notes"),
  openedAt: timestamp("openedAt").defaultNow().notNull(),
  closedAt: timestamp("closedAt"),
});

export type CashRegister = typeof cashRegisters.$inferSelect;
export type InsertCashRegister = typeof cashRegisters.$inferInsert;

/**
 * Cash Movements - Movimentações de caixa (sangria, reforço)
 */
export const cashMovements = mysqlTable("cash_movements", {
  id: int("id").autoincrement().primaryKey(),
  cashRegisterId: int("cashRegisterId").notNull(),
  type: mysqlEnum("type", ["withdrawal", "deposit"]).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  reason: text("reason"),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CashMovement = typeof cashMovements.$inferSelect;
export type InsertCashMovement = typeof cashMovements.$inferInsert;

/**
 * Cash Closures - Detalhes de fechamento de caixa
 */
export const cashClosures = mysqlTable("cash_closures", {
  id: int("id").autoincrement().primaryKey(),
  cashRegisterId: int("cashRegisterId").notNull(),
  paymentMethodId: int("paymentMethodId").notNull(),
  expectedAmount: decimal("expectedAmount", { precision: 10, scale: 2 }).notNull(),
  countedAmount: decimal("countedAmount", { precision: 10, scale: 2 }).notNull(),
  difference: decimal("difference", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CashClosure = typeof cashClosures.$inferSelect;
export type InsertCashClosure = typeof cashClosures.$inferInsert;

/**
 * Printers - Impressoras configuradas
 */
export const printers = mysqlTable("printers", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  port: int("port").default(9100),
  type: mysqlEnum("type", ["kitchen", "bar", "cashier"]).notNull(),
  productionSector: varchar("productionSector", { length: 50 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Printer = typeof printers.$inferSelect;
export type InsertPrinter = typeof printers.$inferInsert;

/**
 * Bill Splits - Divisão de conta
 */
export const billSplits = mysqlTable("bill_splits", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  numberOfPeople: int("numberOfPeople").notNull(),
  amountPerPerson: decimal("amountPerPerson", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BillSplit = typeof billSplits.$inferSelect;
export type InsertBillSplit = typeof billSplits.$inferInsert;

/**
 * Delivery Requests - Solicitações de entregador
 */
export const deliveryRequests = mysqlTable("delivery_requests", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  orderId: int("orderId").notNull(),
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 20 }).notNull(),
  deliveryAddress: text("deliveryAddress").notNull(),
  deliveryFee: decimal("deliveryFee", { precision: 10, scale: 2 }).notNull(),
  // Roteamento de entrega:
  // city = pool global (PediJá / sistema inteligente da cidade)
  // company = entregadores próprios da empresa
  deliveryType: mysqlEnum("deliveryType", ["city", "company"]).default("city").notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "in_transit", "delivered", "cancelled"]).default("pending").notNull(),
  deliveryPersonId: int("deliveryPersonId"),
  deliveryPersonName: varchar("deliveryPersonName", { length: 255 }),
  notes: text("notes"),
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  acceptedAt: timestamp("acceptedAt"),
  deliveredAt: timestamp("deliveredAt"),
});

export type DeliveryRequest = typeof deliveryRequests.$inferSelect;
export type InsertDeliveryRequest = typeof deliveryRequests.$inferInsert;


/**
 * Chat Messages - Mensagens entre PDV e Cliente
 */
export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  senderId: int("senderId").notNull(), // ID do usuário que enviou
  senderType: mysqlEnum("senderType", ["customer", "business"]).notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

/**
 * Order Ratings - Avaliações de pedidos
 */
export const orderRatings = mysqlTable("order_ratings", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().unique(),
  customerId: int("customerId").notNull(),
  companyId: int("companyId").notNull(),
  rating: int("rating").notNull(), // 1-5 estrelas
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderRating = typeof orderRatings.$inferSelect;
export type InsertOrderRating = typeof orderRatings.$inferInsert;

/**
 * Company Delivery Settings - Configurações de delivery por empresa
 */
export const companyDeliverySettings = mysqlTable("company_delivery_settings", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull().unique(),
  isOnPedija: boolean("isOnPedija").default(false).notNull(), // Empresa ativa no PediJá
  isOnlineForOrders: boolean("isOnlineForOrders").default(false).notNull(), // Online para pedidos (controlado via PDV)
  hasOwnDrivers: boolean("hasOwnDrivers").default(false).notNull(), // Tem entregadores próprios
  maxDrivers: int("maxDrivers").default(0).notNull(), // Limite de entregadores
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CompanyDeliverySetting = typeof companyDeliverySettings.$inferSelect;
export type InsertCompanyDeliverySetting = typeof companyDeliverySettings.$inferInsert;

/**
 * Company Drivers - Entregadores próprios por empresa
 */
export const companyDrivers = mysqlTable("company_drivers", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  driverId: int("driverId").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CompanyDriver = typeof companyDrivers.$inferSelect;
export type InsertCompanyDriver = typeof companyDrivers.$inferInsert;

/**
 * External Platform Integrations - Configurações de integração com plataformas externas
 */
export const externalPlatformIntegrations = mysqlTable("external_platform_integrations", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  platform: mysqlEnum("platform", ["pedija", "iffod", "99food", "rappi", "uber_eats", "ifood", "other"]).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  // Credenciais/API keys (criptografadas em produção)
  apiKey: varchar("apiKey", { length: 255 }),
  apiSecret: varchar("apiSecret", { length: 255 }),
  webhookUrl: varchar("webhookUrl", { length: 500 }), // URL do webhook que a plataforma deve chamar
  webhookSecret: varchar("webhookSecret", { length: 255 }), // Secret para validar webhooks
  // Configurações específicas da plataforma (JSON)
  settings: json("settings").$type<{
    autoAccept?: boolean;
    autoPrint?: boolean;
    notificationSound?: boolean;
    [key: string]: any;
  }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExternalPlatformIntegration = typeof externalPlatformIntegrations.$inferSelect;
export type InsertExternalPlatformIntegration = typeof externalPlatformIntegrations.$inferInsert;

// ============================================
// AI SaaS Platform Tables
// ============================================

/**
 * Conversations - Conversas unificadas entre todos os canais (WhatsApp, App, Web)
 */
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  customerPhone: varchar("customerPhone", { length: 20 }).notNull(),
  customerName: varchar("customerName", { length: 255 }),
  channel: mysqlEnum("channel", ["whatsapp", "app", "web", "telegram"]).default("whatsapp").notNull(),
  status: mysqlEnum("status", ["active", "waiting_human", "closed", "archived"]).default("active").notNull(),
  assignedToUserId: int("assignedToUserId"), // Atendente humano responsável
  aiEnabled: boolean("aiEnabled").default(true).notNull(), // IA ativa nesta conversa
  lastMessageAt: timestamp("lastMessageAt").defaultNow().notNull(),
  metadata: json("metadata").$type<{
    lastIntent?: string;
    leadScore?: number;
    tags?: string[];
    summary?: string;
  }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * Messages - Mensagens unificadas de todas as conversas
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  companyId: int("companyId").notNull(),
  role: mysqlEnum("role", ["customer", "assistant", "human", "system"]).notNull(),
  content: text("content").notNull(),
  channel: mysqlEnum("channel", ["whatsapp", "app", "web", "telegram"]).default("whatsapp").notNull(),
  // Metadados da IA
  aiMetadata: json("aiMetadata").$type<{
    intent?: string;
    leadScore?: number;
    tags?: string[];
    products?: string[];
    nextAction?: string;
    crmUpdate?: {
      name?: string;
      interest?: string;
      budget?: string;
      city?: string;
    };
    confidence?: number;
    escalateToHuman?: boolean;
  }>(),
  // Referências externas
  whatsappMessageId: varchar("whatsappMessageId", { length: 255 }),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Company Knowledge Base - Base de conhecimento treinada por empresa
 */
export const companyKnowledgeBase = mysqlTable("company_knowledge_base", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  type: mysqlEnum("type", ["pdf", "website", "product", "faq", "instagram", "manual"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(), // Conteúdo extraído/processado
  sourceUrl: varchar("sourceUrl", { length: 500 }), // URL original se aplicável
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CompanyKnowledgeBase = typeof companyKnowledgeBase.$inferSelect;
export type InsertCompanyKnowledgeBase = typeof companyKnowledgeBase.$inferInsert;

/**
 * Embeddings - Memória vetorial por empresa (IA avançada)
 * vector: JSON array de floats (ex.: OpenAI text-embedding-3-small = 1536 dims)
 */
export const embeddings = mysqlTable("embeddings", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  content: text("content").notNull(),
  vector: json("vector").$type<number[]>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Embedding = typeof embeddings.$inferSelect;
export type InsertEmbedding = typeof embeddings.$inferInsert;

/**
 * User Memory - Memória por usuário/empresa (preferências, fatos)
 */
export const userMemory = mysqlTable("user_memory", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  customerPhone: varchar("customerPhone", { length: 20 }).notNull(),
  key: varchar("key", { length: 100 }).notNull(),
  value: text("value").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserMemory = typeof userMemory.$inferSelect;
export type InsertUserMemory = typeof userMemory.$inferInsert;

/**
 * Company AI Settings - Configurações de IA por empresa
 */
export const companyAiSettings = mysqlTable("company_ai_settings", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull().unique(),
  aiEnabled: boolean("aiEnabled").default(true).notNull(),
  autoResponseEnabled: boolean("autoResponseEnabled").default(true).notNull(),
  escalateToHumanEnabled: boolean("escalateToHumanEnabled").default(true).notNull(),
  // Personalidade e comportamento
  personality: mysqlEnum("personality", ["professional", "friendly", "casual", "formal"]).default("friendly").notNull(),
  language: varchar("language", { length: 10 }).default("pt-BR").notNull(),
  // Prompts customizados
  customGreeting: text("customGreeting"),
  customInstructions: text("customInstructions"),
  // Horários de funcionamento para IA
  businessHours: json("businessHours").$type<{
    enabled: boolean;
    schedule: {
      [day: string]: { open: string; close: string } | null;
    };
    outsideHoursMessage?: string;
  }>(),
  // Limites
  maxMessagesPerDay: int("maxMessagesPerDay").default(1000).notNull(),
  messagesUsedToday: int("messagesUsedToday").default(0).notNull(),
  lastResetAt: timestamp("lastResetAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CompanyAiSettings = typeof companyAiSettings.$inferSelect;
export type InsertCompanyAiSettings = typeof companyAiSettings.$inferInsert;

/**
 * CRM Contacts - Contatos do CRM por empresa
 */
export const crmContacts = mysqlTable("crm_contacts", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  // Dados do CRM
  leadScore: int("leadScore").default(0).notNull(), // 0-100
  tags: json("tags").$type<string[]>().default([]),
  // Dados comportamentais
  totalOrders: int("totalOrders").default(0).notNull(),
  totalSpent: decimal("totalSpent", { precision: 10, scale: 2 }).default("0.00").notNull(),
  averageTicket: decimal("averageTicket", { precision: 10, scale: 2 }).default("0.00").notNull(),
  lastOrderAt: timestamp("lastOrderAt"),
  // Preferências detectadas
  preferences: json("preferences").$type<{
    favoriteCategories?: string[];
    favoriteProducts?: string[];
    preferredDays?: string[];
    preferredHours?: number[];
    allergies?: string[];
    notes?: string;
  }>(),
  // Metadados
  firstContactAt: timestamp("firstContactAt").defaultNow().notNull(),
  lastContactAt: timestamp("lastContactAt").defaultNow().notNull(),
  conversationsCount: int("conversationsCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CrmContact = typeof crmContacts.$inferSelect;
export type InsertCrmContact = typeof crmContacts.$inferInsert;

/**
 * CRM Tags - Tags disponíveis por empresa
 */
export const crmTags = mysqlTable("crm_tags", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  name: varchar("name", { length: 50 }).notNull(),
  color: varchar("color", { length: 7 }).default("#3B82F6").notNull(), // Hex color
  description: text("description"),
  isAutomatic: boolean("isAutomatic").default(false).notNull(), // Tag gerada automaticamente pela IA
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CrmTag = typeof crmTags.$inferSelect;
export type InsertCrmTag = typeof crmTags.$inferInsert;

/**
 * User Behavior - Rastreamento comportamental dos usuários
 */
export const userBehavior = mysqlTable("user_behavior", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  customerPhone: varchar("customerPhone", { length: 20 }).notNull(),
  action: mysqlEnum("action", ["message", "order", "quote", "click", "view", "search", "rating"]).notNull(),
  category: varchar("category", { length: 80 }),
  productId: int("productId"),
  value: decimal("value", { precision: 10, scale: 2 }),
  metadata: json("metadata").$type<Record<string, any>>(),
  dayOfWeek: int("dayOfWeek").notNull(), // 0-6 (domingo-sábado)
  hourOfDay: int("hourOfDay").notNull(), // 0-23
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserBehavior = typeof userBehavior.$inferSelect;
export type InsertUserBehavior = typeof userBehavior.$inferInsert;

/**
 * Subscriptions - Assinaturas das empresas
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  userId: int("userId").notNull(), // Usuário que fez a assinatura
  planType: mysqlEnum("planType", ["free", "basico", "destaque", "premium", "enterprise"]).default("free").notNull(),
  status: mysqlEnum("status", ["active", "cancelled", "expired", "pending", "trial"]).default("pending").notNull(),
  // Limites do plano
  messagesLimit: int("messagesLimit").default(200).notNull(),
  messagesUsed: int("messagesUsed").default(0).notNull(),
  aiEnabled: boolean("aiEnabled").default(false).notNull(), // IA habilitada neste plano
  whatsappEnabled: boolean("whatsappEnabled").default(false).notNull(), // WhatsApp habilitado
  // Billing
  priceMonthly: decimal("priceMonthly", { precision: 10, scale: 2 }).default("0.00").notNull(),
  gatewayId: varchar("gatewayId", { length: 255 }), // ID no gateway de pagamento (Stripe, etc)
  gatewayCustomerId: varchar("gatewayCustomerId", { length: 255 }),
  // Datas
  trialEndsAt: timestamp("trialEndsAt"),
  currentPeriodStart: timestamp("currentPeriodStart").defaultNow().notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelledAt: timestamp("cancelledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * Referrals - Sistema de indicação viral
 */
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerCompanyId: int("referrerCompanyId").notNull(), // Empresa que indicou
  referredCompanyId: int("referredCompanyId"), // Empresa indicada (depois de criar conta)
  referralCode: varchar("referralCode", { length: 20 }).notNull().unique(),
  // Recompensas
  rewardGiven: boolean("rewardGiven").default(false).notNull(),
  rewardType: mysqlEnum("rewardType", ["messages", "discount", "trial_extension"]).default("messages").notNull(),
  rewardAmount: int("rewardAmount").default(1000).notNull(), // Mensagens extras ou % desconto
  // Status
  status: mysqlEnum("status", ["pending", "completed", "expired"]).default("pending").notNull(),
  usedAt: timestamp("usedAt"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

/**
 * Company Metrics - Métricas agregadas por empresa
 */
export const companyMetrics = mysqlTable("company_metrics", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  date: timestamp("date").notNull(),
  // Conversas
  conversationsStarted: int("conversationsStarted").default(0).notNull(),
  conversationsClosed: int("conversationsClosed").default(0).notNull(),
  messagesReceived: int("messagesReceived").default(0).notNull(),
  messagesSent: int("messagesSent").default(0).notNull(),
  aiResponses: int("aiResponses").default(0).notNull(),
  humanResponses: int("humanResponses").default(0).notNull(),
  // CRM
  newLeads: int("newLeads").default(0).notNull(),
  hotLeads: int("hotLeads").default(0).notNull(), // Lead score > 70
  // Conversões
  quotesRequested: int("quotesRequested").default(0).notNull(),
  ordersCreated: int("ordersCreated").default(0).notNull(),
  ordersValue: decimal("ordersValue", { precision: 10, scale: 2 }).default("0.00").notNull(),
  conversionRate: decimal("conversionRate", { precision: 5, scale: 2 }).default("0.00").notNull(),
  // Engajamento
  averageResponseTime: int("averageResponseTime").default(0).notNull(), // segundos
  customerSatisfaction: decimal("customerSatisfaction", { precision: 3, scale: 2 }).default("0.00").notNull(), // 0-5
  // Score de engajamento (anti-churn)
  engagementScore: int("engagementScore").default(100).notNull(), // 0-100
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CompanyMetric = typeof companyMetrics.$inferSelect;
export type InsertCompanyMetric = typeof companyMetrics.$inferInsert;

/**
 * WhatsApp Numbers - Multi número por empresa (Graph API / Cloud API)
 * Usado para rotear webhook por display_phone_number
 */
export const whatsappNumbers = mysqlTable("whatsapp_numbers", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  token: text("token"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WhatsappNumber = typeof whatsappNumbers.$inferSelect;
export type InsertWhatsappNumber = typeof whatsappNumbers.$inferInsert;

/**
 * Marketplace Ads - Destaque pago no BuscaZap
 */
export const marketplaceAds = mysqlTable("marketplace_ads", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MarketplaceAd = typeof marketplaceAds.$inferSelect;
export type InsertMarketplaceAd = typeof marketplaceAds.$inferInsert;

/**
 * WhatsApp Sessions - Sessões do WhatsApp Web para whatsapp-web.js
 */
export const whatsappSessions = mysqlTable("whatsapp_sessions", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull().unique(),
  phone: varchar("phone", { length: 20 }), // Número conectado
  // Status
  status: mysqlEnum("status", ["disconnected", "qr_pending", "connecting", "connected", "failed"]).default("disconnected").notNull(),
  // Dados da sessão (serializado)
  sessionData: text("sessionData"), // JSON serializado da sessão
  // QR Code
  lastQrCode: text("lastQrCode"),
  qrExpiresAt: timestamp("qrExpiresAt"),
  // Conexão
  connectedAt: timestamp("connectedAt"),
  disconnectedAt: timestamp("disconnectedAt"),
  lastActivityAt: timestamp("lastActivityAt"),
  // Erros
  lastError: text("lastError"),
  failureCount: int("failureCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WhatsappSession = typeof whatsappSessions.$inferSelect;
export type InsertWhatsappSession = typeof whatsappSessions.$inferInsert;

/**
 * Notification Queue - Fila de notificações proativas
 */
export const notificationQueue = mysqlTable("notification_queue", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  customerPhone: varchar("customerPhone", { length: 20 }).notNull(),
  type: mysqlEnum("type", ["recommendation", "promotion", "reminder", "follow_up", "upsell"]).notNull(),
  channel: mysqlEnum("channel", ["whatsapp", "push", "sms"]).default("whatsapp").notNull(),
  message: text("message").notNull(),
  // Agendamento
  scheduledFor: timestamp("scheduledFor").notNull(),
  sentAt: timestamp("sentAt"),
  // Status
  status: mysqlEnum("status", ["pending", "sent", "failed", "cancelled"]).default("pending").notNull(),
  error: text("error"),
  // Metadados
  metadata: json("metadata").$type<{
    triggeredBy?: string;
    productId?: number;
    orderId?: number;
  }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NotificationQueue = typeof notificationQueue.$inferSelect;
export type InsertNotificationQueue = typeof notificationQueue.$inferInsert;

// ==================== CONFIGURAÇÃO GLOBAL / CIDADES ====================

// ==================== AGENDA (Secretária - clínicas, hospitais, comércios) ====================

/** Planos de saúde / particular por empresa */
export const agendaHealthPlans = mysqlTable("agenda_health_plans", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 60 }).notNull(),
  color: varchar("color", { length: 7 }).default("#3B82F6").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  defaultDurationMinutes: int("defaultDurationMinutes").default(30).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AgendaHealthPlan = typeof agendaHealthPlans.$inferSelect;
export type InsertAgendaHealthPlan = typeof agendaHealthPlans.$inferInsert;

/** Pacientes cadastrados pela empresa */
export const agendaPatients = mysqlTable("agenda_patients", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 320 }),
  document: varchar("document", { length: 20 }),
  birthDate: varchar("birthDate", { length: 10 }),
  healthPlanId: int("healthPlanId"),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AgendaPatient = typeof agendaPatients.$inferSelect;
export type InsertAgendaPatient = typeof agendaPatients.$inferInsert;

/** Dias e horários disponíveis para consulta (por dia da semana) */
export const agendaAvailability = mysqlTable("agenda_availability", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  dayOfWeek: int("dayOfWeek").notNull(),
  startTime: varchar("startTime", { length: 5 }).notNull(),
  endTime: varchar("endTime", { length: 5 }).notNull(),
  slotMinutes: int("slotMinutes").default(30).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AgendaAvailability = typeof agendaAvailability.$inferSelect;
export type InsertAgendaAvailability = typeof agendaAvailability.$inferInsert;

/** Vagas por plano por período (ex: Unimed 1/semana, particular ilimitado) */
export const agendaQuotas = mysqlTable("agenda_quotas", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  healthPlanId: int("healthPlanId").notNull(),
  period: mysqlEnum("period", ["week", "month"]).notNull(),
  maxSlots: int("maxSlots").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AgendaQuota = typeof agendaQuotas.$inferSelect;
export type InsertAgendaQuota = typeof agendaQuotas.$inferInsert;

/** Agendamentos */
export const agendaAppointments = mysqlTable("agenda_appointments", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  patientId: int("patientId").notNull(),
  healthPlanId: int("healthPlanId"),
  startAt: timestamp("startAt").notNull(),
  endAt: timestamp("endAt").notNull(),
  durationMinutes: int("durationMinutes").default(30).notNull(),
  status: mysqlEnum("status", ["scheduled", "confirmed", "cancelled", "completed", "no_show"]).default("scheduled").notNull(),
  confirmedAt: timestamp("confirmedAt"),
  salebotPendingId: varchar("salebotPendingId", { length: 64 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AgendaAppointment = typeof agendaAppointments.$inferSelect;
export type InsertAgendaAppointment = typeof agendaAppointments.$inferInsert;
