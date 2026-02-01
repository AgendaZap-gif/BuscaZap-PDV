/**
 * Grupos WhatsApp automáticos - Graph API (Cloud API).
 * Cria grupo para escalar conversa para humano (cliente + empresa).
 */

import axios from "axios";
import { ENV } from "./env.js";

const GRAPH_BASE = "https://graph.facebook.com/v21.0";

export function isWhatsAppGroupsConfigured(): boolean {
  return Boolean(ENV.whatsappToken?.trim() && ENV.whatsappPhoneId?.trim());
}

/**
 * Cria um grupo no WhatsApp Business (Cloud API).
 * participants: array de números no formato 5511999999999 (sem +).
 * subject: nome do grupo (ex.: "Atendimento Humano - Pedido #123").
 */
export async function createGroup(
  participants: string[],
  subject: string
): Promise<{ id?: string; error?: string }> {
  if (!isWhatsAppGroupsConfigured()) {
    return { error: "WHATSAPP_TOKEN e WHATSAPP_PHONE_ID (ou PHONE_ID) não configurados." };
  }
  try {
    const res = await axios.post(
      `${GRAPH_BASE}/${ENV.whatsappPhoneId}/groups`,
      {
        subject,
        participants: participants.map((p) => p.replace(/\D/g, "").replace(/^0/, "55")),
      },
      {
        headers: {
          Authorization: `Bearer ${ENV.whatsappToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    return { id: (res.data as { id?: string }).id };
  } catch (err: unknown) {
    const message = axios.isAxiosError(err) ? (err.response?.data as { error?: { message?: string } })?.error?.message ?? err.message : String(err);
    return { error: message };
  }
}

/**
 * Cria grupo de atendimento humano: cliente + número da empresa.
 */
export async function createHumanSupportGroup(
  customerPhone: string,
  companyPhone: string,
  orderOrContext?: string
): Promise<{ id?: string; error?: string }> {
  const subject = orderOrContext ? `Atendimento - ${orderOrContext}` : "Atendimento Humano";
  return createGroup([customerPhone, companyPhone], subject);
}
