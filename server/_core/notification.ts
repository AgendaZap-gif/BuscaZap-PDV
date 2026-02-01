/**
 * Notificações para o dono da empresa (WhatsApp, push, etc.).
 * Se WHATSAPP_TOKEN e PHONE_ID estiverem configurados, envia via WhatsApp Cloud API.
 */

import axios from "axios";
import { ENV } from "./env.js";

export interface NotificationPayload {
  title: string;
  content: string;
  userId?: string;
}

export interface NotifyOwnerPayload {
  companyId: number;
  title: string;
  content: string;
  /** Telefone do dono (opcional; se não passar, tenta buscar da empresa). */
  ownerPhone?: string;
}

function isWhatsAppConfigured(): boolean {
  return Boolean(ENV.whatsappToken?.trim() && ENV.whatsappPhoneId?.trim());
}

/**
 * Envia notificação para o dono da empresa.
 * Se ownerPhone ou company.phone estiver disponível e WhatsApp configurado, envia mensagem.
 */
export async function notifyOwner(payload: NotifyOwnerPayload): Promise<boolean> {
  const { companyId, title, content, ownerPhone } = payload;
  const phone = ownerPhone ?? await getCompanyPhone(companyId);
  if (!phone) {
    console.warn("[Notification] notifyOwner: no phone for company", companyId);
    return false;
  }
  if (!isWhatsAppConfigured()) {
    console.warn("[Notification] notifyOwner: WhatsApp not configured. Would send:", { title, content, phone });
    return false;
  }
  try {
    const normalized = phone.replace(/\D/g, "").replace(/^0/, "55");
    await axios.post(
      `https://graph.facebook.com/v21.0/${ENV.whatsappPhoneId}/messages`,
      {
        messaging_product: "whatsapp",
        to: normalized,
        type: "text",
        text: { body: `${title}\n\n${content}` },
      },
      {
        headers: {
          Authorization: `Bearer ${ENV.whatsappToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    return true;
  } catch (err) {
    console.warn("[Notification] notifyOwner failed:", err);
    return false;
  }
}

async function getCompanyPhone(companyId: number): Promise<string | null> {
  try {
    const db = await import("../db.js");
    const company = await db.getCompanyById(companyId);
    return company?.phone ?? null;
  } catch {
    return null;
  }
}

export async function sendNotification(payload: NotificationPayload): Promise<void> {
  throw new Error("Push notifications are disabled. Use notifyOwner for company notifications.");
}
