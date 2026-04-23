import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, sellers, Seller, InsertSeller, products, InsertProduct, customers, Customer, InsertCustomer, orders, Order, InsertOrder, orderItems, OrderItem, stock, Stock, transactions, Transaction, pedijaOrders, InsertPedijaOrder, PedijaOrder } from "../drizzle/schema";
import { ENV } from './_core/env';
import { BusinessType } from "../shared/businessTypes";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ========== SELLER QUERIES ==========

export async function getSellerByUserId(userId: number): Promise<Seller | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get seller: database not available");
    return undefined;
  }

  const result = await db.select().from(sellers).where(eq(sellers.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createSeller(data: InsertSeller): Promise<Seller> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Only insert fields that are provided, let database handle defaults
  const insertData: Record<string, any> = {
    userId: data.userId,
    storeName: data.storeName,
    businessType: data.businessType || 'commerce',
  };

  // Add optional fields if provided
  if (data.storeDescription) insertData.storeDescription = data.storeDescription;
  if (data.cnpj) insertData.cnpj = data.cnpj;
  if (data.phone) insertData.phone = data.phone;
  if (data.address) insertData.address = data.address;
  if (data.city) insertData.city = data.city;
  if (data.state) insertData.state = data.state;
  if (data.zipCode) insertData.zipCode = data.zipCode;
  if (data.buscazapCompanyId != null) insertData.buscazapCompanyId = data.buscazapCompanyId;

  const result = await db.insert(sellers).values(insertData as InsertSeller);
  const sellerId = result[0].insertId;
  
  const seller = await db.select().from(sellers).where(eq(sellers.id, sellerId as number)).limit(1);
  if (!seller.length) throw new Error("Failed to create seller");
  
  return seller[0];
}

export async function updateSellerBusinessType(sellerId: number, businessType: BusinessType): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(sellers).set({ businessType }).where(eq(sellers.id, sellerId));
}

export async function updateSeller(sellerId: number, data: Partial<InsertSeller>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(sellers).set(data).where(eq(sellers.id, sellerId));
}

// ========== PRODUCT QUERIES ==========

export async function getProductsBySellerIdWithStock(sellerId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(products)
    .where(eq(products.sellerId, sellerId));

  return result;
}

export async function createProduct(data: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(products).values(data);
  return result;
}

export async function updateProduct(productId: number, data: Partial<InsertProduct>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(products).set(data).where(eq(products.id, productId));
}

export async function deleteProduct(productId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(products).where(eq(products.id, productId));
}

export async function getProductById(productId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateProductBuscazapMenuItemId(productId: number, buscazapMenuItemId: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(products).set({ buscazapMenuItemId } as any).where(eq(products.id, productId));
}

// ========== PEDIJA ORDERS QUERIES ==========

export async function createPedijaOrder(data: InsertPedijaOrder): Promise<PedijaOrder> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(pedijaOrders).values(data);
  const insertId = (result[0] as any)?.insertId;
  const row = await db.select().from(pedijaOrders).where(eq(pedijaOrders.id, insertId)).limit(1);
  if (!row.length) throw new Error("Failed to create pedijaOrder");
  return row[0];
}

export async function upsertPedijaOrder(data: InsertPedijaOrder): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(pedijaOrders).values(data).onDuplicateKeyUpdate({
    set: {
      customerName: data.customerName,
      total: data.total,
      status: data.status ?? "pending",
      items: data.items,
      updatedAt: new Date(),
    },
  });
}

export async function getPedijaOrdersBySellerIdWithStatus(sellerId: number, status?: string) {
  const db = await getDb();
  if (!db) return [];
  const results = await db.select().from(pedijaOrders).where(eq(pedijaOrders.sellerId, sellerId)).orderBy(desc(pedijaOrders.createdAt));
  if (status) return results.filter((r) => r.status === status);
  return results;
}

export async function updatePedijaOrderStatus(pedijaOrderId: number, status: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(pedijaOrders).set({ status, updatedAt: new Date() }).where(eq(pedijaOrders.id, pedijaOrderId));
}

export async function getSellerIdByBuscazapCompanyId(buscazapCompanyId: number): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select({ id: sellers.id }).from(sellers).where(eq(sellers.buscazapCompanyId as any, buscazapCompanyId)).limit(1);
  return result.length > 0 ? result[0].id : null;
}

// ========== CUSTOMER QUERIES ==========

export async function getCustomersBySellerIdWithStats(sellerId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(customers)
    .where(eq(customers.sellerId, sellerId))
    .orderBy(desc(customers.createdAt));

  return result;
}

export async function getCustomerById(customerId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function createOrUpdateCustomer(data: InsertCustomer) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(customers).values(data).onDuplicateKeyUpdate({
    set: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      city: data.city,
      state: data.state,
      address: data.address,
      updatedAt: new Date(),
    },
  });

  return result;
}

// ========== ORDER QUERIES ==========

export async function getOrdersBySellerIdWithItems(sellerId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(orders)
    .where(eq(orders.sellerId, sellerId))
    .orderBy(desc(orders.createdAt));

  return result;
}

export async function getOrderById(orderId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getOrderItemsByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  return result;
}

export async function createOrder(data: InsertOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(orders).values(data);
  return result;
}

export async function updateOrderStatus(orderId: number, status: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] updateOrderStatus skipped: database not available");
    return;
  }

  await db.update(orders).set({ status, updatedAt: new Date() }).where(eq(orders.id, orderId));
}

// ========== STOCK QUERIES ==========

export async function getStockBySellerIdWithProducts(sellerId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: stock.id,
      productId: stock.productId,
      quantity: stock.quantity,
      minThreshold: stock.minThreshold,
      productName: products.name,
      productSku: products.sku,
      productPrice: products.price,
      createdAt: stock.createdAt,
      updatedAt: stock.updatedAt,
    })
    .from(stock)
    .innerJoin(products, eq(stock.productId, products.id))
    .where(eq(products.sellerId, sellerId))
    .orderBy(desc(stock.updatedAt));

  return result;
}

export async function updateStockQuantity(productId: number, quantity: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(stock).set({ quantity, updatedAt: new Date() }).where(eq(stock.productId, productId));
}

// ========== TRANSACTION QUERIES ==========

export async function getTransactionsBySellerIdForReports(sellerId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(transactions)
    .where(eq(transactions.sellerId, sellerId))
    .orderBy(desc(transactions.createdAt));

  return result;
}
