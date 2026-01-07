import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "waiter", "cashier", "manager", "kitchen"]).default("user").notNull(),
  companyId: int("companyId"), // Empresa associada ao usuário
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
  }>(),
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
  deliveryOrderId: varchar("deliveryOrderId", { length: 255 }), // ID do pedido no sistema de delivery
  source: mysqlEnum("source", ["pdv", "buscazap"]).default("pdv").notNull(), // Origem do pedido
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
