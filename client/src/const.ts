export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL for Google OAuth
export const getLoginUrl = () => {
  const redirectUri = window.location.pathname !== "/" 
    ? window.location.pathname 
    : "/";
  
  return `/api/oauth/login?redirect=${encodeURIComponent(redirectUri)}`;
};

/** URL do site BuscaZap Brasil (app/site). Usado para abrir a área da secretária no site. Configure VITE_SITE_URL no .env se necessário. */
export const SITE_BASE_URL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SITE_URL) ||
  "https://buscazapbrasil.com.br";

/** Abre a página de login/agenda da secretária no site BuscaZap Brasil (gerencimento pela web). */
export const getSiteSecretariaUrl = () => `${SITE_BASE_URL}/secretaria/agenda`;
