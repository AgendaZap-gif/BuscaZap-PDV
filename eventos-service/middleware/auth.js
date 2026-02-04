import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "eventos-admin-secret-change-in-production";

/**
 * Verifica JWT e coloca admin em req.admin.
 * req.admin = { id, email, role, eventoId }
 */
export function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Token ausente" });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.admin = {
      id: payload.id,
      email: payload.email,
      role: payload.role || "produtor",
      eventoId: payload.eventoId ?? null,
    };
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }
}

/**
 * Só master pode acessar. Produtor retorna 403.
 */
export function requireMaster(req, res, next) {
  if (req.admin?.role !== "master") {
    return res.status(403).json({ error: "Acesso restrito a administrador master" });
  }
  next();
}

/**
 * Master pode tudo. Produtor só pode acessar recurso do seu evento (evento_id).
 * Uso: requireAdmin, depois requireEventoAccess quando o eventoId vem em req.params.id
 */
export function requireEventoAccess(req, res, next) {
  if (req.admin?.role === "master") return next();
  const eventoId = parseInt(req.params.id ?? req.params.eventoId, 10);
  if (req.admin?.eventoId === eventoId) return next();
  return res.status(403).json({ error: "Sem permissão para este evento" });
}

export { JWT_SECRET };
