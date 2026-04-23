import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, DollarSign, Search, X } from "lucide-react";
import { toast } from "sonner";

// Mock data for products
const mockProducts = [
  { id: 1, name: "Produto A", price: 150.00, category: "Eletrônicos", stock: 10 },
  { id: 2, name: "Produto B", price: 80.00, category: "Eletrônicos", stock: 15 },
  { id: 3, name: "Produto C", price: 120.00, category: "Livros", stock: 5 },
  { id: 4, name: "Produto D", price: 200.00, category: "Eletrônicos", stock: 8 },
  { id: 5, name: "Produto E", price: 45.00, category: "Acessórios", stock: 20 },
  { id: 6, name: "Produto F", price: 95.00, category: "Acessórios", stock: 12 },
];

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
}

const paymentMethods: PaymentMethod[] = [
  { id: "cash", name: "Dinheiro", icon: "💵" },
  { id: "card", name: "Cartão", icon: "💳" },
  { id: "pix", name: "PIX", icon: "📱" },
  { id: "check", name: "Cheque", icon: "📄" },
];

export default function POS() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerName, setCustomerName] = useState("");

  const filteredProducts = useMemo(() => {
    return mockProducts.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const addToCart = (product: typeof mockProducts[0]) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { id: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
    toast.success(`${product.name} adicionado ao carrinho`);
  };

  const removeFromCart = (productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
    toast.success("Produto removido do carrinho");
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const handleCheckout = () => {
    if (!selectedPayment) {
      toast.error("Selecione uma forma de pagamento");
      return;
    }
    if (!customerName) {
      toast.error("Digite o nome do cliente");
      return;
    }
    
    toast.success(`Pedido finalizado! Total: R$ ${total.toFixed(2)}`);
    setCart([]);
    setCustomerName("");
    setSelectedPayment(null);
    setShowCheckout(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Produtos */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-100 p-3 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">PDV - Ponto de Venda</h1>
                <p className="text-gray-600">Gerencie suas vendas</p>
              </div>
            </div>

            {/* Busca de Produtos */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Grid de Produtos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProducts.map(product => (
                <Card key={product.id} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-600">{product.category}</p>
                    </div>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {product.stock} em estoque
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-green-600">R$ {product.price.toFixed(2)}</span>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => addToCart(product)}
                      disabled={product.stock === 0}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Carrinho */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Carrinho</h2>

              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">Carrinho vazio</p>
                </div>
              ) : (
                <>
                  {/* Itens do Carrinho */}
                  <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                    {cart.map(item => (
                      <div key={item.id} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-gray-900">{item.name}</p>
                            <p className="text-sm text-gray-600">R$ {item.price.toFixed(2)}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="flex-1 text-center font-semibold">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Resumo */}
                  <div className="border-t border-gray-200 pt-4 space-y-2 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Imposto (10%)</span>
                      <span className="font-medium">R$ {tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                      <span>Total</span>
                      <span className="text-green-600">R$ {total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Botão Checkout */}
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 mb-2"
                    onClick={() => setShowCheckout(!showCheckout)}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Finalizar Venda
                  </Button>

                  {/* Checkout */}
                  {showCheckout && (
                    <div className="bg-blue-50 p-4 rounded-lg space-y-4 border border-blue-200">
                      <div>
                        <label className="text-sm font-medium text-gray-900 block mb-2">
                          Nome do Cliente
                        </label>
                        <Input
                          placeholder="Digite o nome..."
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-900 block mb-2">
                          Forma de Pagamento
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {paymentMethods.map(method => (
                            <Button
                              key={method.id}
                              variant={selectedPayment === method.id ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSelectedPayment(method.id)}
                              className="text-xs"
                            >
                              {method.icon} {method.name}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={handleCheckout}
                      >
                        Confirmar Pagamento
                      </Button>
                    </div>
                  )}
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
