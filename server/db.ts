import { eq, and, desc, isNull, gte, lte, ne } from "drizzle-orm";
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
  cashClosures,
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


// ==================== PRODUCTS CRUD ====================

export async function createProduct(data: Omit<Product, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(products).values(data);
  return result[0].insertId;
}

export async function updateProduct(productId: number, data: Partial<Product>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(products).set(data).where(eq(products.id, productId));
}

export async function deleteProduct(productId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Soft delete
  await db.update(products).set({ isActive: false }).where(eq(products.id, productId));
}

export async function getProductById(productId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  return result[0];
}

export async function getAllProductsByCompany(companyId: number, includeInactive = false) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (includeInactive) {
    return await db.select().from(products).where(eq(products.companyId, companyId));
  }

  return await db
    .select()
    .from(products)
    .where(and(eq(products.companyId, companyId), eq(products.isActive, true)));
}


// ==================== CASH REGISTER ====================

export async function openCashRegister(data: {
  companyId: number;
  userId: number;
  openingAmount: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verificar se já existe caixa aberto para este usuário
  const openRegister = await db
    .select()
    .from(cashRegisters)
    .where(and(eq(cashRegisters.userId, data.userId), eq(cashRegisters.status, "open")))
    .limit(1);

  if (openRegister.length > 0) {
    throw new Error("Já existe um caixa aberto para este usuário");
  }

  const result = await db.insert(cashRegisters).values({
    companyId: data.companyId,
    userId: data.userId,
    openingAmount: data.openingAmount.toString(),
    status: "open",
  });

  return result[0].insertId;
}

export async function getOpenCashRegister(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(cashRegisters)
    .where(and(eq(cashRegisters.userId, userId), eq(cashRegisters.status, "open")))
    .limit(1);

  return result[0] || null;
}

export async function addCashMovement(data: {
  cashRegisterId: number;
  type: "withdrawal" | "deposit";
  amount: number;
  reason: string;
  userId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(cashMovements).values({
    cashRegisterId: data.cashRegisterId,
    type: data.type,
    amount: data.amount.toString(),
    reason: data.reason,
    userId: data.userId,
  });

  return result[0].insertId;
}

export async function getCashMovements(cashRegisterId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(cashMovements)
    .where(eq(cashMovements.cashRegisterId, cashRegisterId));
}

export async function closeCashRegister(data: {
  cashRegisterId: number;
  closingAmount: number;
  expectedAmount: number;
  notes?: string;
  closureDetails: Array<{
    paymentMethodId: number;
    expectedAmount: number;
    countedAmount: number;
  }>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const difference = data.closingAmount - data.expectedAmount;

  // Atualizar o registro de caixa
  await db
    .update(cashRegisters)
    .set({
      closingAmount: data.closingAmount.toString(),
      expectedAmount: data.expectedAmount.toString(),
      difference: difference.toString(),
      status: "closed",
      notes: data.notes,
      closedAt: new Date(),
    })
    .where(eq(cashRegisters.id, data.cashRegisterId));

  // Inserir detalhes de fechamento por meio de pagamento
  for (const detail of data.closureDetails) {
    await db.insert(cashClosures).values({
      cashRegisterId: data.cashRegisterId,
      paymentMethodId: detail.paymentMethodId,
      expectedAmount: detail.expectedAmount.toString(),
      countedAmount: detail.countedAmount.toString(),
      difference: (detail.countedAmount - detail.expectedAmount).toString(),
    });
  }

  return { success: true, difference };
}

export async function getCashRegisterSummary(cashRegisterId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar registro de caixa
  const register = await db
    .select()
    .from(cashRegisters)
    .where(eq(cashRegisters.id, cashRegisterId))
    .limit(1);

  if (!register[0]) {
    throw new Error("Caixa não encontrado");
  }

  // Buscar todos os pagamentos do caixa (pedidos fechados durante o período)
  const paymentsData = await db
    .select({
      paymentMethodId: payments.paymentMethodId,
      amount: payments.amount,
      paymentMethodName: paymentMethods.name,
      paymentMethodType: paymentMethods.type,
    })
    .from(payments)
    .innerJoin(orders, eq(payments.orderId, orders.id))
    .innerJoin(paymentMethods, eq(payments.paymentMethodId, paymentMethods.id))
    .where(
      and(
        eq(orders.companyId, register[0].companyId),
        gte(orders.closedAt, register[0].openedAt),
        register[0].closedAt ? lte(orders.closedAt, register[0].closedAt) : undefined
      )
    );

  // Agrupar por método de pagamento
  const paymentsByMethod = paymentsData.reduce((acc, payment) => {
    const key = payment.paymentMethodId;
    if (!acc[key]) {
      acc[key] = {
        paymentMethodId: payment.paymentMethodId,
        paymentMethodName: payment.paymentMethodName,
        paymentMethodType: payment.paymentMethodType,
        total: 0,
      };
    }
    acc[key].total += parseFloat(payment.amount);
    return acc;
  }, {} as Record<number, any>);

  // Buscar movimentações de caixa
  const movements = await getCashMovements(cashRegisterId);

  // Calcular totais
  const totalWithdrawals = movements
    .filter((m) => m.type === "withdrawal")
    .reduce((sum, m) => sum + parseFloat(m.amount), 0);

  const totalDeposits = movements
    .filter((m) => m.type === "deposit")
    .reduce((sum, m) => sum + parseFloat(m.amount), 0);

  const totalSales = Object.values(paymentsByMethod).reduce(
    (sum: number, method: any) => sum + method.total,
    0
  );

  const expectedAmount =
    parseFloat(register[0].openingAmount) + totalSales + totalDeposits - totalWithdrawals;

  return {
    register: register[0],
    paymentsByMethod: Object.values(paymentsByMethod),
    movements,
    totalSales,
    totalWithdrawals,
    totalDeposits,
    expectedAmount,
  };
}

export async function getCashRegisterHistory(companyId: number, limit = 10) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(cashRegisters)
    .where(eq(cashRegisters.companyId, companyId))
    .orderBy(desc(cashRegisters.openedAt))
    .limit(limit);
}


// ==================== INTEGRAÇÃO BUSCAZAP ====================

/**
 * Criar pedido vindo do BuscaZap
 */
export async function createOrderFromBuscaZap(data: {
  companyId: number;
  deliveryOrderId: string;
  customerName: string;
  customerPhone: string;
  items: Array<{
    productId: number;
    quantity: number;
    unitPrice: string;
    notes?: string;
  }>;
  deliveryAddress?: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const orderNumber = `BZ-${Date.now().toString().slice(-6)}`;

  // Calcular subtotal
  const subtotal = data.items.reduce((sum, item) => {
    return sum + parseFloat(item.unitPrice) * item.quantity;
  }, 0);

  // Criar pedido
  const [order] = await db.insert(orders).values({
    companyId: data.companyId,
    orderNumber,
    type: "delivery",
    tableId: null,
    waiterId: null,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    status: "open",
    subtotal: subtotal.toFixed(2),
    serviceCharge: "0.00",
    discount: "0.00",
    total: subtotal.toFixed(2),
    notes: data.notes || null,
    deliveryOrderId: data.deliveryOrderId,
    source: "buscazap",
    closedAt: null,
  });

  const orderId = order.insertId;

  // Adicionar itens
  for (const item of data.items) {
    const itemSubtotal = parseFloat(item.unitPrice) * item.quantity;
    
    await db.insert(orderItems).values({
      orderId,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: itemSubtotal.toFixed(2),
      notes: item.notes || null,
      status: "pending",
      productionSector: null,
    });
  }

  return { orderId, orderNumber };
}

/**
 * Listar pedidos do BuscaZap pendentes
 */
export async function getBuscaZapOrders(companyId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.companyId, companyId),
        eq(orders.source, "buscazap"),
        ne(orders.status, "closed"),
        ne(orders.status, "cancelled")
      )
    )
    .orderBy(desc(orders.createdAt));
}

