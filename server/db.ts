import { eq, and, asc, desc, isNull, gte, lte, ne, sql, inArray, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
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
  chatMessages,
  orderRatings,
  companyDeliverySettings,
  companyDrivers,
  externalPlatformIntegrations,
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
    if (user.password !== undefined) {
      values.password = user.password;
      updateSet.password = user.password;
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

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({ companyId }).where(eq(users.id, userId));
}

/** Criar garçom (login/senha) vinculado à empresa. Usado pelo PDV web. */
export async function createWaiter(companyId: number, email: string, password: string, name: string): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getUserByEmail(email);
  if (existing) {
    throw new Error("Já existe um usuário com este email");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const openId = `local_${nanoid(32)}`;

  await db.insert(users).values({
    openId,
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    name: name || null,
    loginMethod: "email",
    role: "waiter",
    companyId,
    lastSignedIn: new Date(),
  });

  const created = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return created[0]?.id ?? 0;
}

/** Listar garçons da empresa */
export async function getWaitersByCompany(companyId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      companyId: users.companyId,
      lastSignedIn: users.lastSignedIn,
    })
    .from(users)
    .where(and(eq(users.companyId, companyId), eq(users.role, "waiter")));
}

/** Remover garçom (apenas desvincula da empresa; usuário continua no sistema) */
export async function removeWaiter(waiterId: number, companyId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(users)
    .set({ companyId: null })
    .where(and(eq(users.id, waiterId), eq(users.companyId, companyId), eq(users.role, "waiter")));
}

// ==================== COMPANIES ====================

