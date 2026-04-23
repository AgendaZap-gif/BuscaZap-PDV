import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getSellerByUserId, createSeller, updateSellerBusinessType, getProductsBySellerIdWithStock, getCustomersBySellerIdWithStats, getOrdersBySellerIdWithItems, getOrderById, getOrderItemsByOrderId, updateOrderStatus, getStockBySellerIdWithProducts, getTransactionsBySellerIdForReports, createProduct, updateProduct, deleteProduct, getProductById, updateProductBuscazapMenuItemId, getPedijaOrdersBySellerIdWithStatus, updatePedijaOrderStatus } from "./db";
import { BUSINESS_TYPE_CONFIGS, BusinessType, getDefaultCategories } from "@shared/businessTypes";
import { syncCreateMenuItem, syncUpdateMenuItem, syncDeleteMenuItem, syncDeleteMenuItem as _syncDelete, updatePedijaOrderStatus as _pdvUpdate } from "./pedija-service";

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
  }),

  seller: router({
    // Get seller profile for current user
    profile: protectedProcedure.query(async ({ ctx }) => {
      const seller = await getSellerByUserId(ctx.user.id);
      if (!seller) {
        return null;
      }
      const config = BUSINESS_TYPE_CONFIGS[seller.businessType as BusinessType];
      return {
        ...seller,
        config,
      };
    }),

    // Create a new seller
    create: protectedProcedure
      .input(
        z.object({
          storeName: z.string().min(3, "Nome da loja deve ter pelo menos 3 caracteres"),
          storeDescription: z.string().optional(),
          businessType: z.enum(["commerce", "services", "restaurant"]),
          cnpj: z.string().optional(),
          phone: z.string().optional(),
          address: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zipCode: z.string().optional(),
          /** Vincula esta loja à empresa no app BuscaZap (cardápio Pedijà, PDV, agenda). */
          buscazapCompanyId: z.number().int().positive().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const existing = await getSellerByUserId(ctx.user.id);
        if (existing) {
          const config = BUSINESS_TYPE_CONFIGS[existing.businessType as BusinessType];
          return {
            ...existing,
            config,
          };
        }
        const seller = await createSeller({
          userId: ctx.user.id,
          ...input,
        });
        const config = BUSINESS_TYPE_CONFIGS[seller.businessType as BusinessType];
        return {
          ...seller,
          config,
        };
      }),

    // Update business type
    updateBusinessType: protectedProcedure
      .input(
        z.object({
          businessType: z.enum(["commerce", "services", "restaurant"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const seller = await getSellerByUserId(ctx.user.id);
        if (!seller) {
          throw new Error("Seller not found");
        }
        await updateSellerBusinessType(seller.id, input.businessType);
        const config = BUSINESS_TYPE_CONFIGS[input.businessType];
        return {
          success: true,
          businessType: input.businessType,
          config,
        };
      }),

    // Get business type configuration
    getConfig: protectedProcedure
      .input(z.enum(["commerce", "services", "restaurant"]).optional())
      .query(async ({ ctx, input }) => {
        let businessType = input;
        if (!businessType) {
          const seller = await getSellerByUserId(ctx.user.id);
          if (!seller) {
            throw new Error("Seller not found");
          }
          businessType = seller.businessType as BusinessType;
        }
        return BUSINESS_TYPE_CONFIGS[businessType];
      }),

    // Get default categories for business type
    getDefaultCategories: protectedProcedure
      .input(z.enum(["commerce", "services", "restaurant"]).optional())
      .query(async ({ ctx, input }) => {
        let businessType = input;
        if (!businessType) {
          const seller = await getSellerByUserId(ctx.user.id);
          if (!seller) {
            throw new Error("Seller not found");
          }
          businessType = seller.businessType as BusinessType;
        }
        return getDefaultCategories(businessType);
      }),

    // Get seller products
    getProducts: protectedProcedure.query(async ({ ctx }) => {
      const seller = await getSellerByUserId(ctx.user.id);
      if (!seller) {
        return [];
      }
      return getProductsBySellerIdWithStock(seller.id);
    }),
  }),

  // Products Router (restaurante: sincroniza cardápio com BuscaZap Pedijá)
  products: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const seller = await getSellerByUserId(ctx.user.id);
      if (!seller) return [];
      return getProductsBySellerIdWithStock(seller.id);
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          description: z.string().optional(),
          sku: z.string().min(1),
          price: z.string(),
          cost: z.string().optional(),
          category: z.string().optional(),
          imageUrl: z.string().optional(),
          isActive: z.number().optional(),
          preparationTime: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const seller = await getSellerByUserId(ctx.user.id);
        if (!seller) throw new Error("Seller not found");

        const result = await createProduct({
          sellerId: seller.id,
          name: input.name,
          description: input.description,
          sku: input.sku,
          price: input.price,
          cost: input.cost,
          category: input.category,
          images: input.imageUrl ? JSON.stringify([input.imageUrl]) : undefined,
          isActive: input.isActive ?? 1,
          preparationTime: input.preparationTime,
        });

        const productId = (result[0] as any)?.insertId as number | undefined;

        // Sync com Pedijá se for restaurante e tiver buscazapCompanyId
        if (seller.businessType === "restaurant" && seller.buscazapCompanyId && productId) {
          const menuItemId = await syncCreateMenuItem(seller.buscazapCompanyId, {
            name: input.name,
            description: input.description,
            price: input.price,
            imageUrl: input.imageUrl,
            isActive: input.isActive ?? 1,
          });
          if (menuItemId) {
            await updateProductBuscazapMenuItemId(productId, menuItemId);
          }
        }

        return { success: true, id: productId };
      }),

    update: protectedProcedure
      .input(
        z.object({
          productId: z.number(),
          name: z.string().optional(),
          description: z.string().optional(),
          price: z.string().optional(),
          cost: z.string().optional(),
          category: z.string().optional(),
          imageUrl: z.string().optional(),
          isActive: z.number().optional(),
          preparationTime: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const seller = await getSellerByUserId(ctx.user.id);
        if (!seller) throw new Error("Seller not found");

        const { productId, ...fields } = input;
        const updateData: Record<string, unknown> = {};
        if (fields.name !== undefined) updateData.name = fields.name;
        if (fields.description !== undefined) updateData.description = fields.description;
        if (fields.price !== undefined) updateData.price = fields.price;
        if (fields.cost !== undefined) updateData.cost = fields.cost;
        if (fields.category !== undefined) updateData.category = fields.category;
        if (fields.imageUrl !== undefined) updateData.images = JSON.stringify([fields.imageUrl]);
        if (fields.isActive !== undefined) updateData.isActive = fields.isActive;
        if (fields.preparationTime !== undefined) updateData.preparationTime = fields.preparationTime;

        await updateProduct(productId, updateData as any);

        // Sync com Pedijá
        if (seller.businessType === "restaurant" && seller.buscazapCompanyId) {
          const product = await getProductById(productId);
          const menuItemId = (product as any)?.buscazapMenuItemId;
          if (menuItemId) {
            await syncUpdateMenuItem(seller.buscazapCompanyId, menuItemId, {
              name: fields.name,
              description: fields.description,
              price: fields.price,
              imageUrl: fields.imageUrl,
              isActive: fields.isActive,
            });
          }
        }

        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const seller = await getSellerByUserId(ctx.user.id);
        if (!seller) throw new Error("Seller not found");

        // Sync com Pedijá antes de deletar
        if (seller.businessType === "restaurant" && seller.buscazapCompanyId) {
          const product = await getProductById(input.productId);
          const menuItemId = (product as any)?.buscazapMenuItemId;
          if (menuItemId) {
            await syncDeleteMenuItem(seller.buscazapCompanyId, menuItemId);
          }
        }

        await deleteProduct(input.productId);
        return { success: true };
      }),
  }),

  // Pedija Router — pedidos recebidos do BuscaZap Pedijá
  pedija: router({
    orders: router({
      list: protectedProcedure
        .input(z.object({ status: z.string().optional() }).optional())
        .query(async ({ ctx, input }) => {
          const seller = await getSellerByUserId(ctx.user.id);
          if (!seller) return [];
          return getPedijaOrdersBySellerIdWithStatus(seller.id, input?.status);
        }),

      updateStatus: protectedProcedure
        .input(
          z.object({
            orderId: z.number(),
            status: z.enum(["pending", "confirmed", "preparing", "delivering", "delivered", "cancelled"]),
          })
        )
        .mutation(async ({ ctx, input }) => {
          const seller = await getSellerByUserId(ctx.user.id);
          if (!seller) throw new Error("Seller not found");

          await updatePedijaOrderStatus(input.orderId, input.status);

          // Propagar status de volta ao BuscaZap Pedijá
          if (seller.buscazapCompanyId) {
            const orders = await getPedijaOrdersBySellerIdWithStatus(seller.id);
            const order = orders.find((o) => o.id === input.orderId);
            if (order?.buscazapOrderId) {
              await _pdvUpdate(order.buscazapOrderId, input.status);
            }
          }

          return { success: true };
        }),
    }),
  }),

  // CRM Router
  crm: router({
    customers: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        const seller = await getSellerByUserId(ctx.user.id);
        if (!seller) {
          return [];
        }
        return getCustomersBySellerIdWithStats(seller.id);
      }),
    }),
  }),

  // Orders Router
  orders: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const seller = await getSellerByUserId(ctx.user.id);
      if (!seller) {
        return [];
      }
      return getOrdersBySellerIdWithItems(seller.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getOrderById(input.id);
      }),

    getItems: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => {
        return getOrderItemsByOrderId(input.orderId);
      }),

    updateStatus: protectedProcedure
      .input(z.object({ orderId: z.number(), status: z.string() }))
      .mutation(async ({ input }) => {
        await updateOrderStatus(input.orderId, input.status);
        return { success: true };
      }),
  }),

  // Stock Router
  stock: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const seller = await getSellerByUserId(ctx.user.id);
      if (!seller) {
        return [];
      }
      return getStockBySellerIdWithProducts(seller.id);
    }),
  }),

  // Reports Router
  reports: router({
    transactions: protectedProcedure.query(async ({ ctx }) => {
      const seller = await getSellerByUserId(ctx.user.id);
      if (!seller) {
        return [];
      }
      return getTransactionsBySellerIdForReports(seller.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