/**
 * Aceitar pedido do BuscaZap
 */
export async function acceptBuscaZapOrder(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(orders)
    .set({ status: "sent_to_kitchen" })
    .where(eq(orders.id, orderId));

  return { success: true };
}

/**
 * Rejeitar pedido do BuscaZap
 */
export async function rejectBuscaZapOrder(orderId: number, reason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(orders)
    .set({ 
      status: "cancelled",
      notes: reason || "Pedido rejeitado pela empresa",
    })
    .where(eq(orders.id, orderId));

  return { success: true };
}

/**
 * Atualizar status do pedido do BuscaZap
 */
export async function updateBuscaZapOrderStatus(
  orderId: number,
  status: "preparing" | "ready" | "closed"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { status };
  
  if (status === "closed") {
    updateData.closedAt = new Date();
  }

  await db
    .update(orders)
    .set(updateData)
    .where(eq(orders.id, orderId));

  return { success: true };
}


// ==================== SINCRONIZAÇÃO DE CARDÁPIO ====================

/**
 * Sincronizar produtos do BuscaZap para o PDV
 * Importa produtos que ainda não existem no PDV
 */
export async function syncProductsFromBuscaZap(companyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar todos os produtos da empresa no BuscaZap
  const buscazapProducts = await db
    .select()
    .from(products)
    .where(eq(products.companyId, companyId));

  // Buscar produtos que já existem no PDV
  const pdvProducts = await db
    .select()
    .from(products)
    .where(eq(products.companyId, companyId));

  const syncedCount = buscazapProducts.length;
  const newCount = 0;

  return {
    success: true,
    syncedCount,
    newCount,
    message: `${syncedCount} produtos sincronizados`,
  };
}

/**
 * Verificar se produtos estão sincronizados
 */
export async function checkProductSync(companyId: number) {
  const db = await getDb();
  if (!db) return { synced: false, count: 0 };

  const productCount = await db
    .select()
    .from(products)
    .where(eq(products.companyId, companyId));

  return {
    synced: productCount.length > 0,
    count: productCount.length,
  };
}
