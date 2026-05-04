import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Settings as SettingsIcon, Save, MapPin, Clock, CreditCard, Phone, Mail, ShoppingCart, ToggleRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useBusinessType } from "@/contexts/BusinessTypeContext";
import { trpc } from "@/lib/trpc";

export default function Settings() {
  const { businessType, setBusinessType } = useBusinessType();
  const [pedijaSettings, setPedijaSettings] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [isLoadingPedija, setIsLoadingPedija] = useState(false);
  const [isSavingBusinessType, setIsSavingBusinessType] = useState(false);
  const [formData, setFormData] = useState({
    storeName: "Minha Loja - Serviços",
    storeDescription: "Prestação de serviços com agendamento",
    phone: "(11) 98765-4321",
    email: "contato@minaloja.com",
    address: "Rua das Flores, 123",
    city: "São Paulo",
    state: "SP",
    zipCode: "01234-567",
    cnpj: "12.345.678/0001-90",
    bankAccount: "12345-6",
    bankCode: "001",
    accountHolder: "Minha Loja LTDA",
    mondayOpen: "09:00",
    mondayClose: "18:00",
    tuesdayOpen: "09:00",
    tuesdayClose: "18:00",
    wednesdayOpen: "09:00",
    wednesdayClose: "18:00",
    thursdayOpen: "09:00",
    thursdayClose: "18:00",
    fridayOpen: "09:00",
    fridayClose: "18:00",
    saturdayOpen: "10:00",
    saturdayClose: "16:00",
    sundayOpen: "Fechado",
    sundayClose: "Fechado",
  });

  const [isSaving, setIsSaving] = useState(false);
  
  // Queries e mutations para PediJá
  const pedijaSettingsQuery = trpc.pedijaSettings?.getSettings?.useQuery(undefined, {
    enabled: businessType === "restaurant",
  });
  const updateBusinessTypeMutation = trpc.seller?.updateBusinessType?.useMutation();
  const toggleOnlineStatusMutation = trpc.pedijaSettings?.toggleOnlineStatus?.useMutation();
  const activateOnPedijaMutation = trpc.pedijaSettings?.activateOnPedija?.useMutation();
  
  // Carregar configurações do PediJá
  useEffect(() => {
    if (pedijaSettingsQuery?.data) {
      setPedijaSettings(pedijaSettingsQuery.data);
      setIsOnline(pedijaSettingsQuery.data?.isOnlineForOrders === 1);
    }
  }, [pedijaSettingsQuery?.data]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simular salvamento
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Configurações salvas com sucesso!");
    }, 1000);
  };
  
  const handleChangeBusinessType = async (newType: string) => {
    try {
      setIsSavingBusinessType(true);
      if (updateBusinessTypeMutation) {
        await updateBusinessTypeMutation.mutateAsync({
          businessType: newType as any,
        });
        setBusinessType(newType as any);
        toast.success(`Tipo de negócio alterado para ${newType}!`);
      }
    } catch (error) {
      toast.error("Erro ao alterar tipo de negócio");
      console.error(error);
    } finally {
      setIsSavingBusinessType(false);
    }
  };
  
  const handleActivatePedija = async () => {
    try {
      setIsLoadingPedija(true);
      if (activateOnPedijaMutation) {
        await activateOnPedijaMutation.mutateAsync({});
        await pedijaSettingsQuery?.refetch?.();
        toast.success("Empresa ativada no PediJá com sucesso!");
      }
    } catch (error) {
      toast.error("Erro ao ativar no PediJá");
      console.error(error);
    } finally {
      setIsLoadingPedija(false);
    }
  };
  
  const handleToggleOnlineStatus = async (online: boolean) => {
    try {
      setIsLoadingPedija(true);
      if (toggleOnlineStatusMutation) {
        await toggleOnlineStatusMutation.mutateAsync({
          isActive: online,
        });
        setIsOnline(online);
        await pedijaSettingsQuery?.refetch?.();
        toast.success(online ? "Empresa online para pedidos!" : "Empresa offline para pedidos");
      }
    } catch (error) {
      toast.error("Erro ao atualizar status online");
      console.error(error);
    } finally {
      setIsLoadingPedija(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-blue-100 p-3 rounded-lg">
            <SettingsIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configurações da Loja</h1>
            <p className="text-gray-600">Gerencie as informações da sua loja</p>
          </div>
        </div>

        {/* Tipo de Negócio */}
        {businessType && (
          <Card className="p-6 mb-6 bg-blue-50 border-blue-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Tipo de Negócio
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tipo atual:</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {businessType === "commerce" ? "Comércio" : businessType === "services" ? "Serviços" : "Restaurante"}
                </p>
              </div>
              {businessType !== "restaurant" && (
                <Button
                  onClick={() => handleChangeBusinessType("restaurant")}
                  disabled={isSavingBusinessType}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSavingBusinessType ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Alterando...
                    </>
                  ) : (
                    "Mudar para Restaurante"
                  )}
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Configurações PediJá */}
        {businessType === "restaurant" && (
          <Card className="p-6 mb-6 bg-green-50 border-green-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ToggleRight className="w-5 h-5" />
              Configurações do PediJá
            </h2>
            <div className="space-y-4">
              {pedijaSettingsQuery?.isLoading ? (
                <div className="flex items-center justify-center p-6">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                  <p className="text-gray-600">Carregando configurações...</p>
                </div>
              ) : pedijaSettings?.isOnPedija === 1 ? (
                <>
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-green-200">
                    <div>
                      <p className="font-semibold text-gray-900">Status no PediJá</p>
                      <p className="text-sm text-green-600">✓ Ativado</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                    <div>
                      <p className="font-semibold text-gray-900">Receber Pedidos</p>
                      <p className="text-sm text-gray-600">{isOnline ? "🟢 Online" : "🔴 Offline"}</p>
                    </div>
                    <Button
                      onClick={() => handleToggleOnlineStatus(!isOnline)}
                      disabled={isLoadingPedija}
                      className={isOnline ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 hover:bg-gray-500"}
                    >
                      {isLoadingPedija ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Atualizando...
                        </>
                      ) : isOnline ? (
                        "Ficar Offline"
                      ) : (
                        "Ficar Online"
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="p-4 bg-white rounded-lg border border-yellow-200">
                  <p className="font-semibold text-gray-900 mb-2">Empresa não está no PediJá</p>
                  <p className="text-sm text-gray-600 mb-4">Ative sua empresa no PediJá para começar a receber pedidos online.</p>
                  <Button
                    onClick={handleActivatePedija}
                    disabled={isLoadingPedija}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isLoadingPedija ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Ativando...
                      </>
                    ) : (
                      "Ativar no PediJá"
                    )}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Informações da Loja */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            Informações da Loja
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Loja</label>
              <Input
                name="storeName"
                value={formData.storeName}
                onChange={handleInputChange}
                placeholder="Nome da sua loja"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
              <Input
                name="cnpj"
                value={formData.cnpj}
                onChange={handleInputChange}
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição da Loja</label>
              <textarea
                name="storeDescription"
                value={formData.storeDescription}
                onChange={handleInputChange}
                placeholder="Descreva sua loja"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
          </div>
        </Card>

        {/* Contato */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Informações de Contato
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <Input
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="(11) 98765-4321"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="contato@exemplo.com"
              />
            </div>
          </div>
        </Card>

        {/* Endereço */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Endereço
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Rua</label>
              <Input
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Rua das Flores, 123"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
              <Input
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="São Paulo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <Input
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                placeholder="SP"
                maxLength={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
              <Input
                name="zipCode"
                value={formData.zipCode}
                onChange={handleInputChange}
                placeholder="01234-567"
              />
            </div>
          </div>
        </Card>

        {/* Informações Bancárias */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Informações Bancárias
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Banco</label>
              <Input
                name="bankCode"
                value={formData.bankCode}
                onChange={handleInputChange}
                placeholder="001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conta</label>
              <Input
                name="bankAccount"
                value={formData.bankAccount}
                onChange={handleInputChange}
                placeholder="12345-6"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Titular da Conta</label>
              <Input
                name="accountHolder"
                value={formData.accountHolder}
                onChange={handleInputChange}
                placeholder="Nome do titular"
              />
            </div>
          </div>
        </Card>

        {/* Horários de Funcionamento */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Horários de Funcionamento
          </h2>
          <div className="space-y-4">
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day, index) => {
              const dayName = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"][index];
              const openKey = `${day.toLowerCase()}Open`;
              const closeKey = `${day.toLowerCase()}Close`;
              return (
                <div key={day} className="grid grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{dayName}</label>
                  </div>
                  <div>
                    <Input
                      type="time"
                      name={openKey}
                      value={formData[openKey as keyof typeof formData]}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <Input
                      type="time"
                      name={closeKey}
                      value={formData[closeKey as keyof typeof formData]}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Botão Salvar */}
        <div className="flex justify-end gap-4">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </div>
    </div>
  );
}
