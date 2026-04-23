/**
 * Business Type Definitions and Configurations
 * Defines all supported business types and their specific configurations
 */

export type BusinessType = 'commerce' | 'services' | 'restaurant';

export interface BusinessTypeConfig {
  type: BusinessType;
  label: string;
  description: string;
  icon: string;
  productLabel: string;
  productPlural: string;
  categoryLabel: string;
  hasInventory: boolean;
  hasScheduling: boolean;
  hasDelivery: boolean;
  hasPreparationTime: boolean;
  hasDuration: boolean;
  requiredFields: string[];
  optionalFields: string[];
  defaultCategories: string[];
}

export const BUSINESS_TYPE_CONFIGS: Record<BusinessType, BusinessTypeConfig> = {
  commerce: {
    type: 'commerce',
    label: 'Comércio',
    description: 'Loja de produtos físicos com gestão de estoque',
    icon: 'ShoppingCart',
    productLabel: 'Produto',
    productPlural: 'Produtos',
    categoryLabel: 'Categoria',
    hasInventory: true,
    hasScheduling: false,
    hasDelivery: true,
    hasPreparationTime: false,
    hasDuration: false,
    requiredFields: ['name', 'price', 'sku', 'category'],
    optionalFields: ['weight', 'length', 'width', 'height', 'cost', 'images'],
    defaultCategories: [
      'Eletrônicos',
      'Roupas e Acessórios',
      'Casa e Decoração',
      'Esportes',
      'Beleza e Higiene',
      'Livros e Mídia',
      'Outros',
    ],
  },
  services: {
    type: 'services',
    label: 'Serviços',
    description: 'Prestação de serviços com agendamento',
    icon: 'Briefcase',
    productLabel: 'Serviço',
    productPlural: 'Serviços',
    categoryLabel: 'Tipo de Serviço',
    hasInventory: false,
    hasScheduling: true,
    hasDelivery: false,
    hasPreparationTime: false,
    hasDuration: true,
    requiredFields: ['name', 'price', 'duration', 'category'],
    optionalFields: ['cost', 'images', 'description'],
    defaultCategories: [
      'Consultoria',
      'Design',
      'Desenvolvimento',
      'Marketing',
      'Contabilidade',
      'Limpeza',
      'Manutenção',
      'Outros',
    ],
  },
  restaurant: {
    type: 'restaurant',
    label: 'Restaurante',
    description: 'Restaurante com cardápio e delivery',
    icon: 'UtensilsCrossed',
    productLabel: 'Prato',
    productPlural: 'Cardápio',
    categoryLabel: 'Categoria do Cardápio',
    hasInventory: true,
    hasScheduling: false,
    hasDelivery: true,
    hasPreparationTime: true,
    hasDuration: false,
    requiredFields: ['name', 'price', 'preparationTime', 'category'],
    optionalFields: ['cost', 'images', 'description', 'weight'],
    defaultCategories: [
      'Entradas',
      'Pratos Principais',
      'Acompanhamentos',
      'Sobremesas',
      'Bebidas',
      'Bebidas Alcoólicas',
      'Café e Chás',
      'Outros',
    ],
  },
};

export function getBusinessTypeConfig(type: BusinessType): BusinessTypeConfig {
  return BUSINESS_TYPE_CONFIGS[type];
}

export function getBusinessTypeLabel(type: BusinessType): string {
  return BUSINESS_TYPE_CONFIGS[type].label;
}

export function getProductLabel(type: BusinessType): string {
  return BUSINESS_TYPE_CONFIGS[type].productLabel;
}

export function getProductPluralLabel(type: BusinessType): string {
  return BUSINESS_TYPE_CONFIGS[type].productPlural;
}

export function getCategoryLabel(type: BusinessType): string {
  return BUSINESS_TYPE_CONFIGS[type].categoryLabel;
}

export function getDefaultCategories(type: BusinessType): string[] {
  return BUSINESS_TYPE_CONFIGS[type].defaultCategories;
}
