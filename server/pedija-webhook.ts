/**
 * Webhook receiver — recebe notificações do BuscaZap sobre novos pedidos Pedijá.
 *
 * O BuscaZap faz POST <PDV_WEBHOOK_URL> com header `x-buscazap-secret`.
 * O PDV_WEBHOOK_URL deve ser configurado no .env do BuscaZap como:
 *   PDV_WEBHOOK_URL=https://pdv.seudominio.com/api/pedija/webhook
 *
 * Variável de ambiente necessária no .env do PDV:
 *   PDV_API_SECRET   — segredo compartilhado (mesmo valor do BuscaZap)
 */

import { Router, Request, Response } from "express";
import { getSellerIdByBuscazapCompanyId, upsertPedijaOrder } from "./db";

const router = Router();

router.post("/webhook", async (req: Request, res: Response) => {
  // Responder rápido para não bloquear o BuscaZap
  res.status(200).json({ received: true });

  const secret = process.env.PDV_API_SECRET;
  if (secret) {
    const incoming = String(req.headers["x-buscazap-secret"] || "").trim();
    if (incoming !== secret) {
      console.warn("[Pedija Webhook] Secret inválido — payload ignorado.");
      return;
    }
  }

  const body = req.body as {
    event?: string;
    orderId?: number;
    companyId?: number;
    customerName?: string;
    total?: string;
    items?: Array<{ name?: string; quantity: number; price: string }>;
    createdAt?: string;
  };

  if (body.event !== "new_order") {
    console.log(`[Pedija Webhook] Evento ignorado: ${body.event}`);
    return;
  }

  const { orderId, companyId, customerName, total, items } = body;

  if (!orderId || !companyId || !total) {
    console.error("[Pedija Webhook] Payload inválido:", body);
    return;
  }

  try {
    const sellerId = await getSellerIdByBuscazapCompanyId(companyId);
    if (!sellerId) {
      console.warn(`[Pedija Webhook] Nenhum seller vinculado ao buscazapCompanyId=${companyId}`);
      return;
    }

    await upsertPedijaOrder({
      sellerId,
      buscazapOrderId: orderId,
      buscazapCompanyId: companyId,
      customerName: customerName ?? "Cliente",
      total: String(total),
      status: "pending",
      items: items ? JSON.stringify(items) : null,
    });

    // Notificar via Socket.io se disponível
    try {
      const io = (global as any).socketIO;
      if (io) {
        io.emit("pedija:new_order", {
          sellerId,
          orderId,
          companyId,
          customerName,
          total,
          items,
        });
      }
    } catch {
      // silencioso — Socket.io é opcional
    }

    console.log(`[Pedija Webhook] Pedido #${orderId} salvo para seller ${sellerId}`);
  } catch (err) {
    console.error("[Pedija Webhook] Erro ao processar pedido:", err);
  }
});

export default router;
