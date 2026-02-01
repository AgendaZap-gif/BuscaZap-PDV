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
  // Gemini (cérebro BuscaZap — mesmo que no app principal)
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "models/gemini-2.5-flash",
  geminiFallbackModel: process.env.GEMINI_FALLBACK_MODEL ?? "models/gemini-2.5-pro",
};
