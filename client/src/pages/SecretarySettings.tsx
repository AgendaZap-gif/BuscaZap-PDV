import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { getCompanyAuth } from "./AdminLogin";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Settings, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const DAYS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sábado" },
];

type Slot = { dayOfWeek: number; startTime: string; endTime: string; slotMinutes: number; id?: string };

export default function SecretarySettings() {
  const [, setLocation] = useLocation();
  const auth = getCompanyAuth();
  const [slots, setSlots] = useState<Slot[]>([]);

  useEffect(() => {
    if (!auth) setLocation("/secretaria/agenda");
  }, [auth, setLocation]);

  const companyId = auth?.companyId ?? 0;
  const { data: availability = [], refetch } = trpc.agenda.availability.list.useQuery(
    { companyId },
    { enabled: !!companyId }
  );
  const setAvailability = trpc.agenda.availability.set.useMutation({
    onSuccess: () => {
      toast.success("Disponibilidade salva.");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (availability.length > 0) {
      // Agrupar por dia da semana e criar IDs únicos
      setSlots(
        availability.map((a, idx) => ({
          dayOfWeek: a.dayOfWeek,
          startTime: a.startTime,
          endTime: a.endTime,
          slotMinutes: a.slotMinutes ?? 30,
          id: `${a.dayOfWeek}-${idx}`,
        }))
      );
    } else {
      // Inicializar com um turno por dia
      setSlots(
        DAYS.map((d) => ({
          dayOfWeek: d.value,
          startTime: "08:00",
          endTime: "18:00",
          slotMinutes: 30,
          id: `${d.value}-0`,
        }))
      );
    }
  }, [availability]);

  const getSlotsForDay = (dayOfWeek: number) => {
    return slots.filter((s) => s.dayOfWeek === dayOfWeek).sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const addSlot = (dayOfWeek: number) => {
    const daySlots = getSlotsForDay(dayOfWeek);
    const lastSlot = daySlots[daySlots.length - 1];
    const newStartTime = lastSlot ? lastSlot.endTime : "14:00";
    const newEndTime = lastSlot && lastSlot.endTime < "18:00" ? "18:00" : "22:00";
    
    const newSlot: Slot = {
      dayOfWeek,
      startTime: newStartTime,
      endTime: newEndTime,
      slotMinutes: 30,
      id: `${dayOfWeek}-${Date.now()}`,
    };
    setSlots((prev) => [...prev, newSlot].sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
      return a.startTime.localeCompare(b.startTime);
    }));
  };

  const removeSlot = (id: string) => {
    setSlots((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSlot = (id: string, field: "startTime" | "endTime" | "slotMinutes", value: string | number) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)).sort((a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
        return a.startTime.localeCompare(b.startTime);
      })
    );
  };

  const handleSave = () => {
    const toSave = slots
      .filter((s) => s.startTime && s.endTime)
      .map(({ id, ...rest }) => rest);
    setAvailability.mutate({ companyId, slots: toSave });
  };

  if (!auth) return null;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Disponibilidade</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Dias e horários para consulta
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Defina em quais dias e horários há vagas para agendamento. Você pode adicionar múltiplos turnos por dia (ex: manhã e tarde, excluindo horário de almoço). O tempo de cada consulta pode ser definido por plano em Planos de saúde.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {DAYS.map((d) => {
            const daySlots = getSlotsForDay(d.value);
            return (
              <div key={d.value} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{d.label}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addSlot(d.value)}
                    className="h-8"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Adicionar turno
                  </Button>
                </div>
                {daySlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Nenhum horário configurado para este dia</p>
                ) : (
                  <div className="space-y-2">
                    {daySlots.map((slot) => (
                      <div key={slot.id} className="flex items-center gap-4 flex-wrap bg-muted/30 rounded p-2">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Das</Label>
                          <Input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => updateSlot(slot.id!, "startTime", e.target.value)}
                            className="w-28"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">às</Label>
                          <Input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => updateSlot(slot.id!, "endTime", e.target.value)}
                            className="w-28"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Slot (min)</Label>
                          <Input
                            type="number"
                            min={10}
                            max={120}
                            value={slot.slotMinutes}
                            onChange={(e) => updateSlot(slot.id!, "slotMinutes", parseInt(e.target.value, 10) || 30)}
                            className="w-20"
                          />
                        </div>
                        {daySlots.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSlot(slot.id!)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <Button onClick={handleSave} disabled={setAvailability.isPending}>
            Salvar disponibilidade
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