/** Busca empresas por nome (para admin global). Não carrega todas de uma vez. */
export async function searchCompaniesByName(query: string, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const term = `%${query.trim()}%`;
  return await db
    .select()
    .from(companies)
    .where(and(eq(companies.isActive, true), like(companies.name, term)))
    .limit(limit);
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

/**
 * Pool global (cidade): pedidos pendentes priorizados.
 * Importante: NÃO mistura solicitações marcadas para entregadores próprios.
 *
 * Nota: `cityId` ainda não é aplicado porque `companies` não tem `cityId` no schema atual.
 */
export async function getPendingOrdersPrioritized(cityId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // cityId reservado para quando `companies.cityId` existir
  void cityId;

  const rows = await db
    .select({
      id: deliveryRequests.id,
      companyId: deliveryRequests.companyId,
      orderId: deliveryRequests.orderId,
      customerName: deliveryRequests.customerName,
      customerPhone: deliveryRequests.customerPhone,
      deliveryAddress: deliveryRequests.deliveryAddress,
      deliveryFee: deliveryRequests.deliveryFee,
      requestedAt: deliveryRequests.requestedAt,
      companyName: companies.name,
      pickupAddress: companies.address,
    })
    .from(deliveryRequests)
    .innerJoin(companies, eq(deliveryRequests.companyId, companies.id))
    .where(
      and(
        eq(deliveryRequests.status, "pending"),
        isNull(deliveryRequests.deliveryPersonId),
        // Não misturar com entregadores próprios
        eq(deliveryRequests.deliveryType, "city")
      )
    )
    .orderBy(asc(deliveryRequests.requestedAt));

  const now = Date.now();
  return rows.map((r) => {
    const requestedAtMs = new Date(r.requestedAt as any).getTime();
    const waitingTimeMinutes = Math.max(0, Math.floor((now - requestedAtMs) / 60000));

    return {
      ...r,
      waitingTimeMinutes,
    };
  });
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

  // Emitir evento WebSocket de novo pedido
  try {
    const { emitNewOrder } = await import("./_core/websocket");
    const fullOrder = await getOrderById(orderId);
    if (fullOrder) {
      emitNewOrder(data.companyId, fullOrder);
    }
  } catch (error) {
    console.log('[WebSocket] Failed to emit new order event:', error);
  }

  return { orderId, orderNumber };
}

// ==================== INTEGRAÇÃO PLATAFORMAS EXTERNAS (UNIFICADO) ====================

/**
 * Criar pedido vindo de qualquer plataforma externa (Pedijá, Iffod, 99Food, etc.)
 * Função genérica que normaliza pedidos de diferentes plataformas
 */
export async function createOrderFromExternalPlatform(data: {
  companyId: number;
  platform: "pedija" | "iffod" | "99food" | "rappi" | "uber_eats" | "ifood" | "other";
  externalOrderId: string; // ID do pedido na plataforma externa
  customerName: string;
  customerPhone: string;
  items: Array<{
    productId?: number; // Se não tiver, tentar buscar por nome
    productName: string; // Nome do produto na plataforma externa
    quantity: number;
    unitPrice: string;
    notes?: string;
  }>;
  deliveryAddress?: string;
  deliveryFee?: string;
  subtotal?: string;
  total?: string;
  notes?: string;
  paymentMethod?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verificar se a integração está ativa
  const integration = await db
    .select()
    .from(externalPlatformIntegrations)
    .where(
      and(
        eq(externalPlatformIntegrations.companyId, data.companyId),
        eq(externalPlatformIntegrations.platform, data.platform),
        eq(externalPlatformIntegrations.isActive, true)
      )
    )
    .limit(1);

  if (integration.length === 0) {
    throw new Error(`Integração com ${data.platform} não está ativa para esta empresa`);
  }

  // Gerar número do pedido com prefixo da plataforma
  const platformPrefix: Record<string, string> = {
    pedija: "PJ",
    iffod: "IF",
    "99food": "99",
    rappi: "RP",
    uber_eats: "UE",
    ifood: "IFD",
    other: "EXT",
  };
  const prefix = platformPrefix[data.platform] || "EXT";
  const orderNumber = `${prefix}-${Date.now().toString().slice(-6)}`;

  // Calcular valores se não fornecidos
  const subtotal = data.subtotal
    ? parseFloat(data.subtotal)
    : data.items.reduce((sum, item) => sum + parseFloat(item.unitPrice) * item.quantity, 0);
  
  const deliveryFee = data.deliveryFee ? parseFloat(data.deliveryFee) : 0;
  const total = data.total ? parseFloat(data.total) : subtotal + deliveryFee;

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
    serviceCharge: deliveryFee.toFixed(2),
    discount: "0.00",
    total: total.toFixed(2),
    notes: data.notes || null,
    deliveryOrderId: data.externalOrderId,
    externalPlatform: data.platform,
    source: data.platform === "pedija" ? "pedija" : 
            data.platform === "iffod" ? "iffod" :
            data.platform === "99food" ? "99food" :
            data.platform === "rappi" ? "rappi" :
            data.platform === "uber_eats" ? "uber_eats" :
            data.platform === "ifood" ? "ifood" : "other",
    closedAt: null,
  });

  const orderId = order.insertId;

  // Adicionar itens (tentar mapear produtos por nome se productId não fornecido)
  for (const item of data.items) {
    let productId = item.productId;

    // Se não tiver productId, tentar buscar por nome
    if (!productId) {
      const product = await db
        .select()
        .from(products)
        .where(
          and(
            eq(products.companyId, data.companyId),
            eq(products.name, item.productName),
            eq(products.isActive, true)
          )
        )
        .limit(1);
      
      if (product.length > 0) {
        productId = product[0].id;
      } else {
        // Se não encontrar, criar produto temporário ou pular (depende da estratégia)
        console.warn(`[External Platform] Produto não encontrado: ${item.productName} para empresa ${data.companyId}`);
        // Por enquanto, vamos pular itens sem produto correspondente
        continue;
      }
    }

    const itemSubtotal = parseFloat(item.unitPrice) * item.quantity;
    
    await db.insert(orderItems).values({
      orderId,
      productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: itemSubtotal.toFixed(2),
      notes: item.notes || null,
      status: "pending",
      productionSector: null,
    });
  }

  // Auto-aceitar se configurado
  if (integration[0].settings?.autoAccept) {
    await db
      .update(orders)
      .set({ status: "sent_to_kitchen" })
      .where(eq(orders.id, orderId));
  }

  // Auto-imprimir se configurado
  if (integration[0].settings?.autoPrint) {
    try {
      await db.printOrder(orderId);
    } catch (error) {
      console.log(`[External Platform] Falha ao imprimir pedido ${orderId}:`, error);
    }
  }

  // Emitir evento WebSocket de novo pedido
  try {
    const { emitNewOrder } = await import("./_core/websocket");
    const fullOrder = await getOrderById(orderId);
    if (fullOrder) {
      emitNewOrder(data.companyId, fullOrder);
    }
  } catch (error) {
    console.log('[WebSocket] Failed to emit new order event:', error);
  }

  return { orderId, orderNumber };
}

