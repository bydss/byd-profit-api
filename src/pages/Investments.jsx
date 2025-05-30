import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { InvestmentPlan } from "@/api/entities";
import { Transaction } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Car, ArrowRight, InfoIcon, CheckCircle2, AlertTriangle } from "lucide-react";
import { format, addDays } from "date-fns";

const formatDateSafe = (dateStr) => {
  try {
    if (!dateStr) return "Data não disponível";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Data inválida";
    return format(date, "dd/MM/yyyy");
  } catch (error) {
    return "Data inválida";
  }
};

export default function Investments() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [investments, setInvestments] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [processingInvestment, setProcessingInvestment] = useState(false);
  const [investmentSuccess, setInvestmentSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await User.me();
        
        // Redirect if profile is not complete
        if (!userData.profile_complete) {
          navigate(createPageUrl("Profile"));
          return;
        }
        
        setUser(userData);
        
        // Load investment plans
        const plansData = await InvestmentPlan.list();
        setPlans(plansData);
        
        // Set user's investments, garantindo que seja um array
        const userInvestments = Array.isArray(userData.active_investments) ? userData.active_investments : [];
        setInvestments(userInvestments);
        
        // Check if there's a plan to select from URL
        const urlParams = new URLSearchParams(location.search);
        const selectPlanId = urlParams.get("select");
        if (selectPlanId) {
          const planToSelect = plansData.find(p => p.id === selectPlanId);
          if (planToSelect) {
            setSelectedPlan(planToSelect);
            setConfirmDialogOpen(true);
          }
        }
      } catch (error) {
        console.error("Error loading investments data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [navigate, location.search]);

  const handleInvestment = async () => {
    if (!selectedPlan) return;
    
    setProcessingInvestment(true);
    setError(null);
    
    try {
      // Check if user has enough balance
      if (user.balance < selectedPlan.value) {
        throw new Error("Saldo insuficiente para realizar este investimento");
      }
      
      // Create investment record
      const startDate = new Date();
      const endDate = addDays(startDate, selectedPlan.return_period);
      
      const newInvestment = {
        plan_id: selectedPlan.code,
        amount: selectedPlan.value,
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
        daily_return: selectedPlan.daily_profit
      };
      
      // Garantir que user.active_investments seja um array
      const currentInvestments = Array.isArray(user.active_investments) ? user.active_investments : [];
      const updatedInvestments = [...currentInvestments, newInvestment];
      const newBalance = user.balance - selectedPlan.value;
      
      // Update user record
      await User.updateMyUserData({
        active_investments: updatedInvestments,
        balance: newBalance
      });
      
      // Create transaction record
      await Transaction.create({
        user_id: user.id,
        type: "investment_return",
        amount: -selectedPlan.value,
        status: "completed",
        description: `Investimento em ${selectedPlan.name}`,
        payment_method: "balance",
        reference_id: selectedPlan.code
      });
      
      // Reload user data
      const updatedUser = await User.me();
      // Garantir que os investimentos do usuário atualizado sejam um array
      const updatedUserInvestments = Array.isArray(updatedUser.active_investments) ? updatedUser.active_investments : [];
      setUser(updatedUser);
      setInvestments(updatedUserInvestments);
      
      setInvestmentSuccess(true);
      
      // Reset after 3 seconds
      setTimeout(() => {
        setInvestmentSuccess(false);
        setConfirmDialogOpen(false);
      }, 3000);
    } catch (error) {
      setError(error.message || "Erro ao processar investimento. Por favor, tente novamente.");
    } finally {
      setProcessingInvestment(false);
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
        <h1 className="text-2xl font-bold text-gray-900">Investimentos</h1>
        <p className="text-gray-600">Gerencie seus investimentos e explore novos planos</p>
      </div>
      
      <Tabs defaultValue="plans" className="space-y-6">
        <TabsList className="backdrop-blur-md bg-white/40 border border-white/30 p-1">
          <TabsTrigger value="plans">Planos Disponíveis</TabsTrigger>
          <TabsTrigger value="my-investments">Meus Investimentos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="plans">
          <div className="bg-gradient-to-r from-blue-50/30 to-indigo-50/30 backdrop-blur-sm rounded-lg p-6 border border-blue-100/50">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Planos de Investimento BYD Profit</h2>
              <p className="text-gray-600">Escolha entre nossos planos de investimento e comece a lucrar com a revolução elétrica</p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <Card key={plan.id} className="backdrop-blur-md bg-white/80 border border-white/60 shadow-sm overflow-hidden">
                  <div className="aspect-[16/9] overflow-hidden bg-gray-100">
                    <img 
                      src={plan.image_url || "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=500&auto=format&fit=crop"}
                      alt={plan.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardHeader className="p-4 pb-0">
                    <CardTitle className="text-lg font-medium">{plan.name}</CardTitle>
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
                      <Separator className="my-2" />
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
                  <CardFooter className="p-4 pt-0">
                    <Button
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
                      onClick={() => {
                        setSelectedPlan(plan);
                        setConfirmDialogOpen(true);
                      }}
                    >
                      Investir Agora
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="my-investments">
          <div className="bg-gradient-to-r from-blue-50/30 to-indigo-50/30 backdrop-blur-sm rounded-lg p-6 border border-blue-100/50">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Meus Investimentos Ativos</h2>
              <p className="text-gray-600">Acompanhe o desempenho dos seus investimentos na BYD Profit</p>
            </div>
            
            {investments.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {investments.map((investment, index) => {
                  const plan = plans.find(p => p.code === investment.plan_id);
                  const startDate = new Date(investment.start_date);
                  const endDate = new Date(investment.end_date);
                  const totalDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
                  const daysElapsed = Math.round((new Date() - startDate) / (1000 * 60 * 60 * 24));
                  const progressPercent = Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100));
                  
                  return (
                    <Card key={index} className="backdrop-blur-md bg-white/80 border border-white/60 shadow-sm overflow-hidden">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-lg font-medium">{plan?.name || investment.plan_id}</CardTitle>
                        <CardDescription>
                          Investimento iniciado em {formatDateSafe(investment.start_date)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500 text-sm">Valor investido:</span>
                              <span className="font-bold">R$ {investment.amount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500 text-sm">Rendimento diário:</span>
                              <span className="font-medium text-green-600">R$ {investment.daily_return.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500 text-sm">Ganhos até agora:</span>
                              <span className="font-medium">R$ {(investment.daily_return * daysElapsed).toFixed(2)}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Progresso</span>
                              <span>{Math.round(progressPercent)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full" 
                                style={{ width: `${progressPercent}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>{formatDateSafe(investment.start_date)}</span>
                              <span>{formatDateSafe(investment.end_date)}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-white/50 rounded-lg border border-blue-50">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                  <InfoIcon className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum investimento ativo</h3>
                <p className="text-gray-600 max-w-md mx-auto mb-6">
                  Você ainda não possui investimentos ativos. Escolha um dos nossos planos e comece a lucrar com a revolução elétrica.
                </p>
                <Button
                  className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
                  onClick={() => document.querySelector('button[value="plans"]').click()}
                >
                  Ver Planos Disponíveis
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Investment Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="backdrop-blur-xl bg-white/90 border border-white/50 shadow-xl">
          <DialogHeader>
            <DialogTitle>Confirmar Investimento</DialogTitle>
            <DialogDescription>
              Revise os detalhes do seu investimento antes de confirmar
            </DialogDescription>
          </DialogHeader>
          
          {investmentSuccess ? (
            <div className="py-6 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Investimento Realizado com Sucesso!</h3>
              <p className="text-gray-600">
                Seu investimento foi processado e já está ativo
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
                  <div className="bg-blue-50/50 backdrop-blur-sm rounded-lg p-4 border border-blue-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Car className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{selectedPlan.name}</h4>
                        <p className="text-sm text-gray-600">Plano de Investimento BYD</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">Valor do investimento</p>
                        <p className="font-semibold">R$ {selectedPlan.value.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Rendimento</p>
                        <p className="font-semibold">{selectedPlan.return_rate}% em {selectedPlan.return_period} dias</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Lucro diário</p>
                        <p className="font-semibold text-green-600">R$ {selectedPlan.daily_profit.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Lucro total</p>
                        <p className="font-semibold text-green-600">R$ {selectedPlan.total_profit.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-indigo-50/50 backdrop-blur-sm rounded-lg p-4 border border-indigo-100">
                    <h4 className="font-medium mb-2">Detalhes do Pagamento</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Saldo atual:</span>
                        <span className="font-medium">R$ {user.balance.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Valor do investimento:</span>
                        <span className="font-medium">R$ {selectedPlan.value.toFixed(2)}</span>
                      </div>
                      <Separator className="my-1" />
                      <div className="flex justify-between">
                        <span className="text-gray-600">Saldo após investimento:</span>
                        <span className="font-medium">R$ {(user.balance - selectedPlan.value).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => setConfirmDialogOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleInvestment}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
                  disabled={processingInvestment || (selectedPlan && user.balance < selectedPlan.value)}
                >
                  {processingInvestment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    "Confirmar Investimento"
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