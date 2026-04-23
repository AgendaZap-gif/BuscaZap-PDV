import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Sellers table with businessType support for multi-branch functionality.
 * businessType determines the interface and features available to the seller.
 */
export const sellers = mysqlTable("sellers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  storeName: varchar("storeName", { length: 255 }).notNull(),
  storeDescription: text("storeDescription"),
  businessType: mysqlEnum("businessType", ["commerce", "services", "restaurant"]).notNull().default("commerce"),
  cnpj: varchar("cnpj", { length: 20 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zipCode", { length: 10 }),
  /** ID da empresa no app BuscaZap (Pedijà / PDV / agenda), quando vinculado. */
  buscazapCompanyId: int("buscazapCompanyId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Seller = typeof sellers.$inferSelect;
export type InsertSeller = typeof sellers.$inferInsert;

/**
 * Customers table for CRM tracking
 */
export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  sellerId: int("sellerId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  address: text("address"),
  totalOrders: int("totalOrders").default(0),
  totalSpent: varchar("totalSpent", { length: 20 }).default("0"),
  lastOrderDate: timestamp("lastOrderDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

/**
 * Products table - supports products, services, and menu items based on seller's businessType.
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  sellerId: int("sellerId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  sku: varchar("sku", { length: 100 }).notNull(),
  price: varchar("price", { length: 20 }).notNull(),
  cost: varchar("cost", { length: 20 }),
  category: varchar("category", { length: 100 }),
  // Commerce-specific fields
  weight: varchar("weight", { length: 20 }),
  length: varchar("length", { length: 20 }),
  width: varchar("width", { length: 20 }),
  height: varchar("height", { length: 20 }),
  // Services-specific fields
  duration: int("duration"), // in minutes
  // Restaurant-specific fields
  preparationTime: int("preparationTime"), // in minutes
  // Common fields
  images: text("images"),
  isActive: int("isActive").default(1).notNull(),
  /** ID do menuItem correspondente no BuscaZap (Pedijá), para sync bidirecional. */
  buscazapMenuItemId: int("buscazapMenuItemId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Product variations for different options (sizes, colors, etc.)
 */
export const productVariations = mysqlTable("productVariations", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  value: varchar("value", { length: 100 }).notNull(),
  priceModifier: varchar("priceModifier", { length: 20 }).default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProductVariation = typeof productVariations.$inferSelect;
export type InsertProductVariation = typeof productVariations.$inferInsert;

/**
 * Stock tracking for commerce and restaurant inventory
 */
export const stock = mysqlTable("stock", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull().unique(),
  quantity: int("quantity").notNull().default(0),
  minThreshold: int("minThreshold").default(5),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Stock = typeof stock.$inferSelect;
export type InsertStock = typeof stock.$inferInsert;

/**
 * Orders table for all business types
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  sellerId: int("sellerId").notNull(),
  orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(),
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }),
  customerPhone: varchar("customerPhone", { length: 20 }),
  shippingAddress: text("shippingAddress"),
  totalAmount: varchar("totalAmount", { length: 20 }).notNull(),
  shippingCost: varchar("shippingCost", { length: 20 }),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  status: varchar("status", { length: 50 }).default("pending"),
  trackingCode: varchar("trackingCode", { length: 100 }),
  // Service-specific
  scheduledDate: timestamp("scheduledDate"),
  // Restaurant-specific
  deliveryTime: varchar("deliveryTime", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Order items - products/services included in an order
 */
export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: varchar("unitPrice", { length: 20 }).notNull(),
  totalPrice: varchar("totalPrice", { length: 20 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

/**
 * Transactions for financial tracking
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  sellerId: int("sellerId").notNull(),
  orderId: int("orderId"),
  type: varchar("type", { length: 50 }).notNull(), // 'sale', 'refund', 'commission'
  amount: varchar("amount", { length: 20 }).notNull(),
  status: varchar("status", { length: 50 }).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Pedidos recebidos do Pedijá (BuscaZap) via webhook.
 * O restaurante gerencia e atualiza o status aqui no PDV.
 */
export const pedijaOrders = mysqlTable("pedija_orders", {
  id: int("id").autoincrement().primaryKey(),
  sellerId: int("sellerId").notNull(),
  buscazapOrderId: int("buscazapOrderId").notNull().unique(),
  buscazapCompanyId: int("buscazapCompanyId").notNull(),
  customerName: varchar("customerName", { length: 255 }).notNull().default("Cliente"),
  total: varchar("total", { length: 20 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  /** JSON com os itens do pedido: [{name, quantity, price}] */
  items: text("items"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PedijaOrder = typeof pedijaOrders.$inferSelect;
export type InsertPedijaOrder = typeof pedijaOrders.$inferInsert;