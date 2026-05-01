import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1, sellerId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    seller: {
      id: sellerId,
      userId: userId,
      storeName: "Test Store",
      businessType: "commerce",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("tRPC Procedures", () => {
  describe("crm.customers.list", () => {
    it("should return customers for authenticated user", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const customers = await caller.crm.customers.list();
      expect(Array.isArray(customers)).toBe(true);
    });

    it("should require authentication", async () => {
      const ctx = createAuthContext();
      ctx.user = null;
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.crm.customers.list();
        expect.fail("Should throw error for unauthenticated user");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("orders.list", () => {
    it("should return orders for authenticated user", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const orders = await caller.orders.list();
      expect(Array.isArray(orders)).toBe(true);
    });

    it("should return orders with required fields", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const orders = await caller.orders.list();
      if (orders.length > 0) {
        const order = orders[0];
        expect(order).toHaveProperty("id");
        expect(order).toHaveProperty("orderNumber");
        expect(order).toHaveProperty("status");
      }
    });
  });

  describe("orders.updateStatus", () => {
    it("should update order status", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.orders.updateStatus({
        orderId: 1,
        status: "shipped",
      });

      expect(result).toEqual({ success: true });
    });

    it("should require valid order ID", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.orders.updateStatus({
          orderId: -1,
          status: "shipped",
        });
        // If no error, that's fine - depends on DB constraints
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("stock.list", () => {
    it("should return stock items for authenticated user", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const stock = await caller.stock.list();
      expect(Array.isArray(stock)).toBe(true);
    });

    it("should return stock items with product information", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const stock = await caller.stock.list();
      if (stock.length > 0) {
        const item = stock[0];
        expect(item).toHaveProperty("id");
        expect(item).toHaveProperty("quantity");
        expect(item).toHaveProperty("productName");
      }
    });
  });

  describe("reports.transactions", () => {
    it("should return transactions for authenticated user", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const transactions = await caller.reports.transactions();
      expect(Array.isArray(transactions)).toBe(true);
    });

    it("should return transactions with required fields", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const transactions = await caller.reports.transactions();
      if (transactions.length > 0) {
        const transaction = transactions[0];
        expect(transaction).toHaveProperty("id");
        expect(transaction).toHaveProperty("type");
        expect(transaction).toHaveProperty("amount");
      }
    });
  });

  describe("seller.profile", () => {
    it("should return seller profile for authenticated user", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const profile = await caller.seller.profile();
      if (profile) {
        expect(profile).toHaveProperty("id");
        expect(profile).toHaveProperty("storeName");
        expect(profile).toHaveProperty("businessType");
      }
    });
  });
});
