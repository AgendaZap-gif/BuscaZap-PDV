export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL for Google OAuth
export const getLoginUrl = () => {
  const redirectUri = window.location.pathname !== "/" 
    ? window.location.pathname 
    : "/";
  
  return `/api/oauth/login?redirect=${encodeURIComponent(redirectUri)}`;
};