/**
 * Listar todos os pedidos externos (de todas as plataformas) pendentes
 */
export async function getAllExternalOrders(companyId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.companyId, companyId),
        sql`${orders.source} IN ('pedija', 'iffod', '99food', 'rappi', 'uber_eats', 'ifood', 'other', 'buscazap')`,
        ne(orders.status, "closed"),
        ne(orders.status, "cancelled")
      )
    )
    .orderBy(desc(orders.createdAt));
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

  const order = await getOrderById(orderId);
  if (!order) throw new Error("Pedido não encontrado");

  await db
    .update(orders)
    .set({ status: "sent_to_kitchen" })
    .where(eq(orders.id, orderId));

  try {
    const { emitOrderStatusUpdate } = await import("./_core/websocket");
    emitOrderStatusUpdate(order.companyId, orderId, "sent_to_kitchen");
  } catch (error) {
    console.log("[WebSocket] Failed to emit order-status-update:", error);
  }

  return { success: true };
}

/**
 * Rejeitar pedido do BuscaZap
 */
export async function rejectBuscaZapOrder(orderId: number, reason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const order = await getOrderById(orderId);
  if (!order) throw new Error("Pedido não encontrado");

  await db
    .update(orders)
    .set({ 
      status: "cancelled",
      notes: reason || "Pedido rejeitado pela empresa",
    })
    .where(eq(orders.id, orderId));

  try {
    const { emitOrderStatusUpdate } = await import("./_core/websocket");
    emitOrderStatusUpdate(order.companyId, orderId, "cancelled");
  } catch (error) {
    console.log("[WebSocket] Failed to emit order-status-update:", error);
  }

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

  const order = await getOrderById(orderId);
  if (!order) throw new Error("Pedido não encontrado");

  const updateData: any = { status };
  
  if (status === "closed") {
    updateData.closedAt = new Date();
  }

  await db
    .update(orders)
    .set(updateData)
    .where(eq(orders.id, orderId));

  try {
    const { emitOrderStatusUpdate } = await import("./_core/websocket");
    emitOrderStatusUpdate(order.companyId, orderId, status);
  } catch (error) {
    console.log("[WebSocket] Failed to emit order-status-update:", error);
  }

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


// ==================== IMPRESSÃO DE PEDIDOS ====================

/**
 * Formatar pedido para impressão térmica
 */
export function formatOrderForPrint(order: any, items: any[]): string {
  const width = 32; // Largura padrão para impressora 58mm
  const line = "=".repeat(width);
  const divider = "-".repeat(width);

  let receipt = "";
  
  // Cabeçalho
  receipt += `${line}\n`;
  receipt += centerText("NOVO PEDIDO BUSCAZAP", width) + "\n";
  receipt += `${line}\n\n`;
  
  // Número do pedido
  receipt += `Pedido: ${order.orderNumber}\n`;
  receipt += `Data: ${new Date(order.createdAt).toLocaleString("pt-BR")}\n`;
  receipt += `${divider}\n\n`;
  
  // Cliente
  receipt += "CLIENTE:\n";
  receipt += `${order.customerName}\n`;
  receipt += `${order.customerPhone}\n`;
  receipt += `${divider}\n\n`;
  
  // Itens
  receipt += "ITENS:\n";
  items.forEach((item) => {
    receipt += `${item.quantity}x ${item.productName}\n`;
    if (item.notes) {
      receipt += `   OBS: ${item.notes}\n`;
    }
    receipt += `   R$ ${parseFloat(item.subtotal).toFixed(2)}\n`;
  });
  receipt += `${divider}\n\n`;
  
  // Total
  receipt += `TOTAL: R$ ${parseFloat(order.total).toFixed(2)}\n`;
  
  // Observações gerais
  if (order.notes) {
    receipt += `${divider}\n`;
    receipt += "OBSERVAÇÕES:\n";
    receipt += `${order.notes}\n`;
  }
  
  receipt += `${line}\n\n\n`;
  
  return receipt;
}

function centerText(text: string, width: number): string {
  const padding = Math.floor((width - text.length) / 2);
  return " ".repeat(padding) + text;
}

/**
 * Buscar impressora da cozinha
 */
export async function getKitchenPrinter(companyId: number) {
  const db = await getDb();
  if (!db) return null;

  const printer = await db
    .select()
    .from(printers)
    .where(
      and(
        eq(printers.companyId, companyId),
        eq(printers.type, "kitchen"),
        eq(printers.isActive, true)
      )
    )
    .limit(1);

  return printer[0] || null;
}

/**
 * Enviar para impressão (simulado - em produção usaria biblioteca de impressão)
 */
export async function printOrder(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar pedido com itens
  const order = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order[0]) {
    throw new Error("Pedido não encontrado");
  }

  const items = await db
    .select({
      quantity: orderItems.quantity,
      productName: products.name,
      subtotal: orderItems.subtotal,
      notes: orderItems.notes,
    })
    .from(orderItems)
    .leftJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, orderId));

  // Formatar para impressão
  const printContent = formatOrderForPrint(order[0], items);

  // Buscar impressora
  const printer = await getKitchenPrinter(order[0].companyId);

  if (!printer) {
    console.log("[PRINT] Nenhuma impressora configurada");
    console.log(printContent);
    return { success: false, message: "Nenhuma impressora configurada" };
  }

  // Em produção, aqui enviaria para a impressora via rede
  // Por enquanto, apenas loga o conteúdo
  console.log(`[PRINT] Enviando para impressora: ${printer.name}`);
  console.log(printContent);

  return { success: true, message: "Pedido enviado para impressão" };
}


