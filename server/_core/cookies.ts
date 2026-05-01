import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string | undefined) {
  if (!host) return false;
  // Basic IPv4 check and IPv6 presence detection.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

/**
 * Extrai o domínio pai para compartilhamento de cookies entre subdomínios.
 * Ex: "pdv.buscazapbrasil.com.br" -> ".buscazapbrasil.com.br"
 */
function getParentDomain(hostname: string | undefined): string | undefined {
  if (!hostname || LOCAL_HOSTS.has(hostname) || isIpAddress(hostname)) {
    return undefined;
  }

  const parts = hostname.split(".");
  if (parts.length < 3) return undefined;

  // Para domínios como .com.br, usa as últimas 3 partes. Caso contrário, as últimas 2.
  const n = parts.length >= 4 ? 3 : 2;
  return "." + parts.slice(-n).join(".");
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const hostname = req.hostname;
  const domain = getParentDomain(hostname);
  const isSecure = isSecureRequest(req);

  // Navegadores rejeitam SameSite=None sem Secure=true.
  // Usamos Lax para ambientes não-HTTPS (dev ou proxies mal configurados).
  const options = {
    domain,
    httpOnly: true,
    path: "/",
    sameSite: isSecure ? ("none" as const) : ("lax" as const),
    secure: isSecure,
  };

  console.log(`[Cookie] Options:`, { ...options, hostname, isSecure });

  return options;
}
