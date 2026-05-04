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
        const normalizedEmail = user.email.toLowerCase().trim();
        console.log("[Auth] Step 2: Searching seller by normalized email:", normalizedEmail);
        seller = await db.getSellerByEmail(normalizedEmail);
        
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

      // 3) Se ainda não achar, buscar se esse usuário é dono de alguma empresa no banco compartilhado (companies)
      if (!seller) {
        console.log("[Auth] Step 3: Checking shared database companies...");
        
        // 3.1) Tentar por userId no banco principal
        let company = await db.getCompanyByUserId(user.id);
        
        // 3.2) Se não achar por userId, tentar por email no banco principal
        if (!company && user.email) {
          console.log("[Auth] Company not found by userId, trying email in companies table:", user.email);
          company = await db.getCompanyByEmail(user.email.toLowerCase().trim());
        }

        if (company) {
          console.log("[Auth] ✓ Found company in shared database:", company.id, "name:", company.name);
          console.log("[Auth] Creating automatic seller profile for user...");
          
          try {
            // Criar perfil de seller automaticamente baseado na empresa do site
            seller = await db.createSeller({
              userId: user.id,
              storeName: company.name,
              storeDescription: company.description || "",
              address: company.address || "",
              phone: company.phone || "",
              buscazapCompanyId: company.id,
              businessType: "commerce", // Padrão inicial
            });
            console.log("[Auth] ✓ Successfully created and linked automatic seller profile");
          } catch (createError) {
            console.error("[Auth] ✗ Failed to create automatic seller profile:", createError);
          }
        } else {
          console.log("[Auth] ✗ No company found in shared database for this user");
        }
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