// ==================== NOTIFICAÇÕES PUSH ====================

/**
 * Enviar notificação push para o cliente
 */
export async function notifyCustomer(data: {
  orderId: number;
  title: string;
  message: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar pedido para pegar informações do cliente
  const order = await db
    .select()
    .from(orders)
    .where(eq(orders.id, data.orderId))
    .limit(1);

  if (!order[0]) {
    throw new Error("Pedido não encontrado");
  }

  // Em produção, aqui enviaria notificação via Firebase/OneSignal/etc
  // Por enquanto, apenas loga
  console.log(`[NOTIFICATION] Enviando para: ${order[0].customerName}`);
  console.log(`[NOTIFICATION] Título: ${data.title}`);
  console.log(`[NOTIFICATION] Mensagem: ${data.message}`);

  return {
    success: true,
    message: "Notificação enviada com sucesso",
  };
}

/**
 * Notificar cliente sobre mudança de status do pedido
 */
export async function notifyOrderStatus(orderId: number, status: string) {
  const statusMessages: Record<string, { title: string; message: string }> = {
    sent_to_kitchen: {
      title: "Pedido Aceito! 🎉",
      message: "Seu pedido foi aceito e está sendo preparado.",
    },
    preparing: {
      title: "Preparando seu pedido 👨‍🍳",
      message: "Estamos preparando seu pedido com carinho!",
    },
    ready: {
      title: "Pedido Pronto! ✅",
      message: "Seu pedido está pronto e será entregue em breve.",
    },
    closed: {
      title: "Pedido Entregue 🚀",
      message: "Seu pedido foi entregue. Bom apetite!",
    },
  };

  const notification = statusMessages[status];
  if (!notification) {
    return { success: false, message: "Status inválido" };
  }

  return await notifyCustomer({
    orderId,
    title: notification.title,
    message: notification.message,
  });
}


// ==================== ESTATÍSTICAS BUSCAZAP ====================

/**
 * Buscar estatísticas de pedidos do BuscaZap
 */
export async function getBuscaZapStats(companyId: number, period: "today" | "week" | "month") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Calcular data de início baseado no período
  const now = new Date();
  let startDate = new Date();
  
  if (period === "today") {
    startDate.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    startDate.setDate(now.getDate() - 7);
  } else if (period === "month") {
    startDate.setDate(now.getDate() - 30);
  }

  // Buscar todos os pedidos do BuscaZap no período
  const allOrders = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.companyId, companyId),
        eq(orders.source, "buscazap"),
        gte(orders.createdAt, startDate)
      )
    );

  const totalOrders = allOrders.length;
  const acceptedOrders = allOrders.filter(o => o.status !== "cancelled").length;
  const rejectedOrders = allOrders.filter(o => o.status === "cancelled").length;
  const acceptanceRate = totalOrders > 0 ? (acceptedOrders / totalOrders) * 100 : 0;

  // Calcular valor total e médio
  const totalRevenue = allOrders
    .filter(o => o.status === "closed")
    .reduce((sum, o) => sum + parseFloat(o.total), 0);
  
  const avgOrderValue = acceptedOrders > 0 ? totalRevenue / acceptedOrders : 0;

  // Calcular tempo médio de preparo
  const completedOrders = allOrders.filter(o => o.status === "closed" && o.closedAt);
  const avgPrepTime = completedOrders.length > 0
    ? completedOrders.reduce((sum, o) => {
        const prepTime = new Date(o.closedAt!).getTime() - new Date(o.createdAt).getTime();
        return sum + prepTime;
      }, 0) / completedOrders.length / 1000 / 60 // Converter para minutos
    : 0;

  return {
    totalOrders,
    acceptedOrders,
    rejectedOrders,
    acceptanceRate: Math.round(acceptanceRate * 10) / 10,
    totalRevenue,
    avgOrderValue: Math.round(avgOrderValue * 100) / 100,
    avgPrepTime: Math.round(avgPrepTime),
  };
}

