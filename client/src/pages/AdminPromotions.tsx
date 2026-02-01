import { useState } from "react";
import { getCompanyAuth } from "./AdminLogin";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function AdminPromotions() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const auth = getCompanyAuth();
  const companyId = auth?.companyId ?? 0;
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!auth) setLocation("/admin/login");
  }, [auth, setLocation]);

  const sendMutation = trpc.admin.promotionsSend.useMutation({
    onSuccess: (data) => {
      toast({ title: "Promoção enviada", description: `${data.sent} clientes na fila para receber.` });
      setMessage("");
    },
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast({ title: "Digite a mensagem", variant: "destructive" });
      return;
    }
    sendMutation.mutate({ companyId, message: message.trim() });
  };

  if (!auth) return null;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Promoções</h2>
      <Card>
        <CardHeader>
          <CardTitle>Enviar mensagem em massa</CardTitle>
          <p className="text-sm text-muted-foreground">
            Mensagem será enviada para clientes ativos (últimos 90 dias). Respeite o horário e evite spam.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSend} className="space-y-4">
            <Textarea
              placeholder="Digite a mensagem promocional..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[120px]"
            />
            <Button type="submit" disabled={sendMutation.isPending}>
              {sendMutation.isPending ? "Enviando..." : "Enviar para clientes ativos"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
