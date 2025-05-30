import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { SystemConfig } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, AlertTriangle, Loader2, Settings2, CreditCard, Percent, Timer, Users, Image as ImageIcon, Building } from "lucide-react"; // Adicionado ImageIcon e Building

export default function AdminSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [config, setConfig] = useState({ // Inicializa com valores padrão para evitar undefined
    company_name: "BYD Profit",
    company_logo_url: "https://i.imgur.com/9qeZQxO.png",
    referral_rates: { level1: 17, level2: 2, level3: 1 },
    min_withdrawal: 25,
    withdrawal_fee: 10,
    withdrawal_time: 24,
    payment_gateway: {
      api_key: "",
      secret_key: "",
      is_active: false,
      provider: "startcash"
    },
    system_active: true
  });
  const [configId, setConfigId] = useState(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await User.me();
        
        if (userData.role !== "admin") {
          navigate(createPageUrl("Dashboard"));
          return;
        }
        
        setUser(userData);
        
        const configData = await SystemConfig.list();
        if (configData.length > 0) {
          // Garante que todos os campos esperados existam, fundindo com o padrão
          setConfig(prevConfig => ({
            ...prevConfig, // Começa com os padrões
            ...configData[0], // Sobrescreve com o que veio do banco
            referral_rates: { // Garante que referral_rates e seus subcampos existam
              ...(prevConfig.referral_rates || {}),
              ...(configData[0].referral_rates || {})
            },
            payment_gateway: { // Garante que payment_gateway e seus subcampos existam
              ...(prevConfig.payment_gateway || {}),
              ...(configData[0].payment_gateway || {})
            }
          }));
          setConfigId(configData[0].id);
        } else {
          const newConfig = await SystemConfig.create(config); // Usa o config inicializado
          setConfig(newConfig);
          setConfigId(newConfig.id);
        }
      } catch (error) {
        console.error("Error loading admin settings:", error);
        setError("Erro ao carregar configurações.");
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [navigate]);

  const handleSystemActiveChange = (value) => {
    setConfig(prevConfig => ({
      ...prevConfig,
      system_active: value
    }));
  };

  const handlePaymentGatewayActiveChange = (value) => {
    setConfig(prevConfig => ({
      ...prevConfig,
      payment_gateway: {
        ...(prevConfig.payment_gateway || {}), // Garante que payment_gateway exista
        is_active: value
      }
    }));
  };

  const handleInputChange = (section, field, value) => {
    if (section === 'referral_rates') {
      setConfig(prevConfig => ({
        ...prevConfig,
        referral_rates: {
          ...(prevConfig.referral_rates || {}),
          [field]: parseFloat(value) || 0 // Garante que seja um número
        }
      }));
    } else if (section === 'payment_gateway') {
      setConfig(prevConfig => ({
        ...prevConfig,
        payment_gateway: {
          ...(prevConfig.payment_gateway || {}),
          [field]: value
        }
      }));
    } else {
      // Para campos diretos como company_name, company_logo_url, min_withdrawal, etc.
      setConfig(prevConfig => ({
        ...prevConfig,
        [field]: typeof prevConfig[field] === 'number' ? (parseFloat(value) || 0) : value
      }));
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Garante que todos os sub-objetos necessários estejam presentes antes de salvar
      const configToSave = {
        ...config,
        referral_rates: config.referral_rates || { level1: 17, level2: 2, level3: 1 },
        payment_gateway: config.payment_gateway || { api_key: "", secret_key: "", is_active: false, provider: "startcash" }
      };
      await SystemConfig.update(configId, configToSave);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Erro ao salvar configurações:", error)
      setError("Erro ao salvar configurações. Por favor, tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações do Sistema</h1>
        <p className="text-gray-600">Gerencie todas as configurações da plataforma</p>
      </div>
      
      {success && (
        <Alert className="bg-green-50/50 backdrop-blur-sm border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            Configurações salvas com sucesso!
          </AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive" className="bg-red-50/50 backdrop-blur-sm">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="backdrop-blur-md bg-white/40 border border-white/30 p-1">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="payment">Gateway de Pagamento</TabsTrigger>
          <TabsTrigger value="referral">Programa de Indicação</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-lg">
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Configurações básicas e de identidade do sistema
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Nome da Empresa</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="company_name"
                      type="text"
                      value={config.company_name || ""}
                      onChange={(e) => handleInputChange(null, 'company_name', e.target.value)}
                      className="bg-white/70 pl-10"
                      placeholder="Nome da sua empresa"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Nome exibido em todo o sistema.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_logo_url">URL do Logo da Empresa</Label>
                  <div className="relative">
                     <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="company_logo_url"
                      type="text"
                      value={config.company_logo_url || ""}
                      onChange={(e) => handleInputChange(null, 'company_logo_url', e.target.value)}
                      className="bg-white/70 pl-10"
                      placeholder="https://exemplo.com/logo.png"
                    />
                  </div>
                   <p className="text-xs text-gray-500">Link direto para a imagem do logo.</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between bg-blue-50/50 backdrop-blur-sm rounded-lg p-4 border border-blue-100">
                <div className="space-y-0.5">
                  <h3 className="font-medium text-gray-900">Status do Sistema</h3>
                  <p className="text-sm text-gray-600">
                    {config.system_active 
                      ? "O sistema está ativo e os usuários podem acessar normalmente" 
                      : "O sistema está em manutenção, o acesso está limitado"
                    }
                  </p>
                </div>
                <Switch 
                  checked={config.system_active || false} // Garante que não seja undefined
                  onCheckedChange={handleSystemActiveChange}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
              
              <Separator />
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="min-withdrawal">Valor Mínimo de Saque (R$)</Label>
                  <Input
                    id="min-withdrawal"
                    type="number"
                    value={config.min_withdrawal || 0}
                    onChange={(e) => handleInputChange(null, 'min_withdrawal', e.target.value)}
                    className="bg-white/70"
                  />
                  <p className="text-xs text-gray-500">Valor mínimo que um usuário pode solicitar para saque</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="withdrawal-fee">Taxa de Saque (%)</Label>
                  <Input
                    id="withdrawal-fee"
                    type="number"
                    value={config.withdrawal_fee || 0}
                    onChange={(e) => handleInputChange(null, 'withdrawal_fee', e.target.value)}
                    className="bg-white/70"
                  />
                  <p className="text-xs text-gray-500">Percentual cobrado como taxa para cada saque</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="withdrawal-time">Tempo de Processamento de Saque (horas)</Label>
                  <Input
                    id="withdrawal-time"
                    type="number"
                    value={config.withdrawal_time || 0}
                    onChange={(e) => handleInputChange(null, 'withdrawal_time', e.target.value)}
                    className="bg-white/70"
                  />
                  <p className="text-xs text-gray-500">Tempo máximo de processamento de saques em horas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payment">
          <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-lg">
            <CardHeader>
              <CardTitle>Gateway de Pagamento</CardTitle>
              <CardDescription>
                Configurações do gateway de pagamento StartCash
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between bg-indigo-50/50 backdrop-blur-sm rounded-lg p-4 border border-indigo-100">
                <div className="space-y-0.5">
                  <h3 className="font-medium text-gray-900">Gateway de Pagamento Automático</h3>
                  <p className="text-sm text-gray-600">
                    {(config.payment_gateway && config.payment_gateway.is_active)
                      ? "As transações serão processadas automaticamente via API" 
                      : "As transações precisarão ser processadas manualmente"
                    }
                  </p>
                </div>
                <Switch 
                  checked={(config.payment_gateway && config.payment_gateway.is_active) || false}
                  onCheckedChange={handlePaymentGatewayActiveChange}
                  className="data-[state=checked]:bg-indigo-500"
                />
              </div>
              
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="api-key">Chave da API (StartCash)</Label>
                  <Input
                    id="api-key"
                    type="text"
                    value={(config.payment_gateway && config.payment_gateway.api_key) || ""}
                    onChange={(e) => handleInputChange('payment_gateway', 'api_key', e.target.value)}
                    className="bg-white/70 font-mono"
                    placeholder="Cole sua chave de API aqui"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="secret-key">Chave Secreta (StartCash)</Label>
                  <Input
                    id="secret-key"
                    type="password"
                    value={(config.payment_gateway && config.payment_gateway.secret_key) || ""}
                    onChange={(e) => handleInputChange('payment_gateway', 'secret_key', e.target.value)}
                    className="bg-white/70 font-mono"
                    placeholder="Cole sua chave secreta aqui"
                  />
                </div>
              </div>
              
              <div className="bg-yellow-50/50 backdrop-blur-sm rounded-lg p-4 border border-yellow-100">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800 mb-1">Importante</h4>
                    <p className="text-sm text-yellow-700">
                      Para utilizar o processamento automático de pagamentos, você precisa ter uma conta na StartCash e obter suas credenciais de API. 
                      Consulte a <a href="https://app.startcash.io/docs/intro/first-steps" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">documentação oficial</a> para mais informações.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="referral">
          <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-lg">
            <CardHeader>
              <CardTitle>Programa de Indicação</CardTitle>
              <CardDescription>
                Configure as taxas e comissões do programa de indicação
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="bg-purple-50/50 backdrop-blur-sm rounded-lg p-5 border border-purple-100">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Taxas de Comissão</h3>
                
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="level1-rate">1º Nível (%)</Label>
                    <div className="relative">
                      <Input
                        id="level1-rate"
                        type="number"
                        value={(config.referral_rates && config.referral_rates.level1) || 0}
                        onChange={(e) => handleInputChange('referral_rates', 'level1', e.target.value)}
                        className="bg-white/70 pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                    </div>
                    <p className="text-xs text-gray-500">Comissão para indicações diretas</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="level2-rate">2º Nível (%)</Label>
                    <div className="relative">
                      <Input
                        id="level2-rate"
                        type="number"
                        value={(config.referral_rates && config.referral_rates.level2) || 0}
                        onChange={(e) => handleInputChange('referral_rates', 'level2', e.target.value)}
                        className="bg-white/70 pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                    </div>
                    <p className="text-xs text-gray-500">Comissão para o segundo nível</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="level3-rate">3º Nível (%)</Label>
                    <div className="relative">
                      <Input
                        id="level3-rate"
                        type="number"
                        value={(config.referral_rates && config.referral_rates.level3) || 0}
                        onChange={(e) => handleInputChange('referral_rates', 'level3', e.target.value)}
                        className="bg-white/70 pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                    </div>
                    <p className="text-xs text-gray-500">Comissão para o terceiro nível</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50/50 backdrop-blur-sm rounded-lg p-4 border border-green-100">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Percent className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Como funcionam as comissões</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      As comissões são calculadas sobre o valor dos investimentos realizados pelos usuários indicados. 
                      Por exemplo, se um usuário indicado diretamente investe R$ 1.000, com uma taxa de {(config.referral_rates && config.referral_rates.level1) || 0}%, 
                      o indicador receberá R$ {(1000 * ((config.referral_rates && config.referral_rates.level1) || 0) / 100).toFixed(2)} de comissão.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end">
        <Button
          onClick={saveSettings}
          className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
          disabled={saving || loading} // Desabilitar se estiver carregando também
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Settings2 className="mr-2 h-4 w-4" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </div>
  );
}