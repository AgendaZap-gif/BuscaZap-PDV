export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL for Google OAuth
export const getLoginUrl = () => {
  const redirectUri = window.location.pathname !== "/" 
    ? window.location.pathname 
    : "/";
  
  return `/api/oauth/login?redirect=${encodeURIComponent(redirectUri)}`;
};

/** URL base do PDV (mesma origem em produção). Usado para link da secretária; assim /secretaria/agenda é servido pelo próprio PDV e não depende do site www. */
export const getSiteSecretariaUrl = () => {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/secretaria/agenda`;
  }
  return "https://www.buscazapbrasil.com.br/secretaria/agenda";
};
