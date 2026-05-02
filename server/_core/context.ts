import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User, Seller } from "../../drizzle/schema";
import { sdk } from "./sdk";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  seller: Seller | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let seller: Seller | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
    if (user) {
      seller = await db.getSellerByUserId(user.id);

      // Se não achar por ID, tenta pelo e-mail (padrão sitbusca)
      if (!seller && user.email) {
        console.log("[Auth] Seller not found by ID, trying email:", user.email);
        seller = await db.getSellerByEmail(user.email);
        
        if (seller) {
          console.log("[Auth] Found seller by email, linking to user ID:", user.id);
          await db.updateSeller(seller.id, { userId: user.id });
        }
      }
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    seller,
  };
}
