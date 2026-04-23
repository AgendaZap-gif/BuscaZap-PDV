import { useBusinessTypeConfig } from '@/contexts/BusinessTypeContext';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, Edit2, Package } from 'lucide-react';
import { useLocation } from 'wouter';
import { useState } from 'react';
import { toast } from 'sonner';

export default function Products() {
  const config = useBusinessTypeConfig();
  const [, setLocation] = useLocation();

  const productsQuery = trpc.seller.getProducts.useQuery();
  const products = productsQuery.data || [];

  const handleAddProduct = () => {
    setLocation('/products/new');
  };

  const handleEditProduct = (productId: number) => {
    setLocation(`/products/${productId}/edit`);
  };

  const handleDeleteProduct = (productId: number) => {
    if (confirm(`Tem certeza que deseja deletar este ${config.productLabel.toLowerCase()}?`)) {
      toast.success(`${config.productLabel} deletado com sucesso!`);
      // TODO: Implement delete mutation
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {config.productPlural}
              </h1>
              <p className="text-slate-600 mt-1">
                Gerencie todos os seus {config.productPlural.toLowerCase()}
              </p>
            </div>
            <Button
              onClick={handleAddProduct}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar {config.productLabel}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex p-3 bg-slate-100 rounded-lg mb-4">
              <Package className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Nenhum {config.productLabel.toLowerCase()} cadastrado
            </h3>
            <p className="text-slate-600 mb-6">
              Comece adicionando seu primeiro {config.productLabel.toLowerCase()} para começar a vender.
            </p>
            <Button
              onClick={handleAddProduct}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar {config.productLabel}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Product Image Placeholder */}
                <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                  <Package className="w-12 h-12 text-blue-600" />
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 text-lg mb-1">
                    {product.name}
                  </h3>
                  <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                    {product.description || 'Sem descrição'}
                  </p>

                  {/* Product Details */}
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Preço:</span>
                      <span className="font-semibold text-slate-900">
                        R$ {parseFloat(product.price).toFixed(2)}
                      </span>
                    </div>

                    {product.category && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Categoria:</span>
                        <span className="text-slate-900">{product.category}</span>
                      </div>
                    )}

                    {config.type === 'commerce' && product.weight && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Peso:</span>
                        <span className="text-slate-900">{product.weight} kg</span>
                      </div>
                    )}

                    {config.type === 'services' && product.duration && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Duração:</span>
                        <span className="text-slate-900">{product.duration} min</span>
                      </div>
                    )}

                    {config.type === 'restaurant' && product.preparationTime && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Preparo:</span>
                        <span className="text-slate-900">{product.preparationTime} min</span>
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="mb-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        product.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {product.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEditProduct(product.id)}
                      variant="outline"
                      className="flex-1"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      onClick={() => handleDeleteProduct(product.id)}
                      variant="outline"
                      className="flex-1 text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Deletar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