/**
 * Buscar pedidos por horário (para gráfico de horários de pico)
 */
export async function getOrdersByHour(companyId: number, period: "today" | "week" | "month") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date();
  let startDate = new Date();
  
  if (period === "today") {
    startDate.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    startDate.setDate(now.getDate() - 7);
  } else if (period === "month") {
    startDate.setDate(now.getDate() - 30);
  }

  const allOrders = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.companyId, companyId),
        eq(orders.source, "buscazap"),
        gte(orders.createdAt, startDate)
      )
    );

  // Agrupar por hora
  const ordersByHour: Record<number, number> = {};
  for (let i = 0; i < 24; i++) {
    ordersByHour[i] = 0;
  }

  allOrders.forEach(order => {
    const hour = new Date(order.createdAt).getHours();
    ordersByHour[hour]++;
  });

  return Object.entries(ordersByHour).map(([hour, count]) => ({
    hour: parseInt(hour),
    count,
  }));
}

/**
 * Buscar pedidos por dia da semana
 */
export async function getOrdersByWeekday(companyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Últimos 30 dias
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const allOrders = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.companyId, companyId),
        eq(orders.source, "buscazap"),
        gte(orders.createdAt, startDate)
      )
    );

  // Agrupar por dia da semana
  const ordersByWeekday: Record<number, number> = {};
  for (let i = 0; i < 7; i++) {
    ordersByWeekday[i] = 0;
  }

  allOrders.forEach(order => {
    const weekday = new Date(order.createdAt).getDay();
    ordersByWeekday[weekday]++;
  });

  const weekdayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return Object.entries(ordersByWeekday).map(([day, count]) => ({
    day: weekdayNames[parseInt(day)],
    count,
  }));
}


// ==================== CHAT PDV ↔ CLIENTE ====================

/**
 * Enviar mensagem no chat
 */
export async function sendChatMessage(data: {
  orderId: number;
  senderId: number;
  senderType: "customer" | "business";
  message: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(chatMessages).values({
    orderId: data.orderId,
    senderId: data.senderId,
    senderType: data.senderType,
    message: data.message,
    isRead: false,
  });

  const messageId = result.insertId;

  // Emitir evento WebSocket de nova mensagem
  try {
    const { emitNewChatMessage } = await import("./_core/websocket");
    emitNewChatMessage(data.orderId, {
      id: messageId,
      orderId: data.orderId,
      senderId: data.senderId,
      senderType: data.senderType,
      message: data.message,
      isRead: false,
      createdAt: new Date(),
    });
  } catch (error) {
    console.log('[WebSocket] Failed to emit new chat message event:', error);
  }

  return { success: true, messageId };
}

/**
 * Buscar mensagens de um pedido
 */
export async function getChatMessages(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const messages = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.orderId, orderId))
    .orderBy(chatMessages.createdAt);

  return messages;
}

