import { describe, expect, it } from "vitest";
import { BUSINESS_TYPE_CONFIGS, getBusinessTypeConfig, getDefaultCategories } from "@shared/businessTypes";

describe("Business Type Configurations", () => {
  it("should have all required business types", () => {
    expect(BUSINESS_TYPE_CONFIGS).toHaveProperty("commerce");
    expect(BUSINESS_TYPE_CONFIGS).toHaveProperty("services");
    expect(BUSINESS_TYPE_CONFIGS).toHaveProperty("restaurant");
  });

  it("should have correct config structure for commerce", () => {
    const config = getBusinessTypeConfig("commerce");
    expect(config.type).toBe("commerce");
    expect(config.hasInventory).toBe(true);
    expect(config.hasScheduling).toBe(false);
    expect(config.hasDelivery).toBe(true);
    expect(config.productLabel).toBe("Produto");
  });

  it("should have correct config structure for services", () => {
    const config = getBusinessTypeConfig("services");
    expect(config.type).toBe("services");
    expect(config.hasInventory).toBe(false);
    expect(config.hasScheduling).toBe(true);
    expect(config.hasDuration).toBe(true);
    expect(config.productLabel).toBe("Serviço");
  });

  it("should have correct config structure for restaurant", () => {
    const config = getBusinessTypeConfig("restaurant");
    expect(config.type).toBe("restaurant");
    expect(config.hasInventory).toBe(true);
    expect(config.hasDelivery).toBe(true);
    expect(config.hasPreparationTime).toBe(true);
    expect(config.productLabel).toBe("Prato");
  });

  it("should return default categories for each business type", () => {
    const commerceCategories = getDefaultCategories("commerce");
    expect(commerceCategories).toContain("Eletrônicos");
    expect(commerceCategories).toContain("Roupas e Acessórios");

    const serviceCategories = getDefaultCategories("services");
    expect(serviceCategories).toContain("Consultoria");
    expect(serviceCategories).toContain("Design");

    const restaurantCategories = getDefaultCategories("restaurant");
    expect(restaurantCategories).toContain("Entradas");
    expect(restaurantCategories).toContain("Pratos Principais");
  });

  it("should have required fields for each business type", () => {
    const commerceConfig = getBusinessTypeConfig("commerce");
    expect(commerceConfig.requiredFields).toContain("name");
    expect(commerceConfig.requiredFields).toContain("price");
    expect(commerceConfig.requiredFields).toContain("sku");

    const serviceConfig = getBusinessTypeConfig("services");
    expect(serviceConfig.requiredFields).toContain("duration");

    const restaurantConfig = getBusinessTypeConfig("restaurant");
    expect(restaurantConfig.requiredFields).toContain("preparationTime");
  });
});
