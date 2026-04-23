import { useBusinessType } from '@/contexts/BusinessTypeContext';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ShoppingCart,
  Plus,
  BarChart3,
  Settings,
  Package,
  Clock,
  UtensilsCrossed,
  Briefcase,
  TrendingUp,
  Users,
  AlertCircle,
} from 'lucide-react';
import { useLocation } from 'wouter';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const { businessType, config, seller: contextSeller } = useBusinessType();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isCreatingSeller, setIsCreatingSeller] = useState(false);

  const sellerQuery = trpc.seller.profile.useQuery(undefined, {
    enabled: !!businessType,
  });
  const productsQuery = trpc.seller.getProducts.useQuery(undefined, {
    enabled: !!sellerQuery.data,
  });

  // If no business type selected, redirect to selection
  useEffect(() => {
    if (!businessType && !isCreatingSeller) {
      setLocation('/select-business-type');
    }
  }, [businessType, isCreatingSeller, setLocation]);

  if (!businessType || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  const seller = sellerQuery.data;
  const products = productsQuery.data || [];
  const isLoadingProfile = sellerQuery.isLoading;
  const hasProfileError = sellerQuery.isError;

  // Define navigation items based on business type
  const getNavigationItems = () => {
    const baseItems = [
      {
        label: config.productPlural,
        icon: ShoppingCart,
        href: '/products',
        description:
          config.type === 'commerce'
            ? 'Gerenciar seus produtos'
            : config.type === 'services'
              ? 'Gerenciar seus serviços'
              : 'Gerenciar seu cardápio',
      },
      {
        label: 'Pedidos',
        icon: Package,
        href: '/orders',
        description: 'Acompanhar pedidos e vendas',
      },
      {
        label: 'Relatórios',
        icon: BarChart3,
        href: '/reports',
        description: 'Análise de vendas e desempenho',
      },
      {
        label: 'Configurações',
        icon: Settings,
        href: '/settings',
        description: 'Configurar sua loja',
      },
    ];

    // Add scheduling for services
    if (config.type === 'services') {
      baseItems.splice(1, 0, {
        label: 'Agendamentos',
        icon: Clock,
        href: '/appointments',
        description: 'Gerenciar agendamentos de clientes',
      });
    }

    // Add delivery for restaurant
    if (config.type === 'restaurant') {
      baseItems.splice(2, 0, {
        label: 'Entregas',
        icon: TrendingUp,
        href: '/deliveries',
        description: 'Gerenciar entregas e pedidos',
      });
    }

    return baseItems;
  };

  const navigationItems = getNavigationItems();

  // Get dashboard stats based on business type
  const getDashboardStats = () => {
    return [
      {
        label:
          config.type === 'commerce'
            ? 'Produtos em Estoque'
            : config.type === 'services'
              ? 'Serviços Ativos'
              : 'Pratos no Cardápio',
        value: products.length,
        icon: ShoppingCart,
        color: 'bg-blue-100 text-blue-600',
      },
      {
        label: 'Vendas este mês',
        value: '0',
        icon: TrendingUp,
        color: 'bg-green-100 text-green-600',
      },
      {
        label: 'Clientes',
        value: '0',
        icon: Users,
        color: 'bg-purple-100 text-purple-600',
      },
      {
        label: 'Receita',
        value: 'R$ 0,00',
        icon: BarChart3,
        color: 'bg-orange-100 text-orange-600',
      },
    ];
  };

  const stats = getDashboardStats();

  // Show error state if seller profile failed to load
  if (hasProfileError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full">
          <div className="flex flex-col items-center text-center">
            <div className="p-3 bg-red-100 rounded-lg mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              Erro ao carregar perfil
            </h2>
            <p className="text-slate-600 mb-6">
              Não conseguimos carregar as informações da sua loja. Por favor, tente novamente.
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Recarregar Página
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Show loading state
  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-slate-600">Carregando seu painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {seller?.storeName || 'Minha Loja'}
              </h1>
              <p className="text-slate-600 mt-1">
                {config.label} • {config.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-sm text-slate-600">Bem-vindo,</p>
                <p className="font-semibold text-slate-900">{user?.name || 'Usuário'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card key={idx} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-2">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={() => setLocation('/products/new')}
              className="bg-blue-600 hover:bg-blue-700 text-white py-6 h-auto flex flex-col items-center justify-center gap-2"
            >
              <Plus className="w-6 h-6" />
              <span>
                Adicionar {config.productLabel}
              </span>
            </Button>
            {config.type === 'services' && (
              <Button
                onClick={() => setLocation('/appointments/new')}
                className="bg-purple-600 hover:bg-purple-700 text-white py-6 h-auto flex flex-col items-center justify-center gap-2"
              >
                <Clock className="w-6 h-6" />
                <span>Novo Agendamento</span>
              </Button>
            )}
            <Button
              onClick={() => setLocation('/orders')}
              className="bg-green-600 hover:bg-green-700 text-white py-6 h-auto flex flex-col items-center justify-center gap-2"
            >
              <Package className="w-6 h-6" />
              <span>Ver Pedidos</span>
            </Button>
            <Button
              onClick={() => setLocation('/settings')}
              className="bg-slate-600 hover:bg-slate-700 text-white py-6 h-auto flex flex-col items-center justify-center gap-2"
            >
              <Settings className="w-6 h-6" />
              <span>Configurações</span>
            </Button>
          </div>
        </div>

        {/* Navigation Grid */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Menu Principal</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {navigationItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <Card
                  key={idx}
                  className="p-6 cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-blue-300"
                  onClick={() => setLocation(item.href)}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="p-3 bg-blue-100 rounded-lg mb-3">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900">{item.label}</h3>
                    <p className="text-sm text-slate-600 mt-2">{item.description}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Empty State for Products */}
        {products.length === 0 && (
          <div className="mt-12 text-center">
            <div className="inline-flex p-3 bg-blue-100 rounded-lg mb-4">
              <ShoppingCart className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Comece adicionando {config.productPlural.toLowerCase()}
            </h3>
            <p className="text-slate-600 mb-6">
              Você ainda não tem {config.productPlural.toLowerCase()} cadastrados. Clique no botão
              abaixo para começar.
            </p>
            <Button
              onClick={() => setLocation('/products/new')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar {config.productLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
