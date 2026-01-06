import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    selectCompany: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserCompany(ctx.user.id, input.companyId);
        return { success: true };
      }),
  }),

  // ==================== COMPANIES ====================
  companies: router({
    list: publicProcedure.query(async () => {
      return await db.getAllCompanies();
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getCompanyById(input.id);
      }),
  }),

  // ==================== TABLES ====================
  tables: router({
    list: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input }) => {
        return await db.getTablesByCompany(input.companyId);
      }),
    updateStatus: protectedProcedure
      .input(
        z.object({
          tableId: z.number(),
          status: z.enum(["available", "occupied", "reserved"]),
          orderId: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await db.updateTableStatus(input.tableId, input.status, input.orderId);
        return { success: true };
      }),
    create: protectedProcedure
      .input(
        z.object({
          companyId: z.number(),
          number: z.string(),
          capacity: z.number().default(4),
        })
      )
      .mutation(async ({ input }) => {
        const id = await db.createTable({
          companyId: input.companyId,
          number: input.number,
          capacity: input.capacity,
          status: "available",
          currentOrderId: null,
        });
        return { id };
      }),
  }),

  // ==================== CATEGORIES ====================
  categories: router({
    list: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCategoriesByCompany(input.companyId);
      }),
    getAll: protectedProcedure.query(async () => {
      const companyId = 1; // TODO: Get from ctx.user.companyId
      return await db.getCategoriesByCompany(companyId);
    }),
  }),

  // ==================== PRODUCTS ====================
  products: router({
    list: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input }) => {
        return await db.getProductsByCompany(input.companyId);
      }),
    getAll: protectedProcedure
      .input(z.object({ includeInactive: z.boolean().optional() }))
      .query(async ({ ctx, input }) => {
        // Get company from context or first company
        const companyId = 1; // TODO: Get from ctx.user.companyId
        return await db.getAllProductsByCompany(companyId, input.includeInactive);
      }),
    listByCategory: protectedProcedure
      .input(z.object({ companyId: z.number(), categoryId: z.number() }))
      .query(async ({ input }) => {
        return await db.getProductsByCategory(input.companyId, input.categoryId);
      }),
    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          description: z.string().optional(),
          price: z.number(),
          categoryId: z.number(),
          image: z.string().optional(),
          productionSector: z.string().optional(),
          preparationTime: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const companyId = 1; // TODO: Get from ctx.user.companyId
        const id = await db.createProduct({
          companyId,
          name: input.name,
          price: input.price.toFixed(2),
          categoryId: input.categoryId || null,
          description: input.description || null,
          image: input.image || null,
          isActive: true,
          productionSector: input.productionSector || null,
          preparationTime: input.preparationTime || 15,
        });
        return { id };
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          description: z.string().optional(),
          price: z.number().optional(),
          categoryId: z.number().optional(),
          image: z.string().optional(),
          productionSector: z.string().optional(),
          preparationTime: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const updateData: any = { ...data };
        if (data.price !== undefined) {
          updateData.price = data.price.toFixed(2);
        }
        await db.updateProduct(id, updateData);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        await db.deleteProduct(input);
        return { success: true };
      }),
  }),

  // ==================== ORDERS ====================
  orders: router({
    create: protectedProcedure
      .input(
        z.object({
          companyId: z.number(),
          type: z.enum(["dine_in", "delivery", "takeout"]),
          tableId: z.number().optional(),
          customerName: z.string().optional(),
          customerPhone: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const orderNumber = `#${Date.now().toString().slice(-6)}`;
        const id = await db.createOrder({
          companyId: input.companyId,
          orderNumber,
          type: input.type,
          tableId: input.tableId || null,
          waiterId: ctx.user.id,
          customerName: input.customerName || null,
          customerPhone: input.customerPhone || null,
          status: "open",
          subtotal: "0.00",
          serviceCharge: "0.00",
          discount: "0.00",
          total: "0.00",
          notes: null,
          deliveryOrderId: null,
          closedAt: null,
        });
        return { id, orderNumber };
      }),
    getById: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => {
        return await db.getOrderById(input.orderId);
      }),
    list: protectedProcedure
      .input(z.object({ companyId: z.number(), status: z.string().optional() }))
      .query(async ({ input }) => {
        return await db.getOrdersByCompany(input.companyId, input.status);
      }),
    updateStatus: protectedProcedure
      .input(z.object({ orderId: z.number(), status: z.string() }))
      .mutation(async ({ input }) => {
        await db.updateOrderStatus(input.orderId, input.status);
        return { success: true };
      }),
    updateTotal: protectedProcedure
      .input(
        z.object({
          orderId: z.number(),
          subtotal: z.string(),
          total: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        await db.updateOrderTotal(input.orderId, input.subtotal, input.total);
        return { success: true };
      }),
    close: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ input }) => {
        await db.closeOrder(input.orderId);
        return { success: true };
      }),
  }),

  // ==================== ORDER ITEMS ====================
  orderItems: router({
    add: protectedProcedure
      .input(
        z.object({
          orderId: z.number(),
          productId: z.number(),
          quantity: z.number(),
          unitPrice: z.string(),
          notes: z.string().optional(),
          productionSector: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const subtotal = (parseFloat(input.unitPrice) * input.quantity).toFixed(2);
        const id = await db.addOrderItem({
          orderId: input.orderId,
          productId: input.productId,
          quantity: input.quantity,
          unitPrice: input.unitPrice,
          subtotal,
          notes: input.notes || null,
          status: "pending",
          productionSector: input.productionSector || null,
        });
        return { id };
      }),
    list: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => {
        return await db.getOrderItems(input.orderId);
      }),
    updateStatus: protectedProcedure
      .input(z.object({ itemId: z.number(), status: z.string() }))
      .mutation(async ({ input }) => {
        await db.updateOrderItemStatus(input.itemId, input.status);
        return { success: true };
      }),
  }),

  // ==================== PAYMENT METHODS ====================
  paymentMethods: router({
    list: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPaymentMethodsByCompany(input.companyId);
      }),
  }),

  // ==================== PAYMENTS ====================
  payments: router({
    add: protectedProcedure
      .input(
        z.object({
          orderId: z.number(),
          paymentMethodId: z.number(),
          amount: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const id = await db.addPayment({
          orderId: input.orderId,
          paymentMethodId: input.paymentMethodId,
          amount: input.amount,
        });
        return { id };
      }),
    list: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPaymentsByOrder(input.orderId);
      }),
  }),

  // ==================== CASH REGISTER ====================
  cashRegister: router({
    open: protectedProcedure
      .input(
        z.object({
          companyId: z.number(),
          openingAmount: z.string(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await db.openCashRegister({
          companyId: input.companyId,
          userId: ctx.user.id,
          openingAmount: input.openingAmount,
          closingAmount: null,
          expectedAmount: null,
          difference: null,
          status: "open",
          notes: input.notes || null,
        });
        return { id };
      }),
    getActive: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getActiveCashRegister(input.companyId, ctx.user.id);
      }),
    close: protectedProcedure
      .input(
        z.object({
          registerId: z.number(),
          closingAmount: z.string(),
          expectedAmount: z.string(),
          difference: z.string(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await db.closeCashRegister(
          input.registerId,
          input.closingAmount,
          input.expectedAmount,
          input.difference,
          input.notes
        );
        return { success: true };
      }),
  }),

  // ==================== CASH MOVEMENTS ====================
  cashMovements: router({
    add: protectedProcedure
      .input(
        z.object({
          cashRegisterId: z.number(),
          type: z.enum(["withdrawal", "deposit"]),
          amount: z.string(),
          reason: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await db.addCashMovement({
          cashRegisterId: input.cashRegisterId,
          type: input.type,
          amount: input.amount,
          reason: input.reason,
          userId: ctx.user.id,
        });
        return { id };
      }),
    list: protectedProcedure
      .input(z.object({ registerId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCashMovements(input.registerId);
      }),
  }),

  // ==================== BILL SPLITS ====================
  billSplits: router({
    create: protectedProcedure
      .input(
        z.object({
          orderId: z.number(),
          numberOfPeople: z.number(),
          amountPerPerson: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const id = await db.createBillSplit(
          input.orderId,
          input.numberOfPeople,
          input.amountPerPerson
        );
        return { id };
      }),
    get: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => {
        return await db.getBillSplit(input.orderId);
      }),
  }),

  // ==================== PRINTERS ====================
  printers: router({
    list: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPrintersByCompany(input.companyId);
      }),
    getBySector: protectedProcedure
      .input(z.object({ companyId: z.number(), sector: z.string() }))
      .query(async ({ input }) => {
        return await db.getPrinterBySector(input.companyId, input.sector);
      }),
  }),

  // ==================== DELIVERY REQUESTS ====================
  deliveryRequests: router({
    create: protectedProcedure
      .input(
        z.object({
          companyId: z.number(),
          orderId: z.number(),
          customerName: z.string(),
          customerPhone: z.string(),
          deliveryAddress: z.string(),
          deliveryFee: z.string(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const id = await db.createDeliveryRequest({
          companyId: input.companyId,
          orderId: input.orderId,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          deliveryAddress: input.deliveryAddress,
          deliveryFee: input.deliveryFee,
          status: "pending",
          deliveryPersonId: null,
          deliveryPersonName: null,
          notes: input.notes || null,
        });
        return { id };
      }),
    list: protectedProcedure
      .input(z.object({ companyId: z.number(), status: z.string().optional() }))
      .query(async ({ input }) => {
        return await db.getDeliveryRequestsByCompany(input.companyId, input.status);
      }),
    updateStatus: protectedProcedure
      .input(
        z.object({
          requestId: z.number(),
          status: z.string(),
          deliveryPersonId: z.number().optional(),
          deliveryPersonName: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await db.updateDeliveryRequestStatus(
          input.requestId,
          input.status,
          input.deliveryPersonId,
          input.deliveryPersonName
        );
        return { success: true };
      }),
    getById: protectedProcedure
      .input(z.object({ requestId: z.number() }))
      .query(async ({ input }) => {
        return await db.getDeliveryRequestById(input.requestId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
