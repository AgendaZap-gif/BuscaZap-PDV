import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { getCustomersBySellerIdWithStats, getOrdersBySellerIdWithItems, getStockBySellerIdWithProducts } from "./db";

describe("Database Queries", () => {
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
  });

  describe("getCustomersBySellerIdWithStats", () => {
    it("should return an array of customers", async () => {
      const customers = await getCustomersBySellerIdWithStats(1);
      expect(Array.isArray(customers)).toBe(true);
    });

    it("should return customers with required fields", async () => {
      const customers = await getCustomersBySellerIdWithStats(1);
      if (customers.length > 0) {
        const customer = customers[0];
        expect(customer).toHaveProperty("id");
        expect(customer).toHaveProperty("name");
        expect(customer).toHaveProperty("email");
        expect(customer).toHaveProperty("sellerId");
      }
    });

    it("should return empty array for non-existent seller", async () => {
      const customers = await getCustomersBySellerIdWithStats(99999);
      expect(customers).toEqual([]);
    });
  });

  describe("getOrdersBySellerIdWithItems", () => {
    it("should return an array of orders", async () => {
      const orders = await getOrdersBySellerIdWithItems(1);
      expect(Array.isArray(orders)).toBe(true);
    });

    it("should return orders with required fields", async () => {
      const orders = await getOrdersBySellerIdWithItems(1);
      if (orders.length > 0) {
        const order = orders[0];
        expect(order).toHaveProperty("id");
        expect(order).toHaveProperty("orderNumber");
        expect(order).toHaveProperty("status");
        expect(order).toHaveProperty("totalAmount");
      }
    });

    it("should return orders sorted by creation date descending", async () => {
      const orders = await getOrdersBySellerIdWithItems(1);
      if (orders.length > 1) {
        const first = new Date(orders[0].createdAt).getTime();
        const second = new Date(orders[1].createdAt).getTime();
        expect(first).toBeGreaterThanOrEqual(second);
      }
    });
  });

  describe("getStockBySellerIdWithProducts", () => {
    it("should return an array of stock items", async () => {
      const stock = await getStockBySellerIdWithProducts(1);
      expect(Array.isArray(stock)).toBe(true);
    });

    it("should return stock items with product information", async () => {
      const stock = await getStockBySellerIdWithProducts(1);
      if (stock.length > 0) {
        const item = stock[0];
        expect(item).toHaveProperty("id");
        expect(item).toHaveProperty("quantity");
        expect(item).toHaveProperty("productName");
        expect(item).toHaveProperty("productSku");
        expect(item).toHaveProperty("productPrice");
      }
    });

    it("should return stock items sorted by update date descending", async () => {
      const stock = await getStockBySellerIdWithProducts(1);
      if (stock.length > 1) {
        const first = new Date(stock[0].updatedAt).getTime();
        const second = new Date(stock[1].updatedAt).getTime();
        expect(first).toBeGreaterThanOrEqual(second);
      }
    });

    it("should include min threshold information", async () => {
      const stock = await getStockBySellerIdWithProducts(1);
      if (stock.length > 0) {
        const item = stock[0];
        expect(item).toHaveProperty("minThreshold");
        expect(typeof item.minThreshold === "number" || item.minThreshold === null).toBe(true);
      }
    });
  });
});
