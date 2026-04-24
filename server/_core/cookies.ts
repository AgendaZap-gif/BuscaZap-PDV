import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
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

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  // Em produção (Railway), sempre usar secure=true para HTTPS
  // sameSite: "none" é necessário para cross-domain (OAuth callback)
  const isSecure = process.env.NODE_ENV === "production" || isSecureRequest(req);

  // Não definir domain - deixa o navegador usar o domínio padrão da requisição
  // domain explícito pode causar problemas em alguns navegadores
  const options = {
    httpOnly: true,
    path: "/",
    sameSite: "none" as const,
    secure: isSecure, // Deve ser true para sameSite: "none" funcionar
  };

  console.log(`[Cookie] Options:`, { ...options, hostname: req.hostname, isSecure });

  return options;
}
