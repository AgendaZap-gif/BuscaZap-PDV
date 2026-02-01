export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';

// ============================================
// Plan Constants
// ============================================

export const PLAN_TYPES = {
  FREE: 'free',
  BASICO: 'basico',
  DESTAQUE: 'destaque',
  PREMIUM: 'premium',
  ENTERPRISE: 'enterprise',
} as const;

export type PlanType = (typeof PLAN_TYPES)[keyof typeof PLAN_TYPES];

export const PLAN_TYPE_VALUES = ['free', 'basico', 'destaque', 'premium', 'enterprise'] as const;

// Plans that have AI chat access
export const AI_ENABLED_PLANS: PlanType[] = ['destaque', 'premium', 'enterprise'];

// Plans that have WhatsApp access
export const WHATSAPP_ENABLED_PLANS: PlanType[] = ['destaque', 'premium', 'enterprise'];

// Message limits per plan
export const PLAN_MESSAGE_LIMITS: Record<PlanType, number> = {
  free: 50,
  basico: 200,
  destaque: 2000,
  premium: 10000,
  enterprise: 50000,
};

// Plan features
export const PLAN_FEATURES: Record<PlanType, {
  aiChat: boolean;
  whatsapp: boolean;
  crm: boolean;
  analytics: boolean;
  knowledgeBase: boolean;
  multiUser: boolean;
  proactiveMessages: boolean;
  customBranding: boolean;
}> = {
  free: {
    aiChat: false,
    whatsapp: false,
    crm: false,
    analytics: false,
    knowledgeBase: false,
    multiUser: false,
    proactiveMessages: false,
    customBranding: false,
  },
  basico: {
    aiChat: false,
    whatsapp: false,
    crm: true,
    analytics: true,
    knowledgeBase: false,
    multiUser: false,
    proactiveMessages: false,
    customBranding: false,
  },
  destaque: {
    aiChat: true,
    whatsapp: true,
    crm: true,
    analytics: true,
    knowledgeBase: true,
    multiUser: true,
    proactiveMessages: true,
    customBranding: false,
  },
  premium: {
    aiChat: true,
    whatsapp: true,
    crm: true,
    analytics: true,
    knowledgeBase: true,
    multiUser: true,
    proactiveMessages: true,
    customBranding: true,
  },
  enterprise: {
    aiChat: true,
    whatsapp: true,
    crm: true,
    analytics: true,
    knowledgeBase: true,
    multiUser: true,
    proactiveMessages: true,
    customBranding: true,
  },
};

// ============================================
// CRM Constants
// ============================================

export const DEFAULT_CRM_TAGS = [
  { name: 'cliente_quente', color: '#EF4444', description: 'Cliente com alta intenção de compra', isAutomatic: true },
  { name: 'orcamento', color: '#F59E0B', description: 'Solicitou orçamento', isAutomatic: true },
  { name: 'duvida', color: '#3B82F6', description: 'Tem dúvidas sobre produtos/serviços', isAutomatic: true },
  { name: 'recorrente', color: '#10B981', description: 'Cliente que compra regularmente', isAutomatic: true },
  { name: 'suporte', color: '#8B5CF6', description: 'Precisa de suporte técnico', isAutomatic: true },
  { name: 'reclamacao', color: '#DC2626', description: 'Fez uma reclamação', isAutomatic: true },
  { name: 'promocao', color: '#EC4899', description: 'Interessado em promoções', isAutomatic: true },
  { name: 'vip', color: '#F97316', description: 'Cliente VIP', isAutomatic: false },
] as const;

// Lead score thresholds
export const LEAD_SCORE_THRESHOLDS = {
  COLD: 30,
  WARM: 50,
  HOT: 70,
} as const;

// ============================================
// AI Constants
// ============================================

export const AI_PERSONALITIES = {
  professional: 'Profissional e objetivo',
  friendly: 'Amigável e acolhedor',
  casual: 'Casual e descontraído',
  formal: 'Formal e respeitoso',
} as const;

export const AI_ESCALATION_TRIGGERS = [
  'falar com humano',
  'falar com atendente',
  'quero falar com alguem',
  'pessoa real',
  'atendimento humano',
  'chamar gerente',
  'reclamacao',
  'cancelar',
  'reembolso',
  'devolucao',
] as const;
