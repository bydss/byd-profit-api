import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { Transaction } from "@/api/entities";
import { SystemConfig } from "@/api/entities";
import { auth } from "@/api/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  AlertCircle,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  Clock,
  Filter,
  Info,
  Users,
} from "lucide-react";
import { format } from "date-fns";

const formatDateSafe = (dateStr) => {
  try {
    if (!dateStr) return "Data não disponível";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Data inválida";
    return format(date, dateStr.includes("T") ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy");
  } catch (error) {
    return "Data inválida";
  }
};

export default function Finances() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [systemConfig, setSystemConfig] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [processingTransaction, setProcessingTransaction] = useState(false);
  const [transactionSuccess, setTransactionSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [activeTab, setActiveTab] = useState("transactions");

  useEffect(() => {
    const loadData = async () => {
      try {
        // Verificar se o usuário está autenticado
        if (!auth.isAuthenticated()) {
          navigate(createPageUrl("Login"));
          return;
        }

        const userData = await auth.me();
        
        // Redirect if profile is not complete
        if (!userData.profile_complete) {
          navigate(createPageUrl("Profile"));
          return;
        }
        
        setUser(userData);
        
        // Load user's transactions
        const transactionsData = await Transaction.filter({ user_id: userData.id }, "-created_at");
        setTransactions(transactionsData);
        
        // Load system configuration
        const configData = await SystemConfig.list();
        if (configData.length > 0) {
          setSystemConfig(configData[0]);
        }
      } catch (error) {
        console.error("Error loading finances data:", error);
        // Se houver erro de autenticação, redirecionar para login
        if (error.message?.includes("não autenticado")) {
          navigate(createPageUrl("Login"));
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [navigate]);

  const handleDeposit = async () => {
    setProcessingTransaction(true);
    setError(null);
    
    try {
      const amount = parseFloat(depositAmount);
      
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Por favor, insira um valor válido");
      }
      
      // Create transaction record
      await Transaction.create({
        user_id: user.id,
        type: "deposit",
        amount: amount,
        status: "pending",
        description: "Depósito via PIX",
        payment_method: "pix"
      });
      
      setTransactionSuccess(true);
      
      // Reset after 3 seconds
      setTimeout(() => {
        setTransactionSuccess(false);
        setDialogOpen(false);
        setDepositAmount("");
        
        // Reload transactions
        loadTransactions();
      }, 3000);
    } catch (error) {
      setError(error.message || "Erro ao processar depósito. Por favor, tente novamente.");
    } finally {
      setProcessingTransaction(false);
    }
  };

  const handleWithdrawal = async () => {
    setProcessingTransaction(true);
    setError(null);
    
    try {
      const amount = parseFloat(withdrawalAmount);
      
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Por favor, insira um valor válido");
      }
      
      if (amount < systemConfig.min_withdrawal) {
        throw new Error(`O valor mínimo para saque é R$ ${systemConfig.min_withdrawal.toFixed(2)}`);
      }
      
      if (amount > user.balance) {
        throw new Error("Saldo insuficiente para realizar este saque");
      }
      
      // Calculate fee
      const fee = (amount * systemConfig.withdrawal_fee) / 100;
      const amountAfterFee = amount - fee;
      
      // Create transaction record
      await Transaction.create({
        user_id: user.id,
        type: "withdrawal",
        amount: -amount,
        status: "pending",
        description: `Saque via PIX (Taxa: ${systemConfig.withdrawal_fee}%)`,
        payment_method: "pix"
      });
      
      // Update user balance
      await User.updateMyUserData({
        balance: user.balance - amount
      });
      
      setTransactionSuccess(true);
      
      // Reset after 3 seconds
      setTimeout(() => {
        setTransactionSuccess(false);
        setDialogOpen(false);
        setWithdrawalAmount("");
        
        // Reload user and transactions
        loadUserAndTransactions();
      }, 3000);
    } catch (error) {
      setError(error.message || "Erro ao processar saque. Por favor, tente novamente.");
    } finally {
      setProcessingTransaction(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const transactionsData = await Transaction.filter({ user_id: user.id }, "-created_at");
      setTransactions(transactionsData);
    } catch (error) {
      console.error("Error loading transactions:", error);
    }
  };

  const loadUserAndTransactions = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      await loadTransactions();
    } catch (error) {
      console.error("Error reloading data:", error);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filterType === "all") return true;
    return transaction.type === filterType;
  });

  const getTransactionTypeDetails = (type) => {
    switch (type) {
      case "deposit":
        return {
          label: "Depósito",
          icon: <ArrowUpRight className="w-4 h-4 text-green-600" />,
          color: "text-green-600"
        };
      case "withdrawal":
        return {
          label: "Saque",
          icon: <ArrowDownRight className="w-4 h-4 text-red-600" />,
          color: "text-red-600"
        };
      case "referral_bonus":
        return {
          label: "Bônus de Indicação",
          icon: <DollarSign className="w-4 h-4 text-blue-600" />,
          color: "text-blue-600"
        };
      case "investment_return":
        return {
          label: "Retorno de Investimento",
          icon: <ArrowUpRight className="w-4 h-4 text-purple-600" />,
          color: "text-purple-600"
        };
      default:
        return {
          label: "Transação",
          icon: <DollarSign className="w-4 h-4 text-gray-600" />,
          color: "text-gray-600"
        };
    }
  };

  const getStatusDetails = (status) => {
    switch (status) {
      case "completed":
        return {
          label: "Concluído",
          bgColor: "bg-green-100",
          textColor: "text-green-800"
        };
      case "pending":
        return {
          label: "Pendente",
          bgColor: "bg-yellow-100",
          textColor: "text-yellow-800"
        };
      case "failed":
        return {
          label: "Falhou",
          bgColor: "bg-red-100",
          textColor: "text-red-800"
        };
      case "cancelled":
        return {
          label: "Cancelado",
          bgColor: "bg-gray-100",
          textColor: "text-gray-800"
        };
      default:
        return {
          label: status,
          bgColor: "bg-gray-100",
          textColor: "text-gray-800"
        };
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Finanças</h1>
        <p className="text-gray-600">Gerencie seus fundos e acompanhe suas transações</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-white/50 border-green-200 text-green-700 hover:bg-green-50"
                onClick={() => {
                  setActiveTab("deposit");
                  setDialogOpen(true);
                }}
              >
                <PlusCircle className="w-4 h-4 mr-1" />
                Depositar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-white/50 border-red-200 text-red-700 hover:bg-red-50"
                onClick={() => {
                  setActiveTab("withdraw");
                  setDialogOpen(true);
                }}
                disabled={user.balance <= 0}
              >
                <ArrowDownRight className="w-4 h-4 mr-1" />
                Sacar
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-md overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Ganhos Totais</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  R$ {user.total_earnings?.toFixed(2)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <ArrowUpRight className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-blue-600">
              <span>Rendimentos e comissões acumulados</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-md overflow-hidden lg:col-span-1 md:col-span-2">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Última Transação</p>
                <p className="text-lg font-medium text-gray-900 mt-1">
                  {transactions.length > 0 ? (
                    <span className={getTransactionTypeDetails(transactions[0].type).color}>
                      {getTransactionTypeDetails(transactions[0].type).label}
                    </span>
                  ) : (
                    "Nenhuma transação"
                  )}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-gray-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-gray-500">
              {transactions.length > 0 ? (
                formatDateSafe(transactions[0].created_at)
              ) : (
                "Sem histórico de transações"
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList className="backdrop-blur-md bg-white/40 border border-white/30 p-1">
          <TabsTrigger value="transactions">Histórico de Transações</TabsTrigger>
          <TabsTrigger value="info">Informações Financeiras</TabsTrigger>
        </TabsList>
        
        <TabsContent value="transactions">
          <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-lg">
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Histórico de Transações</CardTitle>
                <CardDescription>
                  Acompanhe todos os seus depósitos, saques e rendimentos
                </CardDescription>
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40 bg-white/50">
                    <SelectValue placeholder="Filtrar por tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="deposit">Depósitos</SelectItem>
                    <SelectItem value="withdrawal">Saques</SelectItem>
                    <SelectItem value="referral_bonus">Bônus de Indicação</SelectItem>
                    <SelectItem value="investment_return">Retornos de Investimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            
            <CardContent>
              {filteredTransactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Tipo</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Descrição</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Data</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((transaction) => {
                        const typeDetails = getTransactionTypeDetails(transaction.type);
                        const statusDetails = getStatusDetails(transaction.status);
                        
                        return (
                          <tr key={transaction.id} className="border-b border-gray-100 hover:bg-white/50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                {typeDetails.icon}
                                <span className={typeDetails.color}>{typeDetails.label}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {transaction.description || "-"}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusDetails.bgColor} ${statusDetails.textColor}`}>
                                {statusDetails.label}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {formatDateSafe(transaction.created_at)}
                            </td>
                            <td className="py-3 px-4 text-right font-medium">
                              <span className={transaction.amount >= 0 ? "text-green-600" : "text-red-600"}>
                                R$ {Math.abs(transaction.amount).toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 bg-white/50 rounded-lg border border-blue-50">
                  <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma transação encontrada</h3>
                  <p className="text-gray-600 max-w-md mx-auto mb-6">
                    {filterType === "all" 
                      ? "Você ainda não realizou nenhuma transação. Faça um depósito para começar."
                      : "Não há transações do tipo selecionado."}
                  </p>
                  {filterType === "all" && (
                    <Button
                      className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
                      onClick={() => {
                        setActiveTab("deposit");
                        setDialogOpen(true);
                      }}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Fazer um Depósito
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="info">
          <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-lg">
            <CardHeader>
              <CardTitle>Informações Financeiras</CardTitle>
              <CardDescription>
                Detalhes sobre taxas, prazos e métodos de pagamento
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 backdrop-blur-sm rounded-lg p-5 border border-blue-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Métodos de Pagamento</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-indigo-700">PIX</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Depósito e saque via PIX</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Depósitos são processados em até 1 hora em dias úteis. Saques podem levar até 24 horas para processamento.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-indigo-700">₮</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Depósito e saque via USDT</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Transações em USDT são processadas através da rede TRC20. Utilize apenas endereços de carteiras TRC20.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-50/50 to-emerald-50/50 backdrop-blur-sm rounded-lg p-5 border border-green-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Rendimentos e Comissões</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ArrowUpRight className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Rendimento de segunda a segunda</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Os rendimentos dos seus investimentos são calculados diariamente e adicionados ao seu saldo disponível automaticamente.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Comissões de Indicação</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Comissões são pagas automaticamente sempre que seus indicados realizarem investimentos na plataforma.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-yellow-50/50 to-amber-50/50 backdrop-blur-sm rounded-lg p-5 border border-yellow-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Regras e Prazos</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Valor mínimo de saque:</span>
                      <span className="font-medium">R$ {systemConfig?.min_withdrawal?.toFixed(2) || "25.00"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Taxa de saque:</span>
                      <span className="font-medium">{systemConfig?.withdrawal_fee || 10}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Prazo de saque:</span>
                      <span className="font-medium">Até {systemConfig?.withdrawal_time || 24}h</span>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Horário de processamento</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Transações são processadas em dias úteis, das 9h às 18h. Fora deste horário, serão processadas no próximo dia útil.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Transaction Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="backdrop-blur-xl bg-white/90 border border-white/50 shadow-xl">
          <DialogHeader>
            <DialogTitle>
              {activeTab === "deposit" ? "Realizar Depósito" : "Solicitar Saque"}
            </DialogTitle>
            <DialogDescription>
              {activeTab === "deposit" 
                ? "Deposite fundos para investir na plataforma" 
                : "Solicite a retirada de seus fundos disponíveis"
              }
            </DialogDescription>
          </DialogHeader>
          
          {transactionSuccess ? (
            <div className="py-6 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeTab === "deposit" ? "Depósito Solicitado" : "Saque Solicitado"}
              </h3>
              <p className="text-gray-600">
                {activeTab === "deposit" 
                  ? "Sua solicitação de depósito foi registrada. Aguarde as instruções por e-mail." 
                  : "Sua solicitação de saque foi processada e será analisada em breve."
                }
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
              
              <div className="space-y-4">
                {activeTab === "deposit" ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="deposit-amount">Valor do Depósito (R$)</Label>
                      <Input
                        id="deposit-amount"
                        type="number"
                        min="1"
                        step="0.01"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="0.00"
                        className="bg-white/70"
                      />
                    </div>
                    
                    <div className="bg-blue-50/50 backdrop-blur-sm rounded-lg p-4 border border-blue-100">
                      <h4 className="font-medium mb-2 flex items-center gap-1">
                        <Info className="w-4 h-4 text-blue-600" />
                        Informações para Depósito
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        Após confirmar, você receberá os dados para realizar o depósito via PIX. 
                        O valor será creditado em sua conta após a confirmação do pagamento.
                      </p>
                      <p className="text-sm text-gray-600">
                        Horário de processamento: dias úteis, das 9h às 18h.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="withdrawal-amount">Valor do Saque (R$)</Label>
                      <Input
                        id="withdrawal-amount"
                        type="number"
                        min={systemConfig?.min_withdrawal || 25}
                        step="0.01"
                        max={user.balance}
                        value={withdrawalAmount}
                        onChange={(e) => setWithdrawalAmount(e.target.value)}
                        placeholder="0.00"
                        className="bg-white/70"
                      />
                      <p className="text-xs text-gray-500">
                        Valor mínimo: R$ {systemConfig?.min_withdrawal?.toFixed(2) || "25.00"}
                      </p>
                    </div>
                    
                    {withdrawalAmount && !isNaN(parseFloat(withdrawalAmount)) && (
                      <div className="bg-indigo-50/50 backdrop-blur-sm rounded-lg p-4 border border-indigo-100">
                        <h4 className="font-medium mb-2">Resumo do Saque</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Valor solicitado:</span>
                            <span className="font-medium">R$ {parseFloat(withdrawalAmount).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Taxa ({systemConfig?.withdrawal_fee || 10}%):</span>
                            <span className="font-medium text-red-600">
                              - R$ {((parseFloat(withdrawalAmount) * (systemConfig?.withdrawal_fee || 10)) / 100).toFixed(2)}
                            </span>
                          </div>
                          <Separator className="my-1" />
                          <div className="flex justify-between">
                            <span className="text-gray-600">Valor líquido:</span>
                            <span className="font-medium">
                              R$ {(parseFloat(withdrawalAmount) - ((parseFloat(withdrawalAmount) * (systemConfig?.withdrawal_fee || 10)) / 100)).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-yellow-50/50 backdrop-blur-sm rounded-lg p-4 border border-yellow-100">
                      <h4 className="font-medium mb-2 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        Informações para Saque
                      </h4>
                      <p className="text-sm text-gray-600">
                        O saque será processado para a chave PIX cadastrada em seu perfil. 
                        O prazo para processamento é de até {systemConfig?.withdrawal_time || 24} horas em dias úteis.
                      </p>
                    </div>
                  </>
                )}
              </div>
              
              <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={activeTab === "deposit" ? handleDeposit : handleWithdrawal}
                  className={`flex-1 ${
                    activeTab === "deposit" 
                      ? "bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800" 
                      : "bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800"
                  }`}
                  disabled={
                    processingTransaction || 
                    (activeTab === "deposit" && (!depositAmount || parseFloat(depositAmount) <= 0)) ||
                    (activeTab === "withdraw" && (!withdrawalAmount || parseFloat(withdrawalAmount) <= 0 || parseFloat(withdrawalAmount) > user.balance))
                  }
                >
                  {processingTransaction ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    activeTab === "deposit" ? "Confirmar Depósito" : "Solicitar Saque"
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