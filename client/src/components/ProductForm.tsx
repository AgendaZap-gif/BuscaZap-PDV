import { useBusinessTypeConfig } from '@/contexts/BusinessTypeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';

interface ProductFormProps {
  categories: string[];
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export default function ProductForm({
  categories,
  onSubmit,
  isLoading = false,
}: ProductFormProps) {
  const config = useBusinessTypeConfig();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    price: '',
    cost: '',
    category: '',
    // Commerce-specific
    weight: '',
    length: '',
    width: '',
    height: '',
    // Services-specific
    duration: '',
    // Restaurant-specific
    preparationTime: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out empty fields and irrelevant fields based on businessType
    const filteredData = Object.entries(formData).reduce((acc, [key, value]) => {
      if (!value) return acc;
      
      // Only include fields relevant to this business type
      if (config.type === 'commerce') {
        if (['name', 'description', 'sku', 'price', 'cost', 'category', 'weight', 'length', 'width', 'height'].includes(key)) {
          acc[key] = value;
        }
      } else if (config.type === 'services') {
        if (['name', 'description', 'sku', 'price', 'cost', 'category', 'duration'].includes(key)) {
          acc[key] = value;
        }
      } else if (config.type === 'restaurant') {
        if (['name', 'description', 'sku', 'price', 'cost', 'category', 'preparationTime', 'weight'].includes(key)) {
          acc[key] = value;
        }
      }
      
      return acc;
    }, {} as Record<string, string>);

    onSubmit(filteredData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">
          Informações Básicas
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">
              Nome do {config.productLabel} *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder={`Ex: ${config.type === 'commerce' ? 'Camiseta Azul' : config.type === 'services' ? 'Consultoria de Marketing' : 'Moqueca de Peixe'}`}
              required
            />
          </div>

          <div>
            <Label htmlFor="category">
              {config.categoryLabel} *
            </Label>
            <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Descreva os detalhes do seu produto/serviço"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sku">SKU / Código</Label>
            <Input
              id="sku"
              value={formData.sku}
              onChange={(e) => handleChange('sku', e.target.value)}
              placeholder="Ex: PROD-001"
            />
          </div>

          <div>
            <Label htmlFor="price">Preço *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => handleChange('price', e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
        </div>
      </div>

      {/* Commerce-specific Fields */}
      {config.type === 'commerce' && (
        <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-slate-900">
            Informações de Estoque
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                value={formData.weight}
                onChange={(e) => handleChange('weight', e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="cost">Custo (R$)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => handleChange('cost', e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="length">Comprimento (cm)</Label>
              <Input
                id="length"
                type="number"
                step="0.01"
                value={formData.length}
                onChange={(e) => handleChange('length', e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="width">Largura (cm)</Label>
              <Input
                id="width"
                type="number"
                step="0.01"
                value={formData.width}
                onChange={(e) => handleChange('width', e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="height">Altura (cm)</Label>
              <Input
                id="height"
                type="number"
                step="0.01"
                value={formData.height}
                onChange={(e) => handleChange('height', e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
      )}

      {/* Services-specific Fields */}
      {config.type === 'services' && (
        <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <h3 className="text-lg font-semibold text-slate-900">
            Informações do Serviço
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration">Duração (minutos) *</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => handleChange('duration', e.target.value)}
                placeholder="60"
                required
              />
            </div>
            <div>
              <Label htmlFor="cost">Custo (R$)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => handleChange('cost', e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
      )}

      {/* Restaurant-specific Fields */}
      {config.type === 'restaurant' && (
        <div className="space-y-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
          <h3 className="text-lg font-semibold text-slate-900">
            Informações do Prato
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="preparationTime">Tempo de Preparo (minutos) *</Label>
              <Input
                id="preparationTime"
                type="number"
                value={formData.preparationTime}
                onChange={(e) => handleChange('preparationTime', e.target.value)}
                placeholder="30"
                required
              />
            </div>
            <div>
              <Label htmlFor="cost">Custo (R$)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => handleChange('cost', e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="weight">Peso/Porção (g)</Label>
            <Input
              id="weight"
              type="number"
              step="0.01"
              value={formData.weight}
              onChange={(e) => handleChange('weight', e.target.value)}
              placeholder="300"
            />
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? 'Salvando...' : `Adicionar ${config.productLabel}`}
        </Button>
      </div>
    </form>
  );
}
