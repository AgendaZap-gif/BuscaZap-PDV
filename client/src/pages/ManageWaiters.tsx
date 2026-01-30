import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, UserPlus, Trash2 } from "lucide-react";
import { useLocation } from "wouter";

export default function ManageWaiters() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [companyId] = useState<number>(1); // TODO: Pegar do contexto (SelectCompany)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const { data: waiters, isLoading, refetch } = trpc.waiters.list.useQuery({ companyId });

  const createWaiterMutation = trpc.waiters.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Garçom cadastrado",
        description: "Login e senha criados. O garçom pode entrar pelo app BuscaZap em Modo Garçom.",
      });
      setIsAddDialogOpen(false);
      setEmail("");
      setPassword("");
      setName("");
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Erro ao cadastrar garçom",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeWaiterMutation = trpc.waiters.remove.useMutation({
    onSuccess: () => {
      toast({
        title: "Garçom removido",
        description: "O garçom foi desvinculado da empresa.",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    if (!email.trim()) {
      toast({ title: "Email obrigatório", variant: "destructive" });
      return;
    }
    if (!password || password.length < 6) {
      toast({
        title: "Senha inválida",
        description: "Mínimo 6 caracteres",
        variant: "destructive",
      });
      return;
    }
    createWaiterMutation.mutate({
      companyId,
      email: email.trim().toLowerCase(),
      password,
      name: name.trim() || undefined,
    });
  };

  const handleRemove = (waiterId: number) => {
    if (!confirm("Desvincular este garçom da empresa? Ele não poderá mais acessar pelo app.")) return;
    removeWaiterMutation.mutate({ companyId, waiterId });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Gestão de Garçons</h1>
            <p className="text-sm text-muted-foreground">
              Crie login e senha para os garçons usarem no app BuscaZap (Modo Garçom)
            </p>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Garçons da empresa</CardTitle>
              <CardDescription>
                Cada garçom entra no app com o próprio email e senha. Os pedidos aparecem em tempo real no PDV.
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Novo garçom
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : waiters && waiters.length > 0 ? (
              <ul className="divide-y">
                {waiters.map((w) => (
                  <li key={w.id} className="py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{w.name || w.email}</p>
                      <p className="text-sm text-muted-foreground">{w.email}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(w.id)}
                      disabled={removeWaiterMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">
                Nenhum garçom cadastrado. Clique em &quot;Novo garçom&quot; para criar login e senha.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <strong>Como usar:</strong> O garçom abre o app BuscaZap, toca em &quot;Modo Garçom&quot;, faz login com o
          email e senha que você cadastrou. Os pedidos feitos no app aparecem em tempo real nesta página e na tela de
          cozinha.
        </div>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo garçom</DialogTitle>
            <DialogDescription>
              Crie um login e senha para o garçom acessar o app BuscaZap em Modo Garçom.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="name">Nome (opcional)</Label>
              <Input
                id="name"
                placeholder="Ex: João"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="garcom@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Senha * (mín. 6 caracteres)</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={createWaiterMutation.isPending}>
              {createWaiterMutation.isPending ? "Salvando..." : "Cadastrar garçom"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
