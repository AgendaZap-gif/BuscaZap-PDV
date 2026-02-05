import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { getCompanyAuth } from "./AdminLogin";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Heart, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function SecretaryPlans() {
  const [, setLocation] = useLocation();
  const auth = getCompanyAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [quotaModalOpen, setQuotaModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<{ id: number; name: string; slug: string; color: string; defaultDurationMinutes: number } | null>(null);
  const [quotaPlanId, setQuotaPlanId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", color: "#3B82F6", defaultDurationMinutes: 30 });
  const [quotaForm, setQuotaForm] = useState({ week: 0, month: 0 });

  useEffect(() => {
    if (!auth) setLocation("/secretaria/agenda");
  }, [auth, setLocation]);

  const companyId = auth?.companyId ?? 0;
  const { data: plans = [], refetch: refetchPlans } = trpc.agenda.healthPlans.list.useQuery(
    { companyId },
    { enabled: !!companyId }
  );
  const { data: quotas = [], refetch: refetchQuotas } = trpc.agenda.quotas.list.useQuery(
    { companyId },
    { enabled: !!companyId }
  );
  const createPlan = trpc.agenda.healthPlans.create.useMutation({
    onSuccess: () => {
      toast.success("Plano criado.");
      refetchPlans();
      closeModal();
    },
    onError: (e) => toast.error(e.message),
  });
  const updatePlan = trpc.agenda.healthPlans.update.useMutation({
    onSuccess: () => {
      toast.success("Plano atualizado.");
      refetchPlans();
      closeModal();
    },
    onError: (e) => toast.error(e.message),
  });
  const deletePlan = trpc.agenda.healthPlans.delete.useMutation({
    onSuccess: () => {
      toast.success("Plano removido.");
      refetchPlans();
    },
    onError: (e) => toast.error(e.message),
  });
  const setQuota = trpc.agenda.quotas.set.useMutation({
    onError: (e) => toast.error(e.message),
  });

  const closeModal = () => {
    setModalOpen(false);
    setEditingPlan(null);
    setForm({ name: "", slug: "", color: "#3B82F6", defaultDurationMinutes: 30 });
  };

  const openQuota = (planId: number) => {
    const qWeek = quotas.find((q) => q.healthPlanId === planId && q.period === "week");
    const qMonth = quotas.find((q) => q.healthPlanId === planId && q.period === "month");
    setQuotaForm({
      week: qWeek?.maxSlots ?? 0,
      month: qMonth?.maxSlots ?? 0,
    });
    setQuotaPlanId(planId);
    setQuotaModalOpen(true);
  };

  const handleSaveQuota = async () => {
    if (quotaPlanId == null) return;
    try {
      await setQuota.mutateAsync({ companyId, healthPlanId: quotaPlanId, period: "week", maxSlots: quotaForm.week });
      await setQuota.mutateAsync({ companyId, healthPlanId: quotaPlanId, period: "month", maxSlots: quotaForm.month });
      toast.success("Vagas atualizadas.");
      refetchQuotas();
      setQuotaModalOpen(false);
      setQuotaPlanId(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar.");
    }
  };

  const getQuota = (planId: number, period: "week" | "month") =>
    quotas.find((q) => q.healthPlanId === planId && q.period === period)?.maxSlots ?? null;

  if (!auth) return null;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Planos de saúde</h1>
        <Button
          onClick={() => {
            setEditingPlan(null);
            setForm({ name: "", slug: "", color: "#3B82F6", defaultDurationMinutes: 30 });
            setModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo plano
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Planos e vagas por período
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Defina os planos (ex: Particular, Unimed) e quantas vagas cada um pode agendar por semana ou mês.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {plans.map((p) => (
            <div key={p.id} className="flex items-center justify-between border rounded-lg p-3">
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Consulta: {p.defaultDurationMinutes} min
                    {getQuota(p.id, "week") != null && ` • ${getQuota(p.id, "week")} vaga(s)/semana`}
                    {getQuota(p.id, "month") != null && ` • ${getQuota(p.id, "month")} vaga(s)/mês`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openQuota(p.id)}>
                  Vagas
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingPlan(p);
                    setForm({
                      name: p.name,
                      slug: p.slug,
                      color: p.color,
                      defaultDurationMinutes: p.defaultDurationMinutes,
                    });
                    setModalOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  onClick={() => {
                    if (confirm("Remover este plano?")) deletePlan.mutate({ companyId, id: p.id });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {plans.length === 0 && (
            <p className="text-muted-foreground text-center py-6">Cadastre planos (ex: Particular, Unimed).</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Editar plano" : "Novo plano"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") }))}
                placeholder="Ex: Unimed, Particular"
              />
            </div>
            <div>
              <Label>Slug (identificador)</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="unimed, particular"
              />
            </div>
            <div>
              <Label>Cor no calendário</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  className="w-12 h-9 p-1"
                />
                <Input value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Duração padrão da consulta (minutos)</Label>
              <Input
                type="number"
                min={10}
                max={120}
                value={form.defaultDurationMinutes}
                onChange={(e) => setForm((f) => ({ ...f, defaultDurationMinutes: parseInt(e.target.value, 10) || 30 }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>Cancelar</Button>
            <Button
              onClick={() => {
                if (!form.name || !form.slug) {
                  toast.error("Nome e slug são obrigatórios.");
                  return;
                }
                if (editingPlan) {
                  updatePlan.mutate({
                    companyId,
                    id: editingPlan.id,
                    name: form.name,
                    slug: form.slug,
                    color: form.color,
                    defaultDurationMinutes: form.defaultDurationMinutes,
                  });
                } else {
                  createPlan.mutate({
                    companyId,
                    name: form.name,
                    slug: form.slug,
                    color: form.color,
                    defaultDurationMinutes: form.defaultDurationMinutes,
                  });
                }
              }}
              disabled={createPlan.isPending || updatePlan.isPending}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={quotaModalOpen} onOpenChange={setQuotaModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vagas por período</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Quantas vagas este plano pode agendar por semana e por mês? (0 = ilimitado se não houver cota cadastrada)
            </p>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Vagas por semana</Label>
              <Input
                type="number"
                min={0}
                value={quotaForm.week}
                onChange={(e) => setQuotaForm((f) => ({ ...f, week: parseInt(e.target.value, 10) || 0 }))}
              />
            </div>
            <div>
              <Label>Vagas por mês</Label>
              <Input
                type="number"
                min={0}
                value={quotaForm.month}
                onChange={(e) => setQuotaForm((f) => ({ ...f, month: parseInt(e.target.value, 10) || 0 }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuotaModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveQuota} disabled={setQuota.isPending}>
              Salvar vagas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
