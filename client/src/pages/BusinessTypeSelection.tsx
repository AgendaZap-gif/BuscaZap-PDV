import { useBusinessType } from '@/contexts/BusinessTypeContext';
import { getAppDisplayName } from '@/const';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BUSINESS_TYPE_CONFIGS, BusinessType } from '@shared/businessTypes';
import { ShoppingCart, Briefcase, UtensilsCrossed, Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useState } from 'react';
import { toast } from 'sonner';

const ICON_MAP = {
  ShoppingCart: ShoppingCart,
  Briefcase: Briefcase,
  UtensilsCrossed: UtensilsCrossed,
};

export default function BusinessTypeSelection() {
  const { setBusinessType, refreshSellerProfile } = useBusinessType();
  const [, setLocation] = useLocation();
  const [selectedType, setSelectedType] = useState<BusinessType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const appName = getAppDisplayName();

  const createSellerMutation = trpc.seller.create.useMutation();
  const utils = trpc.useUtils();

  const handleSelectBusinessType = async (type: BusinessType) => {
    setSelectedType(type);
    setIsLoading(true);

    try {
      const buscazapCompanyIdRaw =
        typeof window !== "undefined" ? window.sessionStorage.getItem("buscazap_company_id") : null;
      const buscazapCompanyId = buscazapCompanyIdRaw ? parseInt(buscazapCompanyIdRaw, 10) : undefined;
      await createSellerMutation.mutateAsync({
        storeName: `Minha Loja - ${BUSINESS_TYPE_CONFIGS[type].label}`,
        businessType: type,
        ...(Number.isFinite(buscazapCompanyId) && (buscazapCompanyId as number) > 0
          ? { buscazapCompanyId: buscazapCompanyId as number }
          : {}),
      });

      await utils.seller.profile.invalidate();
      await refreshSellerProfile();
      setBusinessType(type);

      toast.success(`Bem-vindo ao ${BUSINESS_TYPE_CONFIGS[type].label}!`);
      setLocation('/');
    } catch (error: unknown) {
      console.error("[BusinessTypeSelection] Error creating seller:", error);
      const errorMessage =
        error && typeof error === "object" && "message" in error && typeof (error as { message: unknown }).message === "string"
          ? (error as { message: string }).message
          : "Erro ao selecionar tipo de negócio";
      toast.error(errorMessage);
      setIsLoading(false);
      setSelectedType(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Bem-vindo ao {appName}</h1>
          <p className="text-xl text-slate-300">
            Escolha o ramo do seu negócio (comércio, serviços ou restaurante). Isso define cardápio e Pedijà no
            restaurante, agendamento nos serviços e estoque no comércio, alinhado à sua empresa no BuscaZap.
          </p>
        </div>

        {/* Business Type Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {(Object.keys(BUSINESS_TYPE_CONFIGS) as BusinessType[]).map((type) => {
            const config = BUSINESS_TYPE_CONFIGS[type];
            const IconComponent =
              ICON_MAP[config.icon as keyof typeof ICON_MAP] || ShoppingCart;

            return (
              <Card
                key={type}
                className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden bg-white"
              >
                <div className="p-6 flex flex-col h-full">
                  {/* Icon */}
                  <div className="mb-4 inline-flex">
                    <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg group-hover:from-blue-200 group-hover:to-blue-100 transition-colors">
                      <IconComponent className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>

                  {/* Content */}
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    {config.label}
                  </h2>
                  <p className="text-slate-600 text-sm mb-6 flex-grow">
                    {config.description}
                  </p>

                  {/* Features */}
                  <ul className="space-y-2 mb-6 text-sm text-slate-700">
                    {config.hasInventory && (
                      <li className="flex items-center">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2" />
                        Gestão de estoque
                      </li>
                    )}
                    {config.hasScheduling && (
                      <li className="flex items-center">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2" />
                        Sistema de agendamento
                      </li>
                    )}
                    {config.hasDelivery && (
                      <li className="flex items-center">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2" />
                        Suporte a delivery
                      </li>
                    )}
                    {config.hasDuration && (
                      <li className="flex items-center">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2" />
                        Duração de serviços
                      </li>
                    )}
                  </ul>

                  {/* Button */}
                  <Button
                    onClick={() => handleSelectBusinessType(type)}
                    disabled={isLoading && selectedType === type}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading && selectedType === type ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                        Carregando...
                      </>
                    ) : (
                      `Escolher ${config.label}`
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Info Footer */}
        <div className="text-center text-slate-400 text-sm">
          <p>
            Você poderá alterar o tipo de negócio posteriormente nas configurações da sua conta.
          </p>
        </div>
      </div>
    </div>
  );
}
