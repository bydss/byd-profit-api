import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { InvestmentPlan } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Loader2, 
  Pencil,
  Trash2,
  Plus,
  Car,
  DollarSign,
  Percent,
  Calendar,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { format } from "date-fns";

export default function AdminInvestments() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isAddNew, setIsAddNew] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    value: 0,
    return_rate: 0,
    return_period: 50,
    daily_profit: 0,
    total_profit: 0,
    image_url: "",
    is_active: true
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await User.me();
        
        // Verify if user is admin
        if (userData.role !== "admin") {
          navigate(createPageUrl("Dashboard"));
          return;
        }
        
        // Load investment plans
        const plansData = await InvestmentPlan.list();
        setPlans(plansData);
      } catch (error) {
        console.error("Error loading plans data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [navigate]);

  useEffect(() => {
    // Calculate daily profit and total profit based on other values
    if (formData.value && formData.return_rate && formData.return_period) {
      const totalProfit = formData.value * formData.return_rate / 100;
      const dailyProfit = totalProfit / formData.return_period;
      
      setFormData(prev => ({
        ...prev,
        daily_profit: parseFloat(dailyProfit.toFixed(2)),
        total_profit: parseFloat(totalProfit.toFixed(2))
      }));
    }
  }, [formData.value, formData.return_rate, formData.return_period]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) : value
    }));
  };

  const handleSwitchChange = (checked) => {
    setFormData(prev => ({
      ...prev,
      is_active: checked
    }));
  };

  const openEditDialog = (plan = null) => {
    if (plan) {
      setSelectedPlan(plan);
      setFormData({
        name: plan.name,
        code: plan.code,
        value: plan.value,
        return_rate: plan.return_rate,
        return_period: plan.return_period,
        daily_profit: plan.daily_profit,
        total_profit: plan.total_profit,
        image_url: plan.image_url || "",
        is_active: plan.is_active
      });
      setIsAddNew(false);
    } else {
      setSelectedPlan(null);
      setFormData({
        name: "",
        code: "",
        value: 0,
        return_rate: 0,
        return_period: 50,
        daily_profit: 0,
        total_profit: 0,
        image_url: "",
        is_active: true
      });
      setIsAddNew(true);
    }
    
    setEditDialogOpen(true);
    setSuccess(false);
    setError(null);
  };

  const openDeleteDialog = (plan) => {
    setSelectedPlan(plan);
    setDeleteDialogOpen(true);
    setSuccess(false);
    setError(null);
  };

  const handleSavePlan = async () => {
    setSavingPlan(true);
    setError(null);
    
    try {
      // Validate form data
      if (!formData.name || !formData.code || !formData.value || !formData.return_rate || !formData.return_period) {
        throw new Error("Por favor, preencha todos os campos obrigatórios");
      }
      
      if (formData.value <= 0 || formData.return_rate <= 0 || formData.return_period <= 0) {
        throw new Error("Os valores numéricos devem ser maiores que zero");
      }
      
      // Update or create plan
      if (isAddNew) {
        await InvestmentPlan.create(formData);
      } else {
        await InvestmentPlan.update(selectedPlan.id, formData);
      }
      
      setSuccess(true);
      
      // Reset and reload plan list after 2 seconds
      setTimeout(() => {
        setSuccess(false);
        setEditDialogOpen(false);
        
        // Reload plan list
        InvestmentPlan.list().then(plansData => {
          setPlans(plansData);
        });
      }, 2000);
    } catch (error) {
      setError(error.message || "Erro ao salvar plano. Por favor, tente novamente.");
    } finally {
      setSavingPlan(false);
    }
  };

  const handleDeletePlan = async () => {
    setDeletingPlan(true);
    setError(null);
    
    try {
      if (!selectedPlan) return;
      
      await InvestmentPlan.delete(selectedPlan.id);
      
      setSuccess(true);
      
      // Reset and reload plan list after 2 seconds
      setTimeout(() => {
        setSuccess(false);
        setDeleteDialogOpen(false);
        
        // Reload plan list
        InvestmentPlan.list().then(plansData => {
          setPlans(plansData);
        });
      }, 2000);
    } catch (error) {
      setError(error.message || "Erro ao excluir plano. Por favor, tente novamente.");
    } finally {
      setDeletingPlan(false);
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
        <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Planos</h1>
        <p className="text-gray-600">Administre os planos de investimento da plataforma</p>
      </div>
      
      <div className="flex justify-end">
        <Button
          onClick={() => openEditDialog()}
          className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Plano
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className="backdrop-blur-md bg-white/80 border border-white/60 shadow-sm overflow-hidden">
            <div className="aspect-[16/9] overflow-hidden bg-gray-100 relative">
              <img 
                src={plan.image_url || "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=500&auto=format&fit=crop"}
                alt={plan.name}
                className="w-full h-full object-cover"
              />
              {!plan.is_active && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Badge className="bg-red-100 text-red-800 border-0 text-sm">
                    Inativo
                  </Badge>
                </div>
              )}
            </div>
            <CardHeader className="p-4 pb-0">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-medium">{plan.name}</CardTitle>
                <Badge className="bg-blue-100 text-blue-800 border-0">
                  {plan.code}
                </Badge>
              </div>
              <CardDescription className="flex items-center text-blue-600">
                <Car className="w-4 h-4 mr-1" />
                Modelo BYD
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Valor do plano:</span>
                  <span className="font-bold">R$ {plan.value.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Rendimento:</span>
                  <span className="font-medium text-green-600">{plan.return_rate}% em {plan.return_period} dias</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Lucro diário:</span>
                  <span className="font-medium">R$ {plan.daily_profit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Lucro total:</span>
                  <span className="font-medium">R$ {plan.total_profit.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/50"
                onClick={() => openEditDialog(plan)}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-white/50 text-red-700 border-red-200 hover:bg-red-50"
                onClick={() => openDeleteDialog(plan)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
        
        {plans.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white/50 rounded-lg border border-gray-100">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <Car className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum plano encontrado</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              Você ainda não criou nenhum plano de investimento. Clique em "Novo Plano" para começar.
            </p>
            <Button
              className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
              onClick={() => openEditDialog()}
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Plano
            </Button>
          </div>
        )}
      </div>
      
      {/* Edit Plan Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="backdrop-blur-xl bg-white/90 border border-white/50 shadow-xl max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isAddNew ? "Novo Plano" : "Editar Plano"}</DialogTitle>
            <DialogDescription>
              {isAddNew 
                ? "Adicione um novo plano de investimento" 
                : "Edite as informações do plano de investimento"
              }
            </DialogDescription>
          </DialogHeader>
          
          {success ? (
            <div className="py-6 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Plano {isAddNew ? "Criado" : "Atualizado"} com Sucesso
              </h3>
              <p className="text-gray-600">
                O plano foi {isAddNew ? "criado" : "atualizado"} com sucesso.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <Alert variant="destructive" className="mb-4 bg-red-50/50 backdrop-blur-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="name">Nome do Plano</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ex: Dolphin Mini"
                    className="bg-white/70"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="code">Código do Plano</Label>
                  <Input
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="Ex: DOLPHIN_MINI"
                    className="bg-white/70"
                  />
                  <p className="text-xs text-gray-500">Código único para identificação do plano</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="value">Valor do Investimento (R$)</Label>
                  <Input
                    id="value"
                    name="value"
                    type="number"
                    value={formData.value}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="bg-white/70"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="return_rate">Taxa de Retorno (%)</Label>
                  <Input
                    id="return_rate"
                    name="return_rate"
                    type="number"
                    value={formData.return_rate}
                    onChange={handleChange}
                    placeholder="0"
                    className="bg-white/70"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="return_period">Período de Retorno (dias)</Label>
                  <Input
                    id="return_period"
                    name="return_period"
                    type="number"
                    value={formData.return_period}
                    onChange={handleChange}
                    placeholder="50"
                    className="bg-white/70"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="daily_profit">Lucro Diário (R$) - Calculado automaticamente</Label>
                  <Input
                    id="daily_profit"
                    name="daily_profit"
                    type="number"
                    value={formData.daily_profit}
                    disabled
                    className="bg-gray-50/50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="total_profit">Lucro Total (R$) - Calculado automaticamente</Label>
                  <Input
                    id="total_profit"
                    name="total_profit"
                    type="number"
                    value={formData.total_profit}
                    disabled
                    className="bg-gray-50/50"
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="image_url">URL da Imagem</Label>
                  <Input
                    id="image_url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleChange}
                    placeholder="https://exemplo.com/imagem.jpg"
                    className="bg-white/70"
                  />
                  <p className="text-xs text-gray-500">URL da imagem que representa o plano</p>
                </div>
                
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between bg-blue-50/50 backdrop-blur-sm rounded-lg p-4 border border-blue-100">
                    <div className="space-y-0.5">
                      <h3 className="font-medium text-gray-900">Status do Plano</h3>
                      <p className="text-sm text-gray-600">
                        {formData.is_active 
                          ? "O plano está ativo e visível para os usuários" 
                          : "O plano está inativo e não aparecerá para os usuários"
                        }
                      </p>
                    </div>
                    <Switch 
                      checked={formData.is_active}
                      onCheckedChange={handleSwitchChange}
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>
                </div>
              </div>
              
              <DialogFooter className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSavePlan}
                  className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
                  disabled={savingPlan}
                >
                  {savingPlan ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Plano"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Plan Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="backdrop-blur-xl bg-white/90 border border-white/50 shadow-xl">
          <DialogHeader>
            <DialogTitle>Excluir Plano</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este plano de investimento?
            </DialogDescription>
          </DialogHeader>
          
          {success ? (
            <div className="py-6 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Plano Excluído com Sucesso
              </h3>
              <p className="text-gray-600">
                O plano foi excluído com sucesso.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <Alert variant="destructive" className="mb-4 bg-red-50/50 backdrop-blur-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {selectedPlan && (
                <div className="space-y-4">
                  <div className="bg-red-50/50 backdrop-blur-sm rounded-lg p-4 border border-red-100">
                    <div className="flex items-center gap-3 mb-3">
                      <Trash2 className="w-5 h-5 text-red-600" />
                      <div>
                        <h4 className="font-medium">Excluir Plano</h4>
                        <p className="text-sm text-gray-600">{selectedPlan.name}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Código:</span>
                        <span className="font-medium">{selectedPlan.code}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Valor:</span>
                        <span className="font-medium">
                          R$ {selectedPlan.value.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Alert variant="destructive" className="bg-red-50/50 backdrop-blur-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Esta ação não pode ser desfeita. Os investimentos existentes neste plano não serão afetados.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              
              <DialogFooter className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeletePlan}
                  disabled={deletingPlan}
                >
                  {deletingPlan ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    "Excluir Plano"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}