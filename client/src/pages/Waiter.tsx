import { PageNav } from "@/components/PageNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Plus } from "lucide-react";

export default function Waiter() {
  const companyId = 1;

  const { data: tables } = trpc.tables.list.useQuery({ companyId });

  return (
    <div className="min-h-screen bg-gray-50">
      <PageNav title="Modo Garçom" backPath="/" />
      <div className="container py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tables?.filter(t => t.status === "occupied").map((table) => (
            <Card key={table.id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="py-6 text-center">
                <div className="text-3xl font-bold mb-2">{table.number}</div>
                <Button size="sm" variant="outline" className="w-full">
                  <Plus className="w-3 h-3 mr-1" />
                  Adicionar Item
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
