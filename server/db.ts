import { eq, and, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  companies,
  tables,
  categories,
  products,
  orders,
  orderItems,
  paymentMethods,
  payments,
  cashRegisters,
  cashMovements,
  printers,
  billSplits,
  deliveryRequests,
  type Company,
  type Table,
  type Category,
  type Product,
  type Order,
  type OrderItem,
  type PaymentMethod,
  type CashRegister,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

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

// ==================== AUTH ====================

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
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (user.companyId !== undefined) {
      values.companyId = user.companyId;
      updateSet.companyId = user.companyId;
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

export async function updateUserCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({ companyId }).where(eq(users.id, userId));
}

// ==================== COMPANIES ====================

export async function getAllCompanies() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(companies).where(eq(companies.isActive, true));
}

export async function getCompanyById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
  return result[0];
}

export async function createCompany(data: Omit<Company, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(companies).values(data);
  return result[0].insertId;
}

// ==================== TABLES ====================

export async function getTablesByCompany(companyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(tables).where(eq(tables.companyId, companyId));
}

export async function updateTableStatus(
  tableId: number,
  status: "available" | "occupied" | "reserved",
  orderId?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(tables)
    .set({ status, currentOrderId: orderId })
    .where(eq(tables.id, tableId));
}

export async function createTable(data: Omit<Table, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(tables).values(data);
  return result[0].insertId;
}

// ==================== CATEGORIES ====================

export async function getCategoriesByCompany(companyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(categories)
    .where(and(eq(categories.companyId, companyId), eq(categories.isActive, true)))
    .orderBy(categories.order);
}

// ==================== PRODUCTS ====================

export async function getProductsByCompany(companyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(products)
    .where(and(eq(products.companyId, companyId), eq(products.isActive, true)));
}

export async function getProductsByCategory(companyId: number, categoryId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.companyId, companyId),
        eq(products.categoryId, categoryId),
        eq(products.isActive, true)
      )
    );
}

// ==================== ORDERS ====================

export async function createOrder(data: Omit<Order, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(orders).values(data);
  return result[0].insertId;
}

export async function getOrderById(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  return result[0];
}

export async function getOrdersByCompany(companyId: number, status?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (status) {
    return await db
      .select()
      .from(orders)
      .where(and(eq(orders.companyId, companyId), eq(orders.status, status as any)))
      .orderBy(desc(orders.createdAt));
  }

  return await db
    .select()
    .from(orders)
    .where(eq(orders.companyId, companyId))
    .orderBy(desc(orders.createdAt));
}

export async function updateOrderStatus(orderId: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(orders).set({ status: status as any }).where(eq(orders.id, orderId));
}

export async function updateOrderTotal(orderId: number, subtotal: string, total: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(orders).set({ subtotal, total }).where(eq(orders.id, orderId));
}

export async function closeOrder(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(orders)
    .set({ status: "closed", closedAt: new Date() })
    .where(eq(orders.id, orderId));
}

// ==================== ORDER ITEMS ====================

export async function addOrderItem(data: Omit<OrderItem, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(orderItems).values(data);
  return result[0].insertId;
}

export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

export async function updateOrderItemStatus(itemId: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(orderItems).set({ status: status as any }).where(eq(orderItems.id, itemId));
}

// ==================== PAYMENT METHODS ====================

export async function getPaymentMethodsByCompany(companyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(paymentMethods)
    .where(and(eq(paymentMethods.companyId, companyId), eq(paymentMethods.isActive, true)));
}

// ==================== PAYMENTS ====================

export async function addPayment(data: Omit<typeof payments.$inferInsert, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(payments).values(data);
  return result[0].insertId;
}

export async function getPaymentsByOrder(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(payments).where(eq(payments.orderId, orderId));
}

// ==================== CASH REGISTER ====================

export async function openCashRegister(
  data: Omit<CashRegister, "id" | "openedAt" | "closedAt">
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(cashRegisters).values(data);
  return result[0].insertId;
}

export async function getActiveCashRegister(companyId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(cashRegisters)
    .where(
      and(
        eq(cashRegisters.companyId, companyId),
        eq(cashRegisters.userId, userId),
        eq(cashRegisters.status, "open")
      )
    )
    .limit(1);

  return result[0];
}

export async function closeCashRegister(
  registerId: number,
  closingAmount: string,
  expectedAmount: string,
  difference: string,
  notes?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(cashRegisters)
    .set({
      status: "closed",
      closingAmount,
      expectedAmount,
      difference,
      notes,
      closedAt: new Date(),
    })
    .where(eq(cashRegisters.id, registerId));
}

// ==================== CASH MOVEMENTS ====================

export async function addCashMovement(
  data: Omit<typeof cashMovements.$inferInsert, "id" | "createdAt">
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(cashMovements).values(data);
  return result[0].insertId;
}

export async function getCashMovements(registerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(cashMovements)
    .where(eq(cashMovements.cashRegisterId, registerId));
}

// ==================== BILL SPLITS ====================

export async function createBillSplit(
  orderId: number,
  numberOfPeople: number,
  amountPerPerson: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(billSplits).values({
    orderId,
    numberOfPeople,
    amountPerPerson,
  });
  return result[0].insertId;
}

export async function getBillSplit(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(billSplits).where(eq(billSplits.orderId, orderId)).limit(1);
  return result[0];
}

// ==================== PRINTERS ====================

export async function getPrintersByCompany(companyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(printers)
    .where(and(eq(printers.companyId, companyId), eq(printers.isActive, true)));
}

export async function getPrinterBySector(companyId: number, sector: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(printers)
    .where(
      and(
        eq(printers.companyId, companyId),
        eq(printers.productionSector, sector),
        eq(printers.isActive, true)
      )
    )
    .limit(1);

  return result[0];
}


// ==================== DELIVERY REQUESTS ====================

export async function createDeliveryRequest(
  data: Omit<typeof deliveryRequests.$inferInsert, "id" | "requestedAt" | "acceptedAt" | "deliveredAt">
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(deliveryRequests).values(data);
  return result[0].insertId;
}

export async function getDeliveryRequestsByCompany(companyId: number, status?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (status) {
    return await db
      .select()
      .from(deliveryRequests)
      .where(
        and(
          eq(deliveryRequests.companyId, companyId),
          eq(deliveryRequests.status, status as any)
        )
      )
      .orderBy(desc(deliveryRequests.requestedAt));
  }

  return await db
    .select()
    .from(deliveryRequests)
    .where(eq(deliveryRequests.companyId, companyId))
    .orderBy(desc(deliveryRequests.requestedAt));
}

export async function updateDeliveryRequestStatus(
  requestId: number,
  status: string,
  deliveryPersonId?: number,
  deliveryPersonName?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { status };

  if (status === "accepted" && deliveryPersonId) {
    updateData.deliveryPersonId = deliveryPersonId;
    updateData.deliveryPersonName = deliveryPersonName;
    updateData.acceptedAt = new Date();
  }

  if (status === "delivered") {
    updateData.deliveredAt = new Date();
  }

  await db.update(deliveryRequests).set(updateData).where(eq(deliveryRequests.id, requestId));
}

export async function getDeliveryRequestById(requestId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(deliveryRequests)
    .where(eq(deliveryRequests.id, requestId))
    .limit(1);

  return result[0];
}
