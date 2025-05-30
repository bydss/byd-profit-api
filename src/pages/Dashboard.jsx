import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { InvestmentPlan } from "@/api/entities";
import { Referral } from "@/api/entities";
import { auth } from "@/api/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, TrendingUp, Users, Wallet, ArrowUpRight, DollarSign, Clock, BarChart3 } from "lucide-react";
import { format } from "date-fns";

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

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [plans, setPlans] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [investments, setInvestments] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Verificar se o usuário está autenticado
        if (!auth.isAuthenticated()) {
          navigate(createPageUrl("Login"));
          return;
        }

        const userData = await auth.me();
        
        // Se não houver dados do usuário, redirecionar para login
        if (!userData) {
          navigate(createPageUrl("Login"));
          return;
        }
        
        // Redirect if profile is not complete
        if (!userData.profile_complete) {
          navigate(createPageUrl("Profile"));
          return;
        }
        
        setUser(userData);
        
        // Set user's investments
        setInvestments(Array.isArray(userData.active_investments) ? userData.active_investments : []);
        
        // Load investment plans
        const plansData = await InvestmentPlan.list();
        setPlans(plansData);
        
        // Load user's referrals
        const referralsData = await Referral.filter({ referrer_id: userData.id });
        setReferrals(referralsData);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        // Se houver erro de autenticação, redirecionar para login
        if (error.message?.includes("não autenticado")) {
          navigate(createPageUrl("Login"));
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadData();

    // Adicionar listener para atualização de dados
    const handleDataUpdate = () => {
      loadData();
    };

    window.addEventListener('dataUpdated', handleDataUpdate);

    return () => {
      window.removeEventListener('dataUpdated', handleDataUpdate);
    };
  }, [navigate]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Calculate summary data
  const totalInvested = Array.isArray(investments) ? investments.reduce((sum, inv) => sum + (inv?.amount || 0), 0) : 0;
  const totalEarnings = user?.total_earnings || 0;
  const activeInvestmentsCount = Array.isArray(investments) ? investments.length : 0;
  const referralsCount = referrals?.length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bem-vindo, {user?.full_name?.split(' ')[0] || 'Usuário'}</h1>
        <p className="text-gray-600">Acompanhe seus investimentos e ganhos na BYD Profit</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-md overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Saldo Disponível</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  R$ {(user?.balance || 0).toFixed(2)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <Link to={createPageUrl("Finances")}>
                <Button variant="outline" size="sm" className="w-full text-xs bg-white/70 border-green-200 text-green-700 hover:bg-green-50">
                  Gerenciar Fundos
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-md overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Ganhos Totais</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  R$ {totalEarnings.toFixed(2)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-green-600">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              <span>Rendimentos contínuos</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-md overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Investimentos Ativos</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {activeInvestmentsCount}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <Link to={createPageUrl("Investments")}>
                <Button variant="outline" size="sm" className="w-full text-xs bg-white/70 border-purple-200 text-purple-700 hover:bg-purple-50">
                  Ver Investimentos
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-md overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Indicações</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {referralsCount}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
            <div className="mt-4">
              <Link to={createPageUrl("Referrals")}>
                <Button variant="outline" size="sm" className="w-full text-xs bg-white/70 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                  Programa de Indicação
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="investments" className="space-y-6">
        <TabsList className="backdrop-blur-md bg-white/40 border border-white/30 p-1">
          <TabsTrigger value="investments">Meus Investimentos</TabsTrigger>
          <TabsTrigger value="opportunities">Oportunidades</TabsTrigger>
        </TabsList>
        
        <TabsContent value="investments">
          <div className="bg-gradient-to-r from-blue-50/30 to-indigo-50/30 backdrop-blur-sm rounded-lg p-6 border border-blue-100/50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Investimentos Ativos</h3>
            
            {Array.isArray(investments) && investments.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {investments.map((investment, index) => {
                  const plan = plans?.find(p => p?.code === investment?.plan_id);
                  return (
                    <Card key={index} className="backdrop-blur-md bg-white/80 border border-white/60 shadow-sm overflow-hidden">
                      <CardHeader className="p-4 pb-0">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base font-medium">{plan?.name || investment?.plan_id || 'Plano'}</CardTitle>
                          <Badge className="bg-green-100 text-green-800 border-0">Ativo</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Valor investido:</span>
                            <span className="font-medium">R$ {(investment?.amount || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Rendimento diário:</span>
                            <span className="font-medium text-green-600">R$ {(investment?.daily_return || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Data de início:</span>
                            <span className="font-medium">{formatDateSafe(investment?.start_date)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 bg-white/50 rounded-lg border border-blue-50">
                <Clock className="w-12 h-12 mx-auto text-blue-300 mb-2" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum investimento ativo</h3>
                <p className="text-gray-600 mb-4">Comece agora mesmo a investir na BYD Profit</p>
                <Link to={createPageUrl("Investments")}>
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800">
                    Ver Oportunidades
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="opportunities">
          <div className="bg-gradient-to-r from-blue-50/30 to-indigo-50/30 backdrop-blur-sm rounded-lg p-6 border border-blue-100/50">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Planos de Investimento</h3>
                <p className="text-gray-600">Escolha o melhor plano para você</p>
              </div>
              <Link to={createPageUrl("Investments")}>
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800">
                  Ver Todos os Planos
                </Button>
              </Link>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plans?.slice(0, 3).map((plan) => (
                <Card key={plan?.id} className="backdrop-blur-md bg-white/80 border border-white/60 shadow-sm overflow-hidden">
                  <div className="aspect-[16/9] overflow-hidden bg-gray-100">
                    <img 
                      src={plan?.image_url || "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=500&auto=format&fit=crop"}
                      alt={plan?.name || 'Plano de Investimento'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardHeader className="p-4 pb-0">
                    <CardTitle className="text-base font-medium">{plan?.name || 'Plano'}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm">Valor:</span>
                        <span className="font-bold">R$ {(plan?.value || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm">Rendimento:</span>
                        <span className="font-medium text-green-600">{plan?.return_rate || 0}% em {plan?.return_period || 0} dias</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm">Lucro diário:</span>
                        <span className="font-medium">R$ {(plan?.daily_profit || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Link to={`${createPageUrl("Investments")}?select=${plan?.id}`} className="w-full">
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800">
                        Investir Agora
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="bg-gradient-to-r from-indigo-50/30 to-purple-50/30 backdrop-blur-sm rounded-lg p-6 border border-indigo-100/50">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Programa de Indicação</h3>
            <p className="text-gray-600">Compartilhe e ganhe bônus com suas indicações</p>
          </div>
          <Link to={createPageUrl("Referrals")}>
            <Button variant="outline" className="bg-white/50 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
              Meu Link de Indicação
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="backdrop-blur-md bg-white/80 border border-white/60 shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-indigo-600 mb-1">17%</div>
              <p className="text-sm text-gray-600">1º Nível</p>
            </CardContent>
          </Card>
          <Card className="backdrop-blur-md bg-white/80 border border-white/60 shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-indigo-600 mb-1">2%</div>
              <p className="text-sm text-gray-600">2º Nível</p>
            </CardContent>
          </Card>
          <Card className="backdrop-blur-md bg-white/80 border border-white/60 shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-indigo-600 mb-1">1%</div>
              <p className="text-sm text-gray-600">3º Nível</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex justify-center">
          <Link to={createPageUrl("Referrals")}>
            <Button className="bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800">
              <Users className="w-4 h-4 mr-2" />
              Acessar Programa de Indicação
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}