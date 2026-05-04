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
  const utils = trpc.useUtils();
  
  const createMutation = trpc.products.create.useMutation({
    onSuccess: () => {
      toast.success(`${config.productLabel} criado com sucesso!`);
      utils.seller.getProducts.invalidate();
      setLocation('/products');
    },
    onError: (error) => {
      toast.error(`Erro ao criar ${config.productLabel.toLowerCase()}: ${error.message}`);
    }
  });

  const updateMutation = trpc.products.update.useMutation({
    onSuccess: () => {
      toast.success(`${config.productLabel} atualizado com sucesso!`);
      utils.seller.getProducts.invalidate();
      setLocation('/products');
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar ${config.productLabel.toLowerCase()}: ${error.message}`);
    }
  });

  const categories = categoriesQuery.data || [];
  const isEditMode = isProductRoute && params?.id;
  const productId = isEditMode ? parseInt(params.id) : null;

  // No modo edição, buscar os produtos do vendedor e encontrar o correto
  const productsQuery = trpc.seller.getProducts.useQuery(undefined, {
    enabled: !!isEditMode
  });
  
  const initialData = isEditMode && productsQuery.data 
    ? productsQuery.data.find(p => p.id === productId)
    : null;

  const handleSubmit = async (data: any) => {
    if (isEditMode && productId) {
      updateMutation.mutate({
        productId,
        ...data
      });
    } else {
      createMutation.mutate(data);
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
            isLoading={createMutation.isPending || updateMutation.isPending}
            initialData={initialData}
          />
        </Card>
      </div>
    </div>
  );
}
