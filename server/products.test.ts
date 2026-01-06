import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock context for testing
const mockContext: TrpcContext = {
  user: {
    id: 1,
    openId: "test-open-id",
    name: "Test User",
    email: "test@example.com",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

describe("Products Router", () => {
  const caller = appRouter.createCaller(mockContext);

  it("should list all products", async () => {
    const products = await caller.products.getAll({ includeInactive: false });
    expect(Array.isArray(products)).toBe(true);
  });

  it("should create a new product", async () => {
    const newProduct = {
      name: "Produto Teste",
      description: "Descrição do produto teste",
      price: 29.90,
      categoryId: 1,
      image: "https://example.com/image.jpg",
      productionSector: "cozinha",
      preparationTime: 15,
    };

    const result = await caller.products.create(newProduct);
    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("should list products by company", async () => {
    const products = await caller.products.list({ companyId: 1 });
    expect(Array.isArray(products)).toBe(true);
  });
});

describe("Categories Router", () => {
  const caller = appRouter.createCaller(mockContext);

  it("should list all categories", async () => {
    const categories = await caller.categories.getAll();
    expect(Array.isArray(categories)).toBe(true);
  });

  it("should list categories by company", async () => {
    const categories = await caller.categories.list({ companyId: 1 });
    expect(Array.isArray(categories)).toBe(true);
  });
});

describe("Order Items Router", () => {
  const caller = appRouter.createCaller(mockContext);
  let testOrderId: number;

  beforeAll(async () => {
    // Create a test order first
    const order = await caller.orders.create({
      companyId: 1,
      type: "dine_in",
      tableId: 1,
      customerName: "Test Customer",
    });
    testOrderId = order.id;
  });

  it("should add item to order", async () => {
    const item = {
      orderId: testOrderId,
      productId: 1,
      quantity: 2,
      unitPrice: "29.90",
      notes: "Sem cebola",
    };

    const result = await caller.orderItems.add(item);
    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("should list order items", async () => {
    const items = await caller.orderItems.list({ orderId: testOrderId });
    expect(Array.isArray(items)).toBe(true);
  });

  it("should update order item status", async () => {
    // First add an item
    const item = await caller.orderItems.add({
      orderId: testOrderId,
      productId: 1,
      quantity: 1,
      unitPrice: "19.90",
    });

    // Then update its status
    const result = await caller.orderItems.updateStatus({
      itemId: item.id,
      status: "preparing",
    });
    expect(result.success).toBe(true);
  });
});
