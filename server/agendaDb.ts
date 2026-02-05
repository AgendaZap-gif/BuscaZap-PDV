import { eq, and, gte, lte, sql } from "drizzle-orm";
import { getDb } from "./db.js";
import {
  agendaHealthPlans,
  agendaPatients,
  agendaAvailability,
  agendaQuotas,
  agendaAppointments,
  type InsertAgendaHealthPlan,
  type InsertAgendaPatient,
  type InsertAgendaAvailability,
  type InsertAgendaQuota,
  type InsertAgendaAppointment,
} from "../drizzle/schema.js";

// ==================== HEALTH PLANS ====================

export async function getAgendaHealthPlans(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agendaHealthPlans).where(eq(agendaHealthPlans.companyId, companyId));
}

export async function createAgendaHealthPlan(
  companyId: number,
  data: { name: string; slug: string; color?: string; defaultDurationMinutes?: number }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [row] = await db.insert(agendaHealthPlans).values({
    companyId,
    name: data.name,
    slug: data.slug,
    color: data.color ?? "#3B82F6",
    defaultDurationMinutes: data.defaultDurationMinutes ?? 30,
  });
  return row.insertId;
}

export async function updateAgendaHealthPlan(
  id: number,
  companyId: number,
  data: Partial<{ name: string; slug: string; color: string; isActive: boolean; defaultDurationMinutes: number }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(agendaHealthPlans)
    .set(data as Record<string, unknown>)
    .where(and(eq(agendaHealthPlans.id, id), eq(agendaHealthPlans.companyId, companyId)));
}

export async function deleteAgendaHealthPlan(id: number, companyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(agendaHealthPlans)
    .where(and(eq(agendaHealthPlans.id, id), eq(agendaHealthPlans.companyId, companyId)));
}

// ==================== PATIENTS ====================

export async function getAgendaPatients(companyId: number, search?: string) {
  const db = await getDb();
  if (!db) return [];
  if (search?.trim()) {
    const s = `%${search.trim()}%`;
    return db
      .select()
      .from(agendaPatients)
      .where(
        and(
          eq(agendaPatients.companyId, companyId),
          sql`(${agendaPatients.name} LIKE ${s} OR ${agendaPatients.phone} LIKE ${s} OR ${agendaPatients.email} LIKE ${s})`
        )
      );
  }
  return db.select().from(agendaPatients).where(eq(agendaPatients.companyId, companyId));
}

export async function getAgendaPatientById(id: number, companyId: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db
    .select()
    .from(agendaPatients)
    .where(and(eq(agendaPatients.id, id), eq(agendaPatients.companyId, companyId)));
  return row ?? null;
}

export async function getAgendaPatientByPhone(companyId: number, phone: string) {
  const db = await getDb();
  if (!db) return null;
  const normalized = phone.replace(/\D/g, "").slice(-11);
  const rows = await db.select().from(agendaPatients).where(eq(agendaPatients.companyId, companyId));
  return rows.find((p) => p.phone.replace(/\D/g, "").slice(-11) === normalized) ?? null;
}

export async function createAgendaPatient(
  companyId: number,
  data: {
    name: string;
    phone: string;
    email?: string;
    document?: string;
    birthDate?: string;
    healthPlanId?: number;
    address?: string;
    notes?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [row] = await db.insert(agendaPatients).values({
    companyId,
    name: data.name,
    phone: data.phone,
    email: data.email ?? null,
    document: data.document ?? null,
    birthDate: data.birthDate ?? null,
    healthPlanId: data.healthPlanId ?? null,
    address: data.address ?? null,
    notes: data.notes ?? null,
  });
  return row.insertId;
}

export async function updateAgendaPatient(
  id: number,
  companyId: number,
  data: Partial<InsertAgendaPatient>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const update: Record<string, unknown> = { ...data };
  delete update.id;
  delete update.companyId;
  delete update.createdAt;
  await db
    .update(agendaPatients)
    .set(update)
    .where(and(eq(agendaPatients.id, id), eq(agendaPatients.companyId, companyId)));
}

export async function deleteAgendaPatient(id: number, companyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(agendaPatients)
    .where(and(eq(agendaPatients.id, id), eq(agendaPatients.companyId, companyId)));
}

// ==================== AVAILABILITY ====================

export async function getAgendaAvailability(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agendaAvailability).where(eq(agendaAvailability.companyId, companyId));
}

