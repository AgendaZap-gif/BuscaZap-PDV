import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Settings as SettingsIcon, Save, MapPin, Clock, CreditCard, Phone, Mail } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
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
        <div className="flex justify-end">
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
