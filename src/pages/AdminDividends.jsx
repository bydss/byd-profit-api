import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { Dividend } from "@/api/entities";
import { AutoPaymentConfig } from "@/api/entities";
import { Transaction } from "@/api/entities";
import { InvestmentPlan } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  DollarSign,
  Calendar,
  Users,
  TrendingUp,
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  BarChart3,
  Filter,
  Search,
  Settings
} from "lucide-react";
import { format, addDays, isToday, parseISO } from "date-fns";

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

export default function AdminDividends() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [dividends, setDividends] = useState([]);
  const [autoPaymentConfig, setAutoPaymentConfig] = useState({
    is_active: false,
    payment_time: "09:00",
    last_payment_date: null,
    total_users_paid: 0,
    total_amount_paid: 0,
    next_payment_date: null
  });
  const [configId, setConfigId] = useState(null);
  const [filteredDividends, setFilteredDividends] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [generatingDividends, setGeneratingDividends] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedDividends, setSelectedDividends] = useState([]);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalPending: 0,
    totalPaid: 0,
    amountPending: 0,
    amountPaid: 0
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await User.me();
        
        if (userData.role !== "admin") {
          navigate(createPageUrl("Dashboard"));
          return;
        }
        
        setUser(userData);
        
        // Load dividends
        await loadDividends();
        
        // Load auto payment configuration
        await loadAutoPaymentConfig();
      } catch (error) {
        console.error("Error loading dividends data:", error);
        setError("Erro ao carregar dados dos dividendos.");
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [navigate]);

  const loadDividends = async () => {
    try {
      const dividendsData = await Dividend.list("-dividend_date");
      setDividends(dividendsData);
      setFilteredDividends(dividendsData);
      
      // Calculate stats
      const pending = dividendsData.filter(d => d.status === "pending");
      const paid = dividendsData.filter(d => d.status === "paid");
      
      setStats({
        totalPending: pending.length,
        totalPaid: paid.length,
        amountPending: pending.reduce((sum, d) => sum + (d?.dividend_amount || 0), 0),
        amountPaid: paid.reduce((sum, d) => sum + (d?.dividend_amount || 0), 0)
      });
    } catch (error) {
      console.error("Error loading dividends:", error);
    }
  };

  const loadAutoPaymentConfig = async () => {
    try {
      const configData = await AutoPaymentConfig.list();
      if (configData.length > 0) {
        setAutoPaymentConfig(configData[0]);
        setConfigId(configData[0].id);
      } else {
        const newConfig = await AutoPaymentConfig.create(autoPaymentConfig);
        setAutoPaymentConfig(newConfig);
        setConfigId(newConfig.id);
      }
    } catch (error) {
      console.error("Error loading auto payment config:", error);
    }
  };

  useEffect(() => {
    let filtered = [...dividends];
    
    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(d => d.status === filterStatus);
    }
    
    // Apply date filter
    if (filterDate) {
      filtered = filtered.filter(d => d.dividend_date === filterDate);
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(d => 
        d.plan_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.user_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredDividends(filtered);
  }, [searchTerm, filterStatus, filterDate, dividends]);

  const handleAutoPaymentToggle = async (enabled) => {
    try {
      const updatedConfig = {
        ...autoPaymentConfig,
        is_active: enabled,
        next_payment_date: enabled ? format(addDays(new Date(), 1), "yyyy-MM-dd") : null
      };
      
      await AutoPaymentConfig.update(configId, updatedConfig);
      setAutoPaymentConfig(updatedConfig);
    } catch (error) {
      console.error("Error updating auto payment config:", error);
      setError("Erro ao atualizar configuração de pagamento automático.");
    }
  };

  const generateDailyDividends = async () => {
    setGeneratingDividends(true);
    setError(null);
    
    try {
      // Get all investment plans and filter active ones
      const allPlans = await InvestmentPlan.list();
      const plans = allPlans.filter(plan => plan.is_active);
      
      // Get all users with active investments
      const users = await User.list();
      const today = format(new Date(), "yyyy-MM-dd");
      
      let generatedCount = 0;
      
      for (const user of users) {
        // Check if user has active investments
        if (user.current_investment && user.current_investment > 0) {
          // Find the user's investment plan
          const userPlan = plans.find(p => p.value === user.current_investment);
          
          if (userPlan) {
            // Check if dividend for today already exists
            const existingDividends = await Dividend.filter({
              user_id: user.id,
              dividend_date: today
            });
            
            if (existingDividends.length === 0) {
              // Create dividend for today
              await Dividend.create({
                user_id: user.id,
                investment_plan_id: userPlan.id,
                plan_name: userPlan.name,
                investment_amount: user.current_investment,
                dividend_amount: userPlan.daily_profit,
                dividend_date: today,
                status: "pending"
              });
              
              generatedCount++;
            }
          }
        }
      }
      
      await loadDividends();
      setError(null);
      
      // Show success message
      alert(`${generatedCount} dividendos gerados para hoje!`);
    } catch (error) {
      console.error("Error generating dividends:", error);
      setError("Erro ao gerar dividendos diários.");
    } finally {
      setGeneratingDividends(false);
    }
  };

  const processAutomaticPayments = async () => {
    setProcessingPayment(true);
    setError(null);
    
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      
      // Get pending dividends for today
      const pendingDividends = await Dividend.filter({
        status: "pending",
        dividend_date: today
      });
      
      let processedCount = 0;
      let totalAmount = 0;
      
      for (const dividend of pendingDividends) {
        // Get user
        const users = await User.filter({ id: dividend.user_id });
        if (users.length === 0) continue;
        
        const user = users[0];
        
        // Create transaction
        const transaction = await Transaction.create({
          user_id: user.id,
          type: "investment_return",
          amount: dividend.dividend_amount,
          status: "completed",
          description: `Dividendo ${dividend.plan_name} - ${format(new Date(), "dd/MM/yyyy")}`,
          payment_method: "balance"
        });
        
        // Update user balance
        await User.update(user.id, {
          balance: (user.balance || 0) + dividend.dividend_amount,
          total_earnings: (user.total_earnings || 0) + dividend.dividend_amount
        });
        
        // Update dividend status
        await Dividend.update(dividend.id, {
          status: "paid",
          paid_date: new Date().toISOString(),
          transaction_id: transaction.id,
          payment_method: "automatic"
        });
        
        processedCount++;
        totalAmount += dividend.dividend_amount;
      }
      
      // Update auto payment config
      await AutoPaymentConfig.update(configId, {
        ...autoPaymentConfig,
        last_payment_date: today,
        total_users_paid: processedCount,
        total_amount_paid: totalAmount,
        next_payment_date: format(addDays(new Date(), 1), "yyyy-MM-dd")
      });
      
      await loadDividends();
      await loadAutoPaymentConfig();
      
      alert(`Pagamento automático processado! ${processedCount} usuários receberam R$ ${totalAmount.toFixed(2)}`);
    } catch (error) {
      console.error("Error processing automatic payments:", error);
      setError("Erro ao processar pagamentos automáticos.");
    } finally {
      setProcessingPayment(false);
    }
  };

  const paySelectedDividends = async () => {
    setProcessingPayment(true);
    setError(null);
    
    try {
      for (const dividendId of selectedDividends) {
        const dividend = dividends.find(d => d.id === dividendId);
        if (!dividend || dividend.status !== "pending") continue;
        
        // Get user
        const users = await User.filter({ id: dividend.user_id });
        if (users.length === 0) continue;
        
        const user = users[0];
        
        // Create transaction
        const transaction = await Transaction.create({
          user_id: user.id,
          type: "investment_return",
          amount: dividend.dividend_amount,
          status: "completed",
          description: `Dividendo ${dividend.plan_name} - ${format(parseISO(dividend.dividend_date), "dd/MM/yyyy")}`,
          payment_method: "balance"
        });
        
        // Update user balance
        await User.update(user.id, {
          balance: (user.balance || 0) + dividend.dividend_amount,
          total_earnings: (user.total_earnings || 0) + dividend.dividend_amount
        });
        
        // Update dividend status
        await Dividend.update(dividend.id, {
          status: "paid",
          paid_date: new Date().toISOString(),
          transaction_id: transaction.id,
          payment_method: "manual"
        });
      }
      
      setPaymentSuccess(true);
      setSelectedDividends([]);
      
      setTimeout(() => {
        setPaymentSuccess(false);
        setPaymentDialogOpen(false);
        loadDividends();
      }, 2000);
    } catch (error) {
      console.error("Error paying dividends:", error);
      setError("Erro ao processar pagamentos.");
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleDividendSelect = (dividendId, checked) => {
    if (checked) {
      setSelectedDividends([...selectedDividends, dividendId]);
    } else {
      setSelectedDividends(selectedDividends.filter(id => id !== dividendId));
    }
  };

  const selectAllPending = () => {
    const pendingIds = filteredDividends
      .filter(d => d.status === "pending")
      .map(d => d.id);
    setSelectedDividends(pendingIds);
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
        <h1 className="text-2xl font-bold text-gray-900">Gestão de Dividendos</h1>
        <p className="text-gray-600">Controle os pagamentos de dividendos dos investimentos</p>
      </div>
      
      {error && (
        <Alert variant="destructive" className="bg-red-50/50 backdrop-blur-sm">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="backdrop-blur-md bg-white/40 border border-white/30 p-1">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="dividends">Lista de Dividendos</TabsTrigger>
          <TabsTrigger value="config">Configurações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-md">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Dividendos Pendentes</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.totalPending}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-yellow-600">
                  R$ {stats.amountPending.toFixed(2)} aguardando pagamento
                </div>
              </CardContent>
            </Card>
            
            <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-md">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Dividendos Pagos</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.totalPaid}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-green-600">
                  R$ {stats.amountPaid.toFixed(2)} já processados
                </div>
              </CardContent>
            </Card>
            
            <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-md">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Pagamento Automático</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      {autoPaymentConfig.is_active ? "Ativo" : "Inativo"}
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    autoPaymentConfig.is_active ? "bg-blue-100" : "bg-gray-100"
                  }`}>
                    {autoPaymentConfig.is_active ? (
                      <Zap className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Pause className="h-5 w-5 text-gray-600" />
                    )}
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-600">
                  {autoPaymentConfig.is_active 
                    ? `Próximo: ${autoPaymentConfig.next_payment_date ? format(parseISO(autoPaymentConfig.next_payment_date), "dd/MM/yyyy") : "N/A"}`
                    : "Configure para ativar"
                  }
                </div>
              </CardContent>
            </Card>
            
            <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-md">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Último Processamento</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      {autoPaymentConfig.total_users_paid || 0}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-purple-600">
                  R$ {(autoPaymentConfig.total_amount_paid || 0).toFixed(2)} processados
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-lg">
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
                <CardDescription>
                  Gerencie dividendos e pagamentos
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <Button
                  onClick={generateDailyDividends}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
                  disabled={generatingDividends}
                >
                  {generatingDividends ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Calendar className="mr-2 h-4 w-4" />
                      Gerar Dividendos de Hoje
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={processAutomaticPayments}
                  variant="outline"
                  className="w-full bg-white/50 border-green-200 text-green-700 hover:bg-green-50"
                  disabled={processingPayment || stats.totalPending === 0}
                >
                  {processingPayment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Processar Pagamentos Hoje
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={() => {
                    const pendingIds = filteredDividends
                      .filter(d => d.status === "pending")
                      .map(d => d.id);
                    setSelectedDividends(pendingIds);
                    setPaymentDialogOpen(true);
                  }}
                  variant="outline"
                  className="w-full"
                  disabled={stats.totalPending === 0}
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Pagar Dividendos Selecionados
                </Button>
              </CardContent>
            </Card>
            
            <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-lg">
              <CardHeader>
                <CardTitle>Status do Sistema</CardTitle>
                <CardDescription>
                  Informações sobre pagamentos automáticos
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Pagamento Automático</span>
                  <Switch
                    checked={autoPaymentConfig.is_active}
                    onCheckedChange={handleAutoPaymentToggle}
                  />
                </div>
                
                {autoPaymentConfig.last_payment_date && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Último pagamento:</span>
                      <span>{formatDateSafe(autoPaymentConfig.last_payment_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Usuários atendidos:</span>
                      <span>{autoPaymentConfig.total_users_paid}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valor processado:</span>
                      <span>R$ {(autoPaymentConfig.total_amount_paid || 0).toFixed(2)}</span>
                    </div>
                  </div>
                )}
                
                <div className="bg-blue-50/50 backdrop-blur-sm rounded-lg p-3 border border-blue-100">
                  <p className="text-sm text-blue-700">
                    {autoPaymentConfig.is_active
                      ? `Próximo pagamento automático será processado em ${autoPaymentConfig.next_payment_date ? formatDateSafe(autoPaymentConfig.next_payment_date) : "N/A"} às ${autoPaymentConfig.payment_time}.`
                      : "Ative o pagamento automático para processar dividendos diariamente."
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="dividends">
          <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-lg">
            <CardHeader>
              <CardTitle>Lista de Dividendos</CardTitle>
              <CardDescription>
                Todos os dividendos gerados no sistema
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <Input
                    placeholder="Buscar por plano ou usuário"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/70"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32 bg-white/50">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendentes</SelectItem>
                      <SelectItem value="paid">Pagos</SelectItem>
                      <SelectItem value="cancelled">Cancelados</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-40 bg-white/50"
                  />
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllPending}
                    disabled={filteredDividends.filter(d => d.status === "pending").length === 0}
                  >
                    Selecionar Pendentes
                  </Button>
                </div>
              </div>
              
              {/* Dividends Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        <input
                          type="checkbox"
                          checked={selectedDividends.length === filteredDividends.filter(d => d.status === "pending").length && selectedDividends.length > 0}
                          onChange={(e) => e.target.checked ? selectAllPending() : setSelectedDividends([])}
                          className="rounded"
                        />
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Usuário</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Plano</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Data</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">Valor</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Método</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDividends.map((dividend) => (
                      <tr key={dividend.id} className="border-b border-gray-100 hover:bg-white/50 transition-colors">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedDividends.includes(dividend.id)}
                            onChange={(e) => handleDividendSelect(dividend.id, e.target.checked)}
                            disabled={dividend.status !== "pending"}
                            className="rounded"
                          />
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <div className="font-mono text-xs">
                            {dividend.user_id?.substring(0, 8)}...
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {dividend.plan_name}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatDateSafe(dividend.dividend_date)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium">
                          R$ {(dividend?.dividend_amount || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={
                            dividend.status === "paid" 
                              ? "bg-green-100 text-green-800"
                              : dividend.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }>
                            {dividend.status === "paid" ? "Pago" :
                             dividend.status === "pending" ? "Pendente" : "Cancelado"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {dividend.payment_method === "automatic" ? "Automático" : 
                           dividend.payment_method === "manual" ? "Manual" : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredDividends.length === 0 && (
                  <div className="py-8 text-center text-gray-500">
                    Nenhum dividendo encontrado com os filtros aplicados
                  </div>
                )}
              </div>
              
              {selectedDividends.length > 0 && (
                <div className="mt-4 flex justify-between items-center bg-blue-50/50 backdrop-blur-sm rounded-lg p-4 border border-blue-100">
                  <span className="text-sm text-blue-700">
                    {selectedDividends.length} dividendos selecionados
                  </span>
                  <Button
                    onClick={() => setPaymentDialogOpen(true)}
                    className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800"
                  >
                    Processar Pagamentos
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="config">
          <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-lg">
            <CardHeader>
              <CardTitle>Configurações de Pagamento Automático</CardTitle>
              <CardDescription>
                Configure como os dividendos serão processados automaticamente
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between bg-blue-50/50 backdrop-blur-sm rounded-lg p-4 border border-blue-100">
                <div>
                  <h3 className="font-medium text-gray-900">Pagamento Automático</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Processa dividendos automaticamente todos os dias no horário configurado
                  </p>
                </div>
                <Switch
                  checked={autoPaymentConfig.is_active}
                  onCheckedChange={handleAutoPaymentToggle}
                />
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="payment-time">Horário de Processamento</Label>
                  <Input
                    id="payment-time"
                    type="time"
                    value={autoPaymentConfig.payment_time}
                    onChange={(e) => setAutoPaymentConfig({
                      ...autoPaymentConfig,
                      payment_time: e.target.value
                    })}
                    className="bg-white/70"
                  />
                  <p className="text-xs text-gray-500">
                    Horário diário para processar pagamentos automáticos
                  </p>
                </div>
              </div>
              
              <div className="bg-yellow-50/50 backdrop-blur-sm rounded-lg p-4 border border-yellow-100">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800 mb-1">Importante</h4>
                    <p className="text-sm text-yellow-700">
                      O pagamento automático processará todos os dividendos pendentes do dia atual.
                      Certifique-se de gerar os dividendos diários antes de ativar o pagamento automático.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="backdrop-blur-xl bg-white/90 border border-white/50 shadow-xl">
          <DialogHeader>
            <DialogTitle>Processar Pagamentos</DialogTitle>
            <DialogDescription>
              Confirme o pagamento dos dividendos selecionados
            </DialogDescription>
          </DialogHeader>
          
          {paymentSuccess ? (
            <div className="py-6 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Pagamentos Processados
              </h3>
              <p className="text-gray-600">
                Os dividendos foram pagos com sucesso.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="bg-blue-50/50 backdrop-blur-sm rounded-lg p-4 border border-blue-100">
                  <h4 className="font-medium mb-2">Resumo do Pagamento</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dividendos selecionados:</span>
                      <span className="font-medium">{selectedDividends.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valor total:</span>
                      <span className="font-medium text-green-600">
                        R$ {selectedDividends
                          .map(id => dividends.find(d => d.id === id))
                          .filter(Boolean)
                          .reduce((sum, d) => sum + (d?.dividend_amount || 0), 0)
                          .toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <Alert className="bg-green-50/50 backdrop-blur-sm border-green-100">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    Os valores serão creditados nas contas dos usuários e as transações serão registradas automaticamente.
                  </AlertDescription>
                </Alert>
              </div>
              
              <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPaymentDialogOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={paySelectedDividends}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800"
                  disabled={processingPayment}
                >
                  {processingPayment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    "Confirmar Pagamentos"
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