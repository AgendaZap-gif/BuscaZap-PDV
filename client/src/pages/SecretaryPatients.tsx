import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { getCompanyAuth } from "./AdminLogin";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Users, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function SecretaryPatients() {
  const [, setLocation] = useLocation();
  const auth = getCompanyAuth();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    document: "",
    birthDate: "",
    healthPlanId: "" as string | number | null,
    address: "",
    notes: "",
  });

  useEffect(() => {
    if (!auth) setLocation("/secretaria/agenda");
  }, [auth, setLocation]);

  const companyId = auth?.companyId ?? 0;
  const { data: patients = [], refetch } = trpc.agenda.patients.list.useQuery(
    { companyId, search: search || undefined },
    { enabled: !!companyId }
  );
  const { data: healthPlans = [] } = trpc.agenda.healthPlans.list.useQuery(
    { companyId },
    { enabled: !!companyId }
  );
  const createPatient = trpc.agenda.patients.create.useMutation({
    onSuccess: () => {
      toast.success("Paciente cadastrado.");
      refetch();
      closeModal();
    },
    onError: (e) => toast.error(e.message),
  });
  const updatePatient = trpc.agenda.patients.update.useMutation({
    onSuccess: () => {
      toast.success("Paciente atualizado.");
      refetch();
      closeModal();
    },
    onError: (e) => toast.error(e.message),
  });
  const deletePatient = trpc.agenda.patients.delete.useMutation({
    onSuccess: () => {
      toast.success("Paciente removido.");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm({
      name: "",
      phone: "",
      email: "",
      document: "",
      birthDate: "",
      healthPlanId: "",
      address: "",
      notes: "",
    });
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({
      name: "",
      phone: "",
      email: "",
      document: "",
      birthDate: "",
      healthPlanId: "",
      address: "",
      notes: "",
    });
    setModalOpen(true);
  };

  const openEdit = (p: {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    document: string | null;
    birthDate: string | null;
    healthPlanId: number | null;
    address: string | null;
    notes: string | null;
  }) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      phone: p.phone,
      email: p.email ?? "",
      document: p.document ?? "",
      birthDate: p.birthDate ?? "",
      healthPlanId: p.healthPlanId ?? "",
      address: p.address ?? "",
      notes: p.notes ?? "",
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Nome e telefone são obrigatórios.");
      return;
    }
    if (editingId != null) {
      updatePatient.mutate({
        companyId,
        id: editingId,
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        document: form.document || undefined,
        birthDate: form.birthDate || undefined,
        healthPlanId: form.healthPlanId ? parseInt(String(form.healthPlanId), 10) : null,
        address: form.address || undefined,
        notes: form.notes || undefined,
      });
    } else {
      createPatient.mutate({
        companyId,
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        document: form.document || undefined,
        birthDate: form.birthDate || undefined,
        healthPlanId: form.healthPlanId ? parseInt(String(form.healthPlanId), 10) : null,
        address: form.address || undefined,
        notes: form.notes || undefined,
      });
    }
  };

  if (!auth) return null;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Pacientes</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo paciente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Cadastro completo
          </CardTitle>
          <Input
            placeholder="Buscar por nome, telefone ou e-mail"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {patients.map((p) => {
              const plan = healthPlans.find((h) => h.id === p.healthPlanId);
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between border rounded-lg p-3"
                >
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-sm text-muted-foreground">{p.phone}</p>
                    {p.email && <p className="text-sm text-muted-foreground">{p.email}</p>}
                    {plan && <span className="text-xs" style={{ color: plan.color }}>{plan.name}</span>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                      onClick={() => {
                        if (confirm("Remover este paciente?")) deletePatient.mutate({ companyId, id: p.id });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {patients.length === 0 && (
              <p className="text-muted-foreground text-center py-8">Nenhum paciente cadastrado.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId != null ? "Editar paciente" : "Novo paciente"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <Label>Telefone *</Label>
              <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} required />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <Label>CPF / Documento</Label>
              <Input value={form.document} onChange={(e) => setForm((f) => ({ ...f, document: e.target.value }))} />
            </div>
            <div>
              <Label>Data de nascimento</Label>
              <Input type="date" value={form.birthDate} onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))} />
            </div>
            <div>
              <Label>Plano de saúde</Label>
              <Select value={form.healthPlanId ? String(form.healthPlanId) : "none"} onValueChange={(v) => setForm((f) => ({ ...f, healthPlanId: v === "none" ? "" : v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Particular" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Particular</SelectItem>
                  {healthPlans.map((h) => (
                    <SelectItem key={h.id} value={String(h.id)}>{h.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Endereço</Label>
              <Textarea value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} rows={2} />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>Cancelar</Button>
              <Button type="submit" disabled={createPatient.isPending || updatePatient.isPending}>
                {editingId != null ? "Salvar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
