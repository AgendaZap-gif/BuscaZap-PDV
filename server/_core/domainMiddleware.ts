/**
 * White label - detectar empresa por domínio (req.headers.host).
 */

import * as db from "../db.js";
import { companies } from "../../drizzle/schema.js";
import { eq } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      companyIdByDomain?: number;
    }
  }
}

export async function detectCompanyByDomain(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const host = req.headers.host?.split(":")[0] ?? "";
  if (!host) {
    next();
    return;
  }
  const drizzleDb = await db.getDb();
  if (!drizzleDb) {
    next();
    return;
  }
  const rows = await drizzleDb.select({ id: companies.id }).from(companies).where(eq(companies.domain, host)).limit(1);
  if (rows.length > 0) {
    req.companyIdByDomain = rows[0].id;
  }
  next();
}
