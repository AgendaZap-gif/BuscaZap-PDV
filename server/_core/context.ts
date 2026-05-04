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
      console.log("[Auth] ========== Resolving Seller for User ==========");
      console.log("[Auth] User ID:", user.id, "Email:", user.email);
      
      // 1) Tentar achar seller vinculado pelo userId (vínculo direto)
      console.log("[Auth] Step 1: Searching seller by userId:", user.id);
      seller = await db.getSellerByUserId(user.id);
      if (seller) {
        console.log("[Auth] ✓ Found seller by userId:", seller.id, "storeName:", seller.storeName);
      } else {
        console.log("[Auth] ✗ No seller found by userId");
      }

      // 2) Se não achar por userId, tentar por email (fallback - padrão sitbusca)
      if (!seller && user.email) {
        console.log("[Auth] Step 2: Searching seller by email:", user.email);
        seller = await db.getSellerByEmail(user.email);
        
        if (seller) {
          console.log("[Auth] ✓ Found seller by email:", seller.id, "storeName:", seller.storeName);
          console.log("[Auth] Linking seller to user ID:", user.id);
          
          // Importante: atualizar o vínculo para que o próximo login seja por userId
          try {
            await db.updateSeller(seller.id, { userId: user.id });
            console.log("[Auth] ✓ Successfully linked seller to user");
          } catch (linkError) {
            console.error("[Auth] ✗ Failed to link seller to user:", linkError);
            // Continuar mesmo se falhar o link, o seller foi encontrado
          }
        } else {
          console.log("[Auth] ✗ No seller found by email");
        }
      }

      // 3) Se ainda não achar, tenta buscar se esse usuário é dono de alguma empresa no banco compartilhado
      // No sitbusca, a tabela companies tem um campo userId
      if (!seller && user.email) {
        console.log("[Auth] Step 3: Checking shared database companies for email:", user.email);
        // Implementar busca na tabela companies se necessário, mas por enquanto vamos focar no e-mail do seller
        console.log("[Auth] ℹ️ Shared database lookup not yet implemented for this version");
      }

      if (seller) {
        console.log("[Auth] ✓ Final seller resolved:", seller.id, "storeName:", seller.storeName);
      } else {
        console.log("[Auth] ℹ️ No seller found for this user - user may need to create/link a seller");
      }
      console.log("[Auth] ========== Seller Resolution Complete ==========");
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    console.error("[Auth] Error during context creation:", error);
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    seller,
  };
}
