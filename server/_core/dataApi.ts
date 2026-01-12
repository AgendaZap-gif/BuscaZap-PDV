/**
 * Data API - DISABLED
 * 
 * This module was previously using Manus Forge API.
 * To re-enable, integrate with your preferred API service.
 * 
 * Original backup: dataApi.ts.backup
 */

export interface DataApiCallOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

export async function callDataApi(
  servicePath: string,
  options: DataApiCallOptions = {}
): Promise<unknown> {
  throw new Error("Data API is disabled. Please integrate with your preferred API service.");
}
