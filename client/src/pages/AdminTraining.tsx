import { useState } from "react";
import { getCompanyAuth } from "./AdminLogin";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function AdminTraining() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const auth = getCompanyAuth();
  const companyId = auth?.companyId ?? 0;
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (!auth) setLocation("/admin/login");
  }, [auth, setLocation]);

  const trainMutation = trpc.admin.trainPdf.useMutation({
    onSuccess: () => {
      toast({ title: "Conteúdo adicionado", description: "A IA usará esse conteúdo nas respostas." });
      setTitle("");
      setContent("");
    },
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast({ title: "Título e conteúdo obrigatórios", variant: "destructive" });
      return;
    }
    trainMutation.mutate({ companyId, title: title.trim(), content: content.trim() });
  };

  if (!auth) return null;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Treinar IA</h2>
      <Card>
        <CardHeader>
          <CardTitle>Adicionar conhecimento</CardTitle>
          <p className="text-sm text-muted-foreground">
            Cole texto de cardápio, FAQ, site ou Instagram. A IA usará nas respostas aos clientes.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título (ex.: Cardápio, FAQ)</label>
              <Input
                placeholder="Cardápio - Pizzas"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Conteúdo</label>
              <Textarea
                placeholder="Cole aqui o texto extraído de PDF, site ou rede social..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="mt-1 min-h-[200px]"
              />
            </div>
            <Button type="submit" disabled={trainMutation.isPending}>
              {trainMutation.isPending ? "Salvando..." : "Enviar para a IA"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
