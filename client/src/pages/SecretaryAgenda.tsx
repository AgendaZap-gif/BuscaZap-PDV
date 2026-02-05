import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { getCompanyAuth } from "./AdminLogin";
import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Send } from "lucide-react";
import { toast } from "sonner";

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = "Janeiro Fevereiro Março Abril Maio Junho Julho Agosto Setembro Outubro Novembro Dezembro".split(" ");

export default function SecretaryAgenda() {
  const [, setLocation] = useLocation();
  const auth = getCompanyAuth();
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; start: Date; end: Date } | null>(null);
  const [createPatientId, setCreatePatientId] = useState<string>("");
  const [createPlanId, setCreatePlanId] = useState<string>("");
  const [createNotes, setCreateNotes] = useState("");

  useEffect(() => {
    if (!auth) setLocation("/secretaria/agenda");
  }, [auth, setLocation]);

  const companyId = auth?.companyId ?? 0;
  const startOfMonth = useMemo(() => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [viewDate]);
  const endOfMonth = useMemo(() => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0, 23, 59, 59);
    return d;
  }, [viewDate]);

  const { data: appointments = [], refetch: refetchAppointments } = trpc.agenda.appointments.list.useQuery(
    { companyId, start: startOfMonth, end: endOfMonth },
    { enabled: !!companyId, refetchInterval: 30000 }
  );
  const { data: patients = [] } = trpc.agenda.patients.list.useQuery(
    { companyId },
    { enabled: !!companyId }
  );
  const { data: healthPlans = [] } = trpc.agenda.healthPlans.list.useQuery(
    { companyId },
    { enabled: !!companyId }
  );
  const createAppointment = trpc.agenda.appointments.create.useMutation({
    onSuccess: () => {
      toast.success("Agendamento criado.");
      refetchAppointments();
      setModalOpen(false);
      setSelectedSlot(null);
      setCreatePatientId("");
      setCreatePlanId("");
      setCreateNotes("");
    },
    onError: (e) => toast.error(e.message),
  });
  const sendConfirmation = trpc.agenda.appointments.sendConfirmation.useMutation({
    onSuccess: () => {
      toast.success("Mensagem de confirmação enviada ao paciente.");
      refetchAppointments();
    },
    onError: (e) => toast.error(e.message),
  });

  const calendarDays = useMemo(() => {
    const first = new Date(startOfMonth);
    const startDay = first.getDay();
    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const prevMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 0).getDate();
    const rows: Array<{ date: Date; isCurrentMonth: boolean; day: number }> = [];
    let day = 1;
    let prevDay = prevMonth - startDay + 1;
    for (let i = 0; i < 42; i++) {
      if (i < startDay) {
        const d = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, prevDay);
        rows.push({ date: d, isCurrentMonth: false, day: prevDay });
        prevDay++;
      } else if (day <= daysInMonth) {
        const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        rows.push({ date: d, isCurrentMonth: true, day });
        day++;
      } else {
        const d = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, day - daysInMonth);
        rows.push({ date: d, isCurrentMonth: false, day: day - daysInMonth });
        day++;
      }
    }
    return rows;
  }, [startOfMonth, viewDate]);

  const appointmentsByDay = useMemo(() => {
    const map: Record<string, typeof appointments> = {};
    for (const a of appointments) {
      const key = new Date(a.startAt).toISOString().slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(a);
    }
    for (const k of Object.keys(map)) {
      map[k].sort((x, y) => new Date(x.startAt).getTime() - new Date(y.startAt).getTime());
    }
    return map;
  }, [appointments]);

  const openCreateModal = (date: Date, start: Date, end: Date) => {
    setSelectedSlot({ date, start, end });
    setModalOpen(true);
  };

  const handleCreateAppointment = () => {
    if (!selectedSlot || !createPatientId) {
      toast.error("Selecione o paciente.");
      return;
    }
    createAppointment.mutate({
      companyId,
      patientId: parseInt(createPatientId, 10),
      healthPlanId: createPlanId ? parseInt(createPlanId, 10) : null,
      startAt: selectedSlot.start,
      endAt: selectedSlot.end,
      notes: createNotes || undefined,
    });
  };

  if (!auth) return null;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[180px] text-center font-medium">
            {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
          </span>
          <Button variant="outline" size="icon" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Legenda por plano */}
      {healthPlans.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-4">
          {healthPlans.map((p) => (
            <span key={p.id} className="flex items-center gap-1.5 text-sm">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
              {p.name}
            </span>
          ))}
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="w-3 h-3 rounded-full bg-gray-400" />
            Particular
          </span>
        </div>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-muted-foreground mb-2">
            {DAY_NAMES.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((cell, i) => {
              const key = cell.date.toISOString().slice(0, 10);
              const dayAppointments = appointmentsByDay[key] ?? [];
              return (
                <div
                  key={i}
                  className={`min-h-[100px] border rounded-md p-1.5 ${
                    cell.isCurrentMonth ? "bg-background" : "bg-muted/30"
                  }`}
                >
                  <div className={`text-sm font-medium ${cell.isCurrentMonth ? "" : "text-muted-foreground"}`}>
                    {cell.day}
                  </div>
                  <div className="space-y-1 mt-1">
                    {dayAppointments.map((apt) => {
                      const patient = apt.patient;
                      const plan = apt.healthPlan;
                      const color = plan?.color ?? "#6b7280";
                      return (
                        <TooltipProvider key={apt.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="text-xs rounded px-1.5 py-0.5 truncate border-l-2 cursor-default"
                                style={{ borderLeftColor: color, backgroundColor: `${color}20` }}
                              >
                                {new Date(apt.startAt).toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}{" "}
                                {patient?.name ?? "—"}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs">
                              <p className="font-medium">{patient?.name}</p>
                              <p className="text-muted-foreground">{patient?.phone}</p>
                              {patient?.email && <p className="text-muted-foreground">{patient.email}</p>}
                              <p className="text-xs mt-1">{plan?.name ?? "Particular"}</p>
                              <Button
                                size="sm"
                                variant="outline"
                                className="mt-2 w-full"
                                onClick={() => {
                                  const base = window.location.origin;
                                  sendConfirmation.mutate({ companyId, id: apt.id, baseUrl: base });
                                }}
                                disabled={sendConfirmation.isPending}
                              >
                                <Send className="h-3 w-3 mr-1" />
                                Enviar confirmação
                              </Button>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                    {cell.isCurrentMonth && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-6 text-xs text-muted-foreground"
                        onClick={() => {
                          const d = cell.date;
                          const start = new Date(d);
                          start.setHours(8, 0, 0, 0);
                          const end = new Date(start);
                          end.setMinutes(end.getMinutes() + 30);
                          openCreateModal(d, start, end);
                        }}
                      >
                        <Plus className="h-3 w-3 mr-0.5" />
                        Agendar
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo agendamento</DialogTitle>
          </DialogHeader>
          {selectedSlot && (
            <p className="text-sm text-muted-foreground">
              {selectedSlot.start.toLocaleString("pt-BR", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </p>
          )}
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Paciente</label>
              <Select value={createPatientId} onValueChange={setCreatePatientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name} — {p.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Plano</label>
              <Select value={createPlanId} onValueChange={setCreatePlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Particular ou plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Particular</SelectItem>
                  {healthPlans.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Observações (opcional)</label>
              <input
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={createNotes}
                onChange={(e) => setCreateNotes(e.target.value)}
                placeholder="Ex: retorno"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateAppointment} disabled={createAppointment.isPending}>
              Agendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
