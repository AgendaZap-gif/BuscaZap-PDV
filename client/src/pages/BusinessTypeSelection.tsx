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
            Sua conta BuscaZap foi autenticada, mas não encontramos uma empresa vinculada a este acesso no PDV.
          </p>
          <p className="mt-4 text-slate-400">
            Certifique-se de acessar o PDV através do link oficial no seu painel administrativo do BuscaZap para que o vínculo seja feito automaticamente.
          </p>
        </div>

        {/* Info Box instead of Cards */}
        <Card className="bg-white p-8 text-center shadow-xl">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-amber-100 rounded-full">
              <Briefcase className="w-12 h-12 text-amber-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Empresa não vinculada</h2>
          <p className="text-slate-600 mb-8">
            O sistema PDV é restrito a empresas já cadastradas no BuscaZap. 
            Se você já possui uma empresa, acesse o painel administrativo e clique no link do PDV.
          </p>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = 'https://appbuscazap-c-bot.up.railway.app'}
            className="w-full max-w-xs"
          >
            Ir para o Painel Principal
          </Button>
        </Card>

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