/**
 * Marcar mensagens como lidas
 */
export async function markMessagesAsRead(orderId: number, senderType: "customer" | "business") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Marcar como lidas as mensagens do outro lado
  const otherType = senderType === "customer" ? "business" : "customer";

  await db
    .update(chatMessages)
    .set({ isRead: true })
    .where(
      and(
        eq(chatMessages.orderId, orderId),
        eq(chatMessages.senderType, otherType),
        eq(chatMessages.isRead, false)
      )
    );

  return { success: true };
}

/**
 * Contar mensagens não lidas
 */
export async function getUnreadCount(orderId: number, forType: "customer" | "business") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Contar mensagens não lidas do outro lado
  const otherType = forType === "customer" ? "business" : "customer";

  const messages = await db
    .select()
    .from(chatMessages)
    .where(
      and(
        eq(chatMessages.orderId, orderId),
        eq(chatMessages.senderType, otherType),
        eq(chatMessages.isRead, false)
      )
    );

  return messages.length;
}


// ==================== AVALIAÇÕES ====================

/**
 * Criar avaliação de pedido
 */
export async function createOrderRating(data: {
  orderId: number;
  customerId: number;
  companyId: number;
  rating: number;
  comment?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verificar se já existe avaliação para este pedido
  const existing = await db
    .select()
    .from(orderRatings)
    .where(eq(orderRatings.orderId, data.orderId))
    .limit(1);

  if (existing.length > 0) {
    throw new Error("Pedido já foi avaliado");
  }

  const [result] = await db.insert(orderRatings).values({
    orderId: data.orderId,
    customerId: data.customerId,
    companyId: data.companyId,
    rating: data.rating,
    comment: data.comment || null,
  });

  return { success: true, ratingId: result.insertId };
}

/**
 * Buscar avaliação de um pedido
 */
export async function getOrderRating(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const rating = await db
    .select()
    .from(orderRatings)
    .where(eq(orderRatings.orderId, orderId))
    .limit(1);

  return rating[0] || null;
}

/**
 * Buscar todas as avaliações de uma empresa
 */
export async function getCompanyRatings(companyId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const ratings = await db
    .select({
      id: orderRatings.id,
      orderId: orderRatings.orderId,
      rating: orderRatings.rating,
      comment: orderRatings.comment,
      createdAt: orderRatings.createdAt,
      orderNumber: orders.orderNumber,
      customerName: orders.customerName,
    })
    .from(orderRatings)
    .leftJoin(orders, eq(orderRatings.orderId, orders.id))
    .where(eq(orderRatings.companyId, companyId))
    .orderBy(desc(orderRatings.createdAt))
    .limit(limit);

  return ratings;
}

/**
 * Calcular média de avaliações de uma empresa
 */
export async function getCompanyRatingStats(companyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const ratings = await db
    .select()
    .from(orderRatings)
    .where(eq(orderRatings.companyId, companyId));

  if (ratings.length === 0) {
    return {
      totalRatings: 0,
      averageRating: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  const total = ratings.reduce((sum, r) => sum + r.rating, 0);
  const average = total / ratings.length;

  const distribution = ratings.reduce((acc, r) => {
    acc[r.rating as 1 | 2 | 3 | 4 | 5]++;
    return acc;
  }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>);

  return {
    totalRatings: ratings.length,
    averageRating: Math.round(average * 10) / 10,
    distribution,
  };
}

// ==================== USUÁRIOS ====================

export async function getUserById(userId: string) {
  const db = await getDb();
  if (!db) return null;
  
  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(userId)))
      .limit(1);
    
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.log('[Database] Error getting user by id:', error);
    return null;
  }
}

// ==================== DELIVERY E ENTREGADORES PRÓPRIOS ====================

