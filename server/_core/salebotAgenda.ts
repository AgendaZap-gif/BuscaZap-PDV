import { ENV } from "./env.js";
import * as agendaDb from "../agendaDb.js";

const SEND_CONFIRMATION_PATH = "/api/buscazap/send-confirmation";

export async function sendAppointmentConfirmation(
  appointmentId: number,
  companyId: number,
  patientPhone: string,
  message: string,
  baseUrl: string
): Promise<{ success: boolean; error?: string }> {
  const url = ENV.salebotApiUrl?.trim();
  if (!url) {
    return { success: false, error: "SALEBOT_API_URL não configurado." };
  }
  const callbackUrl = `${baseUrl.replace(/\/$/, "")}/api/agenda/confirmation-webhook`;
  const body = {
    patient_phone: patientPhone.replace(/\D/g, "").replace(/^0/, "55"),
    message,
    appointment_id: appointmentId,
    callback_url: callbackUrl,
    callback_secret: ENV.agendaWebhookSecret || undefined,
  };
  try {
    const res = await fetch(`${url}${SEND_CONFIRMATION_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
    if (!res.ok) {
      return { success: false, error: data.error || res.statusText };
    }
    if (data.success && typeof (data as { data?: { id?: string } }).data?.id === "string") {
      await agendaDb.setAgendaAppointmentSalebotPendingId(
        appointmentId,
        companyId,
        (data as { data: { id: string } }).data.id
      );
    }
    return { success: true };
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    return { success: false, error: err };
  }
}

export async function handleConfirmationWebhook(payload: {
  appointment_id: number;
  status: string;
  patient_reply?: string;
  secret?: string;
}): Promise<{ ok: boolean }> {
  if (ENV.agendaWebhookSecret && payload.secret !== ENV.agendaWebhookSecret) {
    return { ok: false };
  }
  const appointmentId = payload.appointment_id;
  const status = payload.status === "confirmed" ? "confirmed" : payload.status === "cancelled" ? "cancelled" : null;
  if (!status) return { ok: true };
  const app = await agendaDb.getAgendaAppointmentByIdOnly(appointmentId);
  if (!app) return { ok: true };
  await agendaDb.updateAgendaAppointmentStatus(
    appointmentId,
    app.companyId,
    status,
    status === "confirmed" ? new Date() : undefined
  );
  return { ok: true };
}