export async function setAgendaAvailability(
  companyId: number,
  slots: Array<{ dayOfWeek: number; startTime: string; endTime: string; slotMinutes?: number }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(agendaAvailability).where(eq(agendaAvailability.companyId, companyId));
  if (slots.length === 0) return;
  await db.insert(agendaAvailability).values(
    slots.map((s) => ({
      companyId,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      slotMinutes: s.slotMinutes ?? 30,
    }))
  );
}

// ==================== QUOTAS ====================

export async function getAgendaQuotas(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agendaQuotas).where(eq(agendaQuotas.companyId, companyId));
}

export async function setAgendaQuota(
  companyId: number,
  healthPlanId: number,
  period: "week" | "month",
  maxSlots: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db
    .select()
    .from(agendaQuotas)
    .where(
      and(
        eq(agendaQuotas.companyId, companyId),
        eq(agendaQuotas.healthPlanId, healthPlanId),
        eq(agendaQuotas.period, period)
      )
    );
  if (existing.length > 0) {
    await db
      .update(agendaQuotas)
      .set({ maxSlots })
      .where(eq(agendaQuotas.id, existing[0].id));
  } else {
    await db.insert(agendaQuotas).values({ companyId, healthPlanId, period, maxSlots });
  }
}

export async function getAgendaQuotaForPlan(
  companyId: number,
  healthPlanId: number,
  period: "week" | "month"
): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db
    .select()
    .from(agendaQuotas)
    .where(
      and(
        eq(agendaQuotas.companyId, companyId),
        eq(agendaQuotas.healthPlanId, healthPlanId),
        eq(agendaQuotas.period, period)
      )
    );
  return row ? row.maxSlots : null;
}

/** Conta agendamentos ativos (não cancelados) do plano no período (semana ou mês) que contém a data. */
export async function countAgendaAppointmentsInPeriod(
  companyId: number,
  healthPlanId: number | null,
  period: "week" | "month",
  forDate: Date
): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  let start: Date;
  let end: Date;
  if (period === "week") {
    const d = new Date(forDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    start = new Date(d);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    end = new Date(start);
    end.setDate(end.getDate() + 7);
  } else {
    start = new Date(forDate.getFullYear(), forDate.getMonth(), 1);
    end = new Date(forDate.getFullYear(), forDate.getMonth() + 1, 1);
  }
  const conditions = [
    eq(agendaAppointments.companyId, companyId),
    gte(agendaAppointments.startAt, start),
    lte(agendaAppointments.startAt, end),
    sql`${agendaAppointments.status} != 'cancelled'`,
  ];
  if (healthPlanId != null) {
    conditions.push(eq(agendaAppointments.healthPlanId, healthPlanId));
  } else {
    conditions.push(sql`${agendaAppointments.healthPlanId} IS NULL`);
  }
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(agendaAppointments)
    .where(and(...conditions));
  return Number(rows[0]?.count ?? 0);
}

// ==================== APPOINTMENTS ====================

export async function getAgendaAppointmentsInRange(
  companyId: number,
  start: Date,
  end: Date
) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(agendaAppointments)
    .where(
      and(
        eq(agendaAppointments.companyId, companyId),
        gte(agendaAppointments.startAt, start),
        lte(agendaAppointments.startAt, end),
        sql`${agendaAppointments.status} != 'cancelled'`
      )
    );
  const patients = await getAgendaPatients(companyId);
  const plans = await getAgendaHealthPlans(companyId);
  return rows.map((r) => ({
    ...r,
    patient: patients.find((p) => p.id === r.patientId) ?? null,
    healthPlan: r.healthPlanId ? plans.find((p) => p.id === r.healthPlanId) ?? null : null,
  }));
}

export async function getAgendaAppointmentById(id: number, companyId: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db
    .select()
    .from(agendaAppointments)
    .where(and(eq(agendaAppointments.id, id), eq(agendaAppointments.companyId, companyId)));
  if (!row) return null;
  const patient = await getAgendaPatientById(row.patientId, companyId);
  const healthPlan = row.healthPlanId
    ? (await getAgendaHealthPlans(companyId)).find((p) => p.id === row.healthPlanId) ?? null
    : null;
  return { ...row, patient, healthPlan };
}

/** Para webhook de confirmação (SaleBot): busca por id sem filtrar company. */
export async function getAgendaAppointmentByIdOnly(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(agendaAppointments).where(eq(agendaAppointments.id, id));
  return row ?? null;
}

