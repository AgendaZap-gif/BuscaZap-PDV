import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const COMPANY_TOKEN_KEY = "buscazap_company_token";
const COMPANY_ID_KEY = "buscazap_company_id";

export function setCompanyAuth(token: string, companyId: number) {
  localStorage.setItem(COMPANY_TOKEN_KEY, token);
  localStorage.setItem(COMPANY_ID_KEY, String(companyId));
}

export function getCompanyAuth(): { token: string; companyId: number } | null {
  const token = localStorage.getItem(COMPANY_TOKEN_KEY);
  const companyId = localStorage.getItem(COMPANY_ID_KEY);
  if (!token || !companyId) return null;
  return { token, companyId: parseInt(companyId, 10) };
}

export function clearCompanyAuth() {
  localStorage.removeItem(COMPANY_TOKEN_KEY);
  localStorage.removeItem(COMPANY_ID_KEY);
}

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");

  const loginMutation = trpc.companyAuth.login.useMutation({
    onSuccess: (data) => {
      setCompanyAuth(data.token, data.companyId);
      toast({ title: "Entrou!", description: "Redirecionando ao painel." });
      setLocation("/admin");
    },
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const registerMutation = trpc.companyAuth.register.useMutation({
    onSuccess: (data) => {
      setCompanyAuth(data.token, data.companyId);
      toast({ title: "Conta criada!", description: "Redirecionando ao painel." });
      setLocation("/admin");
    },
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister) {
      if (!name.trim()) {
        toast({ title: "Nome obrigatório", variant: "destructive" });
        return;
      }
      registerMutation.mutate({ name: name.trim(), email: email.trim(), password });
    } else {
      loginMutation.mutate({ email: email.trim(), password });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>BuscaZap IA — Painel</CardTitle>
          <p className="text-sm text-muted-foreground">
            {isRegister ? "Criar conta da empresa" : "Entrar com e-mail e senha"}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="text-sm font-medium">Nome da empresa</label>
                <Input
                  placeholder="Minha Empresa"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium">E-mail</label>
              <Input
                type="email"
                placeholder="empresa@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Senha</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loginMutation.isPending || registerMutation.isPending}>
              {isRegister ? "Criar conta" : "Entrar"}
            </Button>
            <button
              type="button"
              className="w-full text-sm text-muted-foreground hover:underline"
              onClick={() => setIsRegister(!isRegister)}
            >
              {isRegister ? "Já tenho conta" : "Criar conta"}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
