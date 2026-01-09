import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock context for testing
const mockContext: TrpcContext = {
  user: null,
  req: {} as any,
  res: {} as any,
};

describe("Plan Verification", () => {
  const caller = appRouter.createCaller(mockContext);

  it("should return false for non-existent user", async () => {
    const result = await caller.plan.checkPlan({ userId: "99999" });
    expect(result.hasActivePlan).toBe(false);
    expect(result.message).toBe("Usuário não encontrado");
  });

  it("should return correct structure for plan check", async () => {
    const result = await caller.plan.checkPlan({ userId: "1" });
    expect(result).toHaveProperty("hasActivePlan");
    expect(result).toHaveProperty("planType");
    expect(result).toHaveProperty("planExpiresAt");
    expect(result).toHaveProperty("message");
    expect(typeof result.hasActivePlan).toBe("boolean");
  });
});
