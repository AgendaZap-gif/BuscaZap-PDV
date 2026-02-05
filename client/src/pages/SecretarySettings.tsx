import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { getCompanyAuth } from "./AdminLogin";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Settings } from "lucide-react";
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

export default function SecretarySettings() {
  const [, setLocation] = useLocation();
  const auth = getCompanyAuth();
  const [slots, setSlots] = useState<Array<{ dayOfWeek: number; startTime: string; endTime: string; slotMinutes: number }>>([]);

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
      setSlots(
        availability.map((a) => ({
          dayOfWeek: a.dayOfWeek,
          startTime: a.startTime,
          endTime: a.endTime,
          slotMinutes: a.slotMinutes ?? 30,
        }))
      );
    } else {
      setSlots(
        DAYS.map((d) => ({
          dayOfWeek: d.value,
          startTime: "08:00",
          endTime: "18:00",
          slotMinutes: 30,
        }))
      );
    }
  }, [availability]);

  const updateSlot = (dayOfWeek: number, field: "startTime" | "endTime" | "slotMinutes", value: string | number) => {
    setSlots((prev) => {
      const idx = prev.findIndex((s) => s.dayOfWeek === dayOfWeek);
      const next = [...prev];
      if (idx >= 0) {
        next[idx] = { ...next[idx], [field]: value };
      } else {
        next.push({
          dayOfWeek,
          startTime: "08:00",
          endTime: "18:00",
          slotMinutes: 30,
          [field]: value,
        } as (typeof next)[0]);
      }
      return next.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
    });
  };

  const handleSave = () => {
    const toSave = slots.filter((s) => s.startTime && s.endTime);
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
            Defina em quais dias e horários há vagas para agendamento. O tempo de cada consulta pode ser definido por plano em Planos de saúde.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {DAYS.map((d) => {
            const slot = slots.find((s) => s.dayOfWeek === d.value) ?? {
              dayOfWeek: d.value,
              startTime: "08:00",
              endTime: "18:00",
              slotMinutes: 30,
            };
            return (
              <div key={d.value} className="flex items-center gap-4 flex-wrap border rounded-lg p-3">
                <span className="w-24 font-medium">{d.label}</span>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Das</Label>
                  <Input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => updateSlot(d.value, "startTime", e.target.value)}
                    className="w-28"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">às</Label>
                  <Input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => updateSlot(d.value, "endTime", e.target.value)}
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
                    onChange={(e) => updateSlot(d.value, "slotMinutes", parseInt(e.target.value, 10) || 30)}
                    className="w-20"
                  />
                </div>
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
