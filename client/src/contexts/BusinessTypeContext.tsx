import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { BusinessType, BUSINESS_TYPE_CONFIGS } from "@shared/businessTypes";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";

interface BusinessTypeContextType {
  businessType: BusinessType | null;
  /** Atualiza tipo localmente (ex.: após escolha, antes do refetch); o servidor continua sendo a fonte da verdade. */
  setBusinessType: (type: BusinessType) => void;
  isLoading: boolean;
  config: (typeof BUSINESS_TYPE_CONFIGS)[BusinessType] | null;
  seller: unknown | null;
  error: string | null;
  refreshSellerProfile: () => Promise<void>;
}

const BusinessTypeContext = createContext<BusinessTypeContextType | undefined>(undefined);

function LoginRequired() {
  const loginUrl = getLoginUrl();
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <div className="inline-block p-4 rounded-full bg-blue-100">
            <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Acesso Restrito</h1>
        <p className="text-slate-600 mb-6">Você precisa fazer login para acessar o sistema PDV.</p>
        <a
          href={loginUrl}
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Fazer Login
        </a>
      </div>
    </div>
  );
}

function AuthenticatedBusinessTypeInner({ children }: { children: React.ReactNode }) {
  const profileQuery = trpc.seller.profile.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: true,
  });

  const utils = trpc.useUtils();

  const businessType = profileQuery.data
    ? (profileQuery.data.businessType as BusinessType)
    : null;

  const seller = profileQuery.data ?? null;

  const refreshSellerProfile = useCallback(async () => {
    await utils.seller.profile.invalidate();
    await utils.seller.profile.fetch();
  }, [utils]);

  const setBusinessType = useCallback((type: BusinessType) => {
    try {
      localStorage.setItem("businessType", type);
    } catch {
      /* ignore */
    }
    void type;
  }, []);

  useEffect(() => {
    if (profileQuery.data?.businessType) {
      try {
        localStorage.setItem("businessType", profileQuery.data.businessType);
      } catch {
        /* ignore */
      }
    }
    if (!profileQuery.isLoading && !profileQuery.data) {
      try {
        localStorage.removeItem("businessType");
      } catch {
        /* ignore */
      }
    }
  }, [profileQuery.data, profileQuery.isLoading]);

  const config = businessType ? BUSINESS_TYPE_CONFIGS[businessType] : null;

  const value = useMemo(
    () => ({
      businessType,
      setBusinessType,
      isLoading: profileQuery.isPending,
      config,
      seller,
      error: profileQuery.error?.message ?? null,
      refreshSellerProfile,
    }),
    [
      businessType,
      setBusinessType,
      profileQuery.isPending,
      config,
      seller,
      profileQuery.error,
      refreshSellerProfile,
    ]
  );

  return <BusinessTypeContext.Provider value={value}>{children}</BusinessTypeContext.Provider>;
}

export function BusinessTypeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("buscazap_company_id");
    if (id && /^\d+$/.test(id)) {
      window.sessionStorage.setItem("buscazap_company_id", id);
    }
  }, []);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: true,
  });

  console.log(`[BusinessTypeProvider] Auth state:`, { isLoading: meQuery.isLoading, hasData: !!meQuery.data, error: meQuery.error?.message });

  if (meQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          <p className="mt-4 text-slate-600">Carregando…</p>
        </div>
      </div>
    );
  }

  if (!meQuery.data) {
    return <LoginRequired />;
  }

  console.log(`[BusinessTypeProvider] User authenticated:`, meQuery.data.openId || meQuery.data.id);

  return <AuthenticatedBusinessTypeInner>{children}</AuthenticatedBusinessTypeInner>;
}

export function useBusinessType() {
  const context = useContext(BusinessTypeContext);
  if (context === undefined) {
    throw new Error("useBusinessType must be used within a BusinessTypeProvider");
  }
  return context;
}

export function useBusinessTypeConfig() {
  const { config } = useBusinessType();
  if (!config) {
    throw new Error("Business type not yet selected");
  }
  return config;
}
