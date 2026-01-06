import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Minus, Plus, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number;
}

export default function AddProductDialog({
  open,
  onOpenChange,
  orderId,
}: AddProductDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  const { data: products } = trpc.products.getAll.useQuery(
    { includeInactive: false },
    { enabled: open }
  );
  const { data: categories } = trpc.categories.getAll.useQuery();
  const addItem = trpc.orderItems.add.useMutation();
  const utils = trpc.useUtils();

  const filteredProducts = products?.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.categoryId?.toString() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddProduct = async (productId: number, productName: string, price: string) => {
    const quantity = quantities[productId] || 1;
    
    try {
      await addItem.mutateAsync({
        orderId,
        productId,
        quantity,
        unitPrice: price,
        notes: "",
      });

      toast.success(`${quantity}x ${productName} adicionado à comanda`);
      
      // Reset quantity
      setQuantities((prev) => ({ ...prev, [productId]: 1 }));
      
      // Invalidate queries to refresh the order items list
      utils.orderItems.list.invalidate({ orderId });
    } catch (error) {
      toast.error("Erro ao adicionar produto");
    }
  };

  const updateQuantity = (productId: number, delta: number) => {
    setQuantities((prev) => {
      const current = prev[productId] || 1;
      const newValue = Math.max(1, current + delta);
      return { ...prev, [productId]: newValue };
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Adicionar Produtos</DialogTitle>
          <DialogDescription>
            Selecione os produtos para adicionar à comanda
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome do produto..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-48">
              <Label htmlFor="category">Categoria</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[50vh] space-y-3">
            {filteredProducts?.map((product) => {
              const quantity = quantities[product.id] || 1;
              const subtotal = parseFloat(product.price) * quantity;

              return (
                <div
                  key={product.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold">{product.name}</h4>
                    {product.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {product.description}
                      </p>
                    )}
                    <p className="text-sm font-medium mt-1">
                      R$ {parseFloat(product.price).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(product.id, -1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(product.id, 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="w-24 text-right">
                      <p className="text-sm text-muted-foreground">Subtotal</p>
                      <p className="font-bold">R$ {subtotal.toFixed(2)}</p>
                    </div>
                    <Button
                      onClick={() =>
                        handleAddProduct(product.id, product.name, product.price)
                      }
                      disabled={addItem.isPending}
                    >
                      Adicionar
                    </Button>
                  </div>
                </div>
              );
            })}

            {filteredProducts?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum produto encontrado
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
