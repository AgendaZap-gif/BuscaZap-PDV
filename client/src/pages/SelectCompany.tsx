import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Building2, Search, ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

const DEBOUNCE_MS = 300;

export default function SelectCompany() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search]);

  const { data: companies = [], isLoading: searchLoading } = trpc.companies.list.useQuery(
    { search: debouncedSearch },
    { enabled: debouncedSearch.length >= 2 }
  );

  const utils = trpc.useUtils();
  const selectCompanyMutation = trpc.auth.selectCompany.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      setLocation("/");
    },
  });

  const handleSelect = (companyId: number) => {
    selectCompanyMutation.mutate({ companyId });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Faça login</CardTitle>
            <CardDescription>É preciso estar logado para selecionar uma empresa.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/")}>Voltar ao início</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user?.role !== "admin_global") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso restrito</CardTitle>
            <CardDescription>
              Apenas administradores globais podem acessar a seleção de empresas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => setLocation("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-2xl mx-auto">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => setLocation("/")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Selecionar empresa
          </CardTitle>
          <CardDescription>
            Pesquise pelo nome da empresa para não carregar todas de uma vez. Digite ao menos 2 caracteres.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome da empresa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          {debouncedSearch.length > 0 && debouncedSearch.length < 2 && (
            <p className="text-sm text-muted-foreground">Digite ao menos 2 caracteres para buscar.</p>
          )}

          {searchLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {!searchLoading && debouncedSearch.length >= 2 && (
            <ul className="space-y-2">
              {companies.length === 0 ? (
                <li className="text-sm text-muted-foreground py-4 text-center">
                  Nenhuma empresa encontrada para &quot;{debouncedSearch}&quot;.
                </li>
              ) : (
                companies.map((company) => (
                  <li key={company.id}>
                    <Button
                      variant="outline"
                      className="w-full justify-start h-auto py-3 px-4"
                      onClick={() => handleSelect(company.id)}
                      disabled={selectCompanyMutation.isPending}
                    >
                      <Building2 className="mr-3 h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="font-medium">{company.name}</span>
                      {company.address && (
                        <span className="ml-2 text-muted-foreground text-sm truncate max-w-[200px]">
                          — {company.address}
                        </span>
                      )}
                    </Button>
                  </li>
                ))
              )}
            </ul>
          )}

          {!searchLoading && debouncedSearch.length < 2 && debouncedSearch.length === 0 && search.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Digite o nome da empresa no campo acima para listar os resultados.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