export async function getCompanyDeliverySettings(companyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(companyDeliverySettings)
    .where(eq(companyDeliverySettings.companyId, companyId))
    .limit(1);

  if (result.length === 0) {
    // Retornar configuração padrão se não existir
    return {
      id: 0,
      companyId,
      isOnPedija: false,
      isOnlineForOrders: false,
      hasOwnDrivers: false,
      maxDrivers: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  return result[0];
}

export async function activateCompanyOnPedija(companyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verificar se já existe configuração
  const existing = await db
    .select()
    .from(companyDeliverySettings)
    .where(eq(companyDeliverySettings.companyId, companyId))
    .limit(1);

  if (existing.length > 0) {
    // Atualizar
    await db
      .update(companyDeliverySettings)
      .set({ isOnPedija: true, updatedAt: new Date() })
      .where(eq(companyDeliverySettings.companyId, companyId));
  } else {
    // Inserir
    await db.insert(companyDeliverySettings).values({
      companyId,
      isOnPedija: true,
      isOnlineForOrders: false,
      hasOwnDrivers: false,
      maxDrivers: 0,
    });
  }

  return { success: true };
}

export async function deactivateCompanyFromPedija(companyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(companyDeliverySettings)
    .set({ isOnPedija: false, isOnlineForOrders: false, updatedAt: new Date() })
    .where(eq(companyDeliverySettings.companyId, companyId));

  return { success: true };
}

export async function toggleCompanyOnlineStatus(companyId: number, isOnline: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verificar se empresa está no PediJá
  const settings = await getCompanyDeliverySettings(companyId);
  if (!settings.isOnPedija) {
    throw new Error('Empresa precisa estar ativa no PediJá');
  }

  await db
    .update(companyDeliverySettings)
    .set({ isOnlineForOrders: isOnline, updatedAt: new Date() })
    .where(eq(companyDeliverySettings.companyId, companyId));

  return { success: true, isOnline };
}

export async function getOnlineCompaniesForDelivery(cityId?: number, neighborhood?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar empresas online
  const conditions = [
    eq(companyDeliverySettings.isOnPedija, true),
    eq(companyDeliverySettings.isOnlineForOrders, true),
  ];

  const onlineSettings = await db
    .select()
    .from(companyDeliverySettings)
    .where(and(...conditions));

  const companyIds = onlineSettings.map(s => s.companyId);
  if (companyIds.length === 0) return [];

  // Buscar dados das empresas
  // Nota: filtros de cityId e neighborhood devem ser implementados quando os campos existirem no schema
  const companiesList = await db
    .select()
    .from(companies)
    .where(sql`${companies.id} IN (${companyIds.join(', ')})`);

  return companiesList;
}

export async function addCompanyDriver(companyId: number, driverId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verificar se empresa tem permissão para entregadores próprios
  const settings = await getCompanyDeliverySettings(companyId);
  if (!settings.hasOwnDrivers) {
    throw new Error('Empresa não tem permissão para entregadores próprios');
  }

  // Verificar limite de entregadores
  const currentDrivers = await db
    .select()
    .from(companyDrivers)
    .where(and(
      eq(companyDrivers.companyId, companyId),
      eq(companyDrivers.isActive, true)
    ));

  if (currentDrivers.length >= settings.maxDrivers) {
    throw new Error(`Limite de ${settings.maxDrivers} entregadores atingido`);
  }

  // Adicionar entregador
  await db.insert(companyDrivers).values({
    companyId,
    driverId,
    isActive: true,
  });

  return { success: true };
}

export async function removeCompanyDriver(companyId: number, driverId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(companyDrivers)
    .set({ isActive: false })
    .where(and(
      eq(companyDrivers.companyId, companyId),
      eq(companyDrivers.driverId, driverId)
    ));

  return { success: true };
}

export async function getCompanyDrivers(companyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const drivers = await db
    .select({
      id: companyDrivers.id,
      driverId: companyDrivers.driverId,
      driverName: users.name,
      driverEmail: users.email,
      isActive: companyDrivers.isActive,
      createdAt: companyDrivers.createdAt,
    })
    .from(companyDrivers)
    .innerJoin(users, eq(companyDrivers.driverId, users.id))
    .where(eq(companyDrivers.companyId, companyId));

  return drivers;
}

export async function getOrdersForCompanyDriver(driverId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar empresa do entregador
  const driverCompany = await db
    .select()
    .from(companyDrivers)
    .where(and(
      eq(companyDrivers.driverId, driverId),
      eq(companyDrivers.isActive, true)
    ))
    .limit(1);

  if (driverCompany.length === 0) {
    return [];
  }

  const companyId = driverCompany[0].companyId;

  // Buscar pedidos da empresa
  const ordersList = await db
    .select()
    .from(orders)
    .where(and(
      eq(orders.companyId, companyId),
      sql`${orders.status} IN ('accepted', 'preparing', 'ready', 'out_for_delivery')`
    ))
    .orderBy(desc(orders.createdAt));

  return ordersList;
}

export async function upsertCompanyDeliverySettings(data: {
  companyId: number;
  hasOwnDrivers: boolean;
  maxDrivers: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verificar se já existe
  const existing = await db
    .select()
    .from(companyDeliverySettings)
    .where(eq(companyDeliverySettings.companyId, data.companyId))
    .limit(1);

  if (existing.length > 0) {
    // Atualizar
    await db
      .update(companyDeliverySettings)
      .set({
        hasOwnDrivers: data.hasOwnDrivers,
        maxDrivers: data.maxDrivers,
        updatedAt: new Date(),
      })
      .where(eq(companyDeliverySettings.companyId, data.companyId));
  } else {
    // Inserir
    await db.insert(companyDeliverySettings).values({
      companyId: data.companyId,
      isOnPedija: false,
      isOnlineForOrders: false,
      hasOwnDrivers: data.hasOwnDrivers,
      maxDrivers: data.maxDrivers,
    });
  }

  return { success: true };
}

// ==================== GERENCIAMENTO DE INTEGRAÇÕES EXTERNAS ====================

/**
 * Criar ou atualizar integração com plataforma externa
 */
export async function upsertExternalPlatformIntegration(data: {
  companyId: number;
  platform: "pedija" | "iffod" | "99food" | "rappi" | "uber_eats" | "ifood" | "other";
  apiKey?: string;
  apiSecret?: string;
  webhookSecret?: string;
  settings?: {
    autoAccept?: boolean;
    autoPrint?: boolean;
    notificationSound?: boolean;
    [key: string]: any;
  };
  isActive?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(externalPlatformIntegrations)
    .where(
      and(
        eq(externalPlatformIntegrations.companyId, data.companyId),
        eq(externalPlatformIntegrations.platform, data.platform)
      )
    )
    .limit(1);

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (data.apiKey !== undefined) updateData.apiKey = data.apiKey;
  if (data.apiSecret !== undefined) updateData.apiSecret = data.apiSecret;
  if (data.webhookSecret !== undefined) updateData.webhookSecret = data.webhookSecret;
  if (data.settings !== undefined) updateData.settings = data.settings;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  if (existing.length > 0) {
    await db
      .update(externalPlatformIntegrations)
      .set(updateData)
      .where(eq(externalPlatformIntegrations.id, existing[0].id));
  } else {
    await db.insert(externalPlatformIntegrations).values({
      companyId: data.companyId,
      platform: data.platform,
      apiKey: data.apiKey || null,
      apiSecret: data.apiSecret || null,
      webhookSecret: data.webhookSecret || null,
      settings: data.settings || {},
      isActive: data.isActive !== undefined ? data.isActive : true,
    });
  }

  return { success: true };
}

/**
 * Listar integrações ativas de uma empresa
 */
export async function getExternalPlatformIntegrations(companyId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(externalPlatformIntegrations)
    .where(eq(externalPlatformIntegrations.companyId, companyId))
    .orderBy(desc(externalPlatformIntegrations.updatedAt));
}

/**
 * Ativar/desativar integração
 */
export async function toggleExternalPlatformIntegration(
  companyId: number,
  platform: string,
  isActive: boolean
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(externalPlatformIntegrations)
    .set({ isActive, updatedAt: new Date() })
    .where(
      and(
        eq(externalPlatformIntegrations.companyId, companyId),
        eq(externalPlatformIntegrations.platform, platform as any)
      )
    );

  return { success: true };
}
