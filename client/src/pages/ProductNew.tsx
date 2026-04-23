import { useBusinessTypeConfig } from '@/contexts/BusinessTypeContext';
import { trpc } from '@/lib/trpc';
import { useLocation, useRoute } from 'wouter';
import ProductForm from '@/components/ProductForm';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductNew() {
  const config = useBusinessTypeConfig();
  const [, setLocation] = useLocation();
  const [isProductRoute, params] = useRoute('/products/:id/edit');

  const categoriesQuery = trpc.seller.getDefaultCategories.useQuery();
  // TODO: Create product mutation when implemented in routers

  const categories = categoriesQuery.data || [];
  const isEditMode = isProductRoute && params?.id;

  const handleSubmit = async (data: any) => {
    try {
      // TODO: Implement create/update product mutation
      toast.success(`${config.productLabel} salvo com sucesso!`);
      setLocation('/products');
    } catch (error) {
      toast.error(`Erro ao salvar ${config.productLabel.toLowerCase()}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setLocation('/products')}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {isEditMode ? 'Editar' : 'Adicionar'} {config.productLabel}
              </h1>
              <p className="text-slate-600 mt-1">
                {isEditMode
                  ? `Atualize as informações do ${config.productLabel.toLowerCase()}`
                  : `Crie um novo ${config.productLabel.toLowerCase()}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Card className="p-8">
          <ProductForm
            categories={categories}
            onSubmit={handleSubmit}
            isLoading={false}
          />
        </Card>
      </div>
    </div>
  );
}
