export const ENV = {
  appId: process.env.EXPO_PUBLIC_APP_ID ?? process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  publicApiUrl: process.env.PUBLIC_API_URL ?? process.env.EXPO_PUBLIC_API_BASE_URL ?? "",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  port: process.env.PORT ?? "8080",
  // Gemini (cérebro BuscaZap)
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "models/gemini-2.5-flash",
  geminiFallbackModel: process.env.GEMINI_FALLBACK_MODEL ?? "models/gemini-2.5-pro",
  // OpenAI (Whisper, embeddings)
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  // WhatsApp Cloud API (grupos, notificações)
  whatsappToken: process.env.WHATSAPP_TOKEN ?? process.env.WABA_TOKEN ?? "",
  whatsappPhoneId: process.env.WHATSAPP_PHONE_ID ?? process.env.PHONE_ID ?? "",
  // Stripe
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  stripePricePro: process.env.STRIPE_PRICE_PRO ?? "",
  stripePricePremium: process.env.STRIPE_PRICE_PREMIUM ?? "",
  // JWT para auth empresa (painel BuscaZap IA)
  companyJwtSecret: process.env.JWT_SECRET ?? process.env.COMPANY_JWT_SECRET ?? "buscazap-company-secret",
};
