export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { DEFAULT_APP_DISPLAY_NAME } from "@shared/branding";

export function getAppDisplayName(): string {
  const v = import.meta.env.VITE_APP_DISPLAY_NAME;
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : DEFAULT_APP_DISPLAY_NAME;
}

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  if (typeof oauthPortalUrl !== "string" || !oauthPortalUrl.trim() || typeof appId !== "string" || !appId.trim()) {
    console.error(
      "[auth] Defina VITE_OAUTH_PORTAL_URL e VITE_APP_ID no ambiente (mesmo fluxo do app BuscaZap / portal OAuth)."
    );
    return `${window.location.origin}/`;
  }
  // Captura o ID da empresa da sessão para passar no state
  const buscazapCompanyId = window.sessionStorage.getItem("buscazap_company_id");
  const redirectUriBase = `${window.location.origin}/api/oauth/callback`;
  const redirectUri = buscazapCompanyId 
    ? `${redirectUriBase}?buscazap_company_id=${buscazapCompanyId}`
    : redirectUriBase;
  
  const state = btoa(redirectUri);

  // Alinhado com o fluxo do sitbusca: appId deve ser 'buscazap' para o portal reconhecer
  const finalAppId = appId.trim();
  
  const url = new URL(`${oauthPortalUrl.replace(/\/$/, "")}/app-auth`);
  url.searchParams.set("appId", finalAppId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  
  // O parâmetro 'type' é opcional mas ajuda no portal
  url.searchParams.set("type", "signIn");

  return url.toString();
};
