import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { verifyCompanyToken } from "./companyAuth.js";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  companyId: number | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let companyId: number | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    user = null;
  }

  const authHeader = opts.req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const payload = await verifyCompanyToken(token);
    if (payload) companyId = payload.companyId;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    companyId,
  };
}