export async function createAgendaAppointment(
  companyId: number,
  data: {
    patientId: number;
    healthPlanId?: number | null;
    startAt: Date;
    endAt: Date;
    durationMinutes?: number;
    notes?: string;
  }
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [row] = await db.insert(agendaAppointments).values({
    companyId,
    patientId: data.patientId,
    healthPlanId: data.healthPlanId ?? null,
    startAt: data.startAt,
    endAt: data.endAt,
    durationMinutes: data.durationMinutes ?? 30,
    notes: data.notes ?? null,
  });
  return row.insertId;
}

export async function updateAgendaAppointmentStatus(
  id: number,
  companyId: number,
  status: "scheduled" | "confirmed" | "cancelled" | "completed" | "no_show",
  confirmedAt?: Date | null
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const set: Record<string, unknown> = { status };
  if (status === "confirmed" && confirmedAt) set.confirmedAt = confirmedAt;
  await db
    .update(agendaAppointments)
    .set(set)
    .where(and(eq(agendaAppointments.id, id), eq(agendaAppointments.companyId, companyId)));
}

export async function setAgendaAppointmentSalebotPendingId(
  id: number,
  companyId: number,
  salebotPendingId: string | null
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(agendaAppointments)
    .set({ salebotPendingId })
    .where(and(eq(agendaAppointments.id, id), eq(agendaAppointments.companyId, companyId)));
}

/** Gera slots disponíveis para um dia e opcionalmente filtrados por plano (respeitando quotas). */
export async function getAgendaAvailableSlots(
  companyId: number,
  date: Date,
  healthPlanId: number | null,
  durationMinutes: number = 30
): Promise<Array<{ start: Date; end: Date }>> {
  const db = await getDb();
  if (!db) return [];
  const availability = await getAgendaAvailability(companyId);
  const dayOfWeek = date.getDay();
  const daySlots = availability.filter((a) => a.dayOfWeek === dayOfWeek);
  if (daySlots.length === 0) return [];

  const slots: Array<{ start: Date; end: Date }> = [];
  const dateStr = date.toISOString().slice(0, 10);

  for (const av of daySlots) {
    const [sh, sm] = av.startTime.split(":").map(Number);
    const [eh, em] = av.endTime.split(":").map(Number);
    const slotMin = av.slotMinutes ?? 30;
    let min = sh * 60 + sm;
    const endMin = eh * 60 + em;
    while (min + slotMin <= endMin) {
      const start = new Date(`${dateStr}T${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}:00`);
      const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
      slots.push({ start, end });
      min += slotMin;
    }
  }

  const existing = await db
    .select()
    .from(agendaAppointments)
    .where(
      and(
        eq(agendaAppointments.companyId, companyId),
        gte(agendaAppointments.startAt, new Date(`${dateStr}T00:00:00`)),
        lte(agendaAppointments.startAt, new Date(`${dateStr}T23:59:59`)),
        sql`${agendaAppointments.status} != 'cancelled'`
      )
    );

  const now = new Date();
  const available = slots.filter((slot) => {
    const overlaps = existing.some(
      (e) =>
        (slot.start.getTime() >= new Date(e.startAt).getTime() && slot.start.getTime() < new Date(e.endAt).getTime()) ||
        (slot.end.getTime() > new Date(e.startAt).getTime() && slot.end.getTime() <= new Date(e.endAt).getTime()) ||
        (slot.start.getTime() <= new Date(e.startAt).getTime() && slot.end.getTime() >= new Date(e.endAt).getTime())
    );
    if (overlaps) return false;
    if (slot.start < now) return false;
    return true;
  });

  return available;
}

/** Verifica se pode agendar (quota por plano/semana ou mês). */
export async function checkAgendaQuotaBeforeBook(
  companyId: number,
  healthPlanId: number | null,
  startAt: Date
): Promise<{ allowed: boolean; reason?: string }> {
  if (healthPlanId == null) return { allowed: true };
  const quotaWeek = await getAgendaQuotaForPlan(companyId, healthPlanId, "week");
  const quotaMonth = await getAgendaQuotaForPlan(companyId, healthPlanId, "month");
  const usedWeek = await countAgendaAppointmentsInPeriod(companyId, healthPlanId, "week", startAt);
  const usedMonth = await countAgendaAppointmentsInPeriod(companyId, healthPlanId, "month", startAt);
  if (quotaWeek != null && usedWeek >= quotaWeek) return { allowed: false, reason: "Vagas para este plano nesta semana esgotadas." };
  if (quotaMonth != null && usedMonth >= quotaMonth) return { allowed: false, reason: "Vagas para este plano neste mês esgotadas." };
  return { allowed: true };
}
