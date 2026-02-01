import { getCompanyAuth } from "./AdminLogin";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminLeads() {
  const [, setLocation] = useLocation();
  const auth = getCompanyAuth();
  const companyId = auth?.companyId ?? 0;

  useEffect(() => {
    if (!auth) setLocation("/admin/login");
  }, [auth, setLocation]);

  const { data: leads, isLoading } = trpc.admin.getCrm.useQuery(
    { companyId, limit: 100 },
    { enabled: companyId > 0 }
  );

  if (!auth) return null;
  if (isLoading) return <div className="p-6">Carregando leads...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Leads</h2>
      <Card>
        <CardHeader>
          <CardTitle>Contatos do CRM</CardTitle>
          <p className="text-sm text-muted-foreground">Leads e clientes identificados pela IA</p>
        </CardHeader>
        <CardContent>
          {!leads?.length ? (
            <p className="text-muted-foreground">Nenhum lead ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Último contato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>{l.phone}</TableCell>
                    <TableCell>{l.name ?? "—"}</TableCell>
                    <TableCell>{l.leadScore ?? 0}</TableCell>
                    <TableCell>
                      {Array.isArray(l.tags) && (l.tags as string[]).length > 0
                        ? (l.tags as string[]).map((t) => <Badge key={t} className="mr-1">{t}</Badge>)
                        : "—"}
                    </TableCell>
                    <TableCell>{l.lastContactAt ? new Date(l.lastContactAt).toLocaleString("pt-BR") : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
