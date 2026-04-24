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

function RedirectToLogin() {
  const didRedirect = useRef(false);
  useEffect(() => {
    if (didRedirect.current) return;
    didRedirect.current = true;
    window.location.href = getLoginUrl();
  }, []);
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
      <p className="text-sm text-slate-300">Redirecionando para o login…</p>
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
    console.log(`[BusinessTypeProvider] No user data, redirecting to login`);
    return <RedirectToLogin />;
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
