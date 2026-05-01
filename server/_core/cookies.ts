import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string | undefined) {
  if (!host) return false;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

function getParentDomain(hostname: string | undefined): string | undefined {
  if (!hostname || LOCAL_HOSTS.has(hostname) || isIpAddress(hostname)) {
    return undefined;
  }
  
  // Se estivermos no subdomínio pdv, usamos o domínio exato para evitar conflitos
  if (hostname.includes("pdv.")) {
    return hostname;
  }

  const parts = hostname.split(".");
  if (parts.length < 3) return undefined;
  const n = parts.length >= 4 ? 3 : 2;
  return "." + parts.slice(-n).join(".");
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const hostname = req.hostname;
  const domain = getParentDomain(hostname);
  const isSecure = isSecureRequest(req);

  return {
    domain,
    httpOnly: true,
    path: "/",
    sameSite: isSecure ? ("none" as const) : ("lax" as const),
    secure: isSecure,
  };
}
