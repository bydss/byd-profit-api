import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { Transaction } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2, 
  Search, 
  Filter,
  DollarSign,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Clock
} from "lucide-react";
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

export default function AdminTransactions() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await User.me();
        
        // Verify if user is admin
        if (userData.role !== "admin") {
          navigate(createPageUrl("Dashboard"));
          return;
        }
        
        // Load all transactions
        const transactionsData = await Transaction.list("-created_date");
        setTransactions(transactionsData);
        setFilteredTransactions(transactionsData);
        
        // Set pending transactions
        setPendingWithdrawals(
          transactionsData.filter(t => t.type === "withdrawal" && t.status === "pending")
        );
        
        setPendingDeposits(
          transactionsData.filter(t => t.type === "deposit" && t.status === "pending")
        );
      } catch (error) {
        console.error("Error loading transactions data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [navigate]);

  useEffect(() => {
    let filtered = [...transactions];
    
    // Apply type filter
    if (filterType !== "all") {
      filtered = filtered.filter(t => t.type === filterType);
    }
    
    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(t => t.status === filterStatus);
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredTransactions(filtered);
  }, [searchTerm, filterType, filterStatus, transactions]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const openApproveDialog = (transaction) => {
    setSelectedTransaction(transaction);
    setApproveDialogOpen(true);
    setActionSuccess(false);
    setError(null);
  };

  const openRejectDialog = (transaction) => {
    setSelectedTransaction(transaction);
    setRejectDialogOpen(true);
    setActionSuccess(false);
    setError(null);
  };

  const handleApprove = async () => {
    setProcessingAction(true);
    setError(null);
    
    try {
      if (!selectedTransaction) return;
      
      // Get user data
      const userData = await User.filter({ id: selectedTransaction.user_id });
      const user = userData[0];
      
      if (!user) {
        throw new Error("Usuário não encontrado");
      }
      
      // Handle different transaction types
      if (selectedTransaction.type === "deposit") {
        // Add funds to user balance
        const newBalance = (user.balance || 0) + selectedTransaction.amount;
        
        await User.update(user.id, {
          balance: newBalance
        });
      }
      
      // Update transaction status
      await Transaction.update(selectedTransaction.id, {
        status: "completed"
      });
      
      setActionSuccess(true);
      
      // Reset and reload transaction list after 2 seconds
      setTimeout(() => {
        setActionSuccess(false);
        setApproveDialogOpen(false);
        
        // Reload transaction list
        Transaction.list("-created_date").then(transactionsData => {
          setTransactions(transactionsData);
          setFilteredTransactions(transactionsData);
          
          // Update pending lists
          setPendingWithdrawals(
            transactionsData.filter(t => t.type === "withdrawal" && t.status === "pending")
          );
          
          setPendingDeposits(
            transactionsData.filter(t => t.type === "deposit" && t.status === "pending")
          );
        });
      }, 2000);
    } catch (error) {
      setError(error.message || "Erro ao aprovar transação. Por favor, tente novamente.");
    } finally {
      setProcessingAction(false);
    }
  };

  const handleReject = async () => {
    setProcessingAction(true);
    setError(null);
    
    try {
      if (!selectedTransaction) return;
      
      // Handle different transaction types
      if (selectedTransaction.type === "withdrawal") {
        // Get user data
        const userData = await User.filter({ id: selectedTransaction.user_id });
        const user = userData[0];
        
        if (!user) {
          throw new Error("Usuário não encontrado");
        }
        
        // Return funds to user balance
        const newBalance = (user.balance || 0) + Math.abs(selectedTransaction.amount);
        
        await User.update(user.id, {
          balance: newBalance
        });
      }
      
      // Update transaction status
      await Transaction.update(selectedTransaction.id, {
        status: "cancelled"
      });
      
      setActionSuccess(true);
      
      // Reset and reload transaction list after 2 seconds
      setTimeout(() => {
        setActionSuccess(false);
        setRejectDialogOpen(false);
        
        // Reload transaction list
        Transaction.list("-created_date").then(transactionsData => {
          setTransactions(transactionsData);
          setFilteredTransactions(transactionsData);
          
          // Update pending lists
          setPendingWithdrawals(
            transactionsData.filter(t => t.type === "withdrawal" && t.status === "pending")
          );
          
          setPendingDeposits(
            transactionsData.filter(t => t.type === "deposit" && t.status === "pending")
          );
        });
      }, 2000);
    } catch (error) {
      setError(error.message || "Erro ao rejeitar transação. Por favor, tente novamente.");
    } finally {
      setProcessingAction(false);
    }
  };

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

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
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
        <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Transações</h1>
        <p className="text-gray-600">Administre as transações financeiras da plataforma</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-md overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Saques Pendentes</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {pendingWithdrawals.length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <ArrowDownRight className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-red-600">
              <span>Total: R$ {pendingWithdrawals.reduce((sum, t) => sum + Math.abs(t.amount), 0).toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-md overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Depósitos Pendentes</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {pendingDeposits.length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <ArrowUpRight className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-green-600">
              <span>Total: R$ {pendingDeposits.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="backdrop-blur-md bg-white/40 border border-white/30 p-1">
          <TabsTrigger value="all" onClick={() => { setFilterType("all"); setFilterStatus("all"); }}>
            Todas
          </TabsTrigger>
          <TabsTrigger value="pending" onClick={() => { setFilterType("all"); setFilterStatus("pending"); }}>
            Pendentes
          </TabsTrigger>
          <TabsTrigger value="deposits" onClick={() => { setFilterType("deposit"); setFilterStatus("all"); }}>
            Depósitos
          </TabsTrigger>
          <TabsTrigger value="withdrawals" onClick={() => { setFilterType("withdrawal"); setFilterStatus("all"); }}>
            Saques
          </TabsTrigger>
        </TabsList>
        
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Buscar por descrição, usuário ou ID"
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10 bg-white/70 w-full md:w-80"
            />
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-36 bg-white/50">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="deposit">Depósitos</SelectItem>
                  <SelectItem value="withdrawal">Saques</SelectItem>
                  <SelectItem value="referral_bonus">Bônus de Indicação</SelectItem>
                  <SelectItem value="investment_return">Investimentos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-36 bg-white/50">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="completed">Concluídos</SelectItem>
                  <SelectItem value="failed">Falhos</SelectItem>
                  <SelectItem value="cancelled">Cancelados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-lg">
          <CardHeader>
            <CardTitle>Lista de Transações</CardTitle>
            <CardDescription>
              Transações financeiras da plataforma
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Tipo</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Usuário</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Descrição</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Data</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Valor</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => {
                    const typeDetails = getTransactionTypeDetails(transaction.type);
                    const isPending = transaction.status === "pending";
                    
                    return (
                      <tr key={transaction.id} className="border-b border-gray-100 hover:bg-white/50 transition-colors">
                        <td className="py-3 px-4 text-sm font-mono">
                          {transaction.id.substring(0, 8)}...
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {typeDetails.icon}
                            <span className={typeDetails.color}>{typeDetails.label}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {transaction.user_email || "Usuário"}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {transaction.description || "-"}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatDateSafe(transaction.created_date)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusBadgeClass(transaction.status)}>
                            {transaction.status === "completed" ? "Concluído" :
                             transaction.status === "pending" ? "Pendente" :
                             transaction.status === "failed" ? "Falhou" : "Cancelado"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right font-medium">
                          <span className={transaction.amount >= 0 ? "text-green-600" : "text-red-600"}>
                            R$ {Math.abs(transaction.amount).toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {isPending && (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-white/50 text-green-700 border-green-200 hover:bg-green-50"
                                onClick={() => openApproveDialog(transaction)}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-white/50 text-red-700 border-red-200 hover:bg-red-50"
                                onClick={() => openRejectDialog(transaction)}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {filteredTransactions.length === 0 && (
                <div className="py-8 text-center text-gray-500">
                  Nenhuma transação encontrada com os filtros aplicados
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Tabs>
      
      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="backdrop-blur-xl bg-white/90 border border-white/50 shadow-xl">
          <DialogHeader>
            <DialogTitle>Aprovar Transação</DialogTitle>
            <DialogDescription>
              Confirme a aprovação desta transação
            </DialogDescription>
          </DialogHeader>
          
          {actionSuccess ? (
            <div className="py-6 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Transação Aprovada
              </h3>
              <p className="text-gray-600">
                A transação foi aprovada com sucesso.
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
              
              {selectedTransaction && (
                <div className="space-y-4">
                  <div className={`bg-${selectedTransaction.type === "deposit" ? "green" : "red"}-50/50 backdrop-blur-sm rounded-lg p-4 border border-${selectedTransaction.type === "deposit" ? "green" : "red"}-100`}>
                    <div className="flex items-center gap-3 mb-3">
                      {selectedTransaction.type === "deposit" ? (
                        <ArrowUpRight className="w-5 h-5 text-green-600" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5 text-red-600" />
                      )}
                      <div>
                        <h4 className="font-medium">
                          {selectedTransaction.type === "deposit" ? "Depósito" : "Saque"}
                        </h4>
                        <p className="text-sm text-gray-600">{selectedTransaction.user_email}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Valor:</span>
                        <span className="font-medium">
                          R$ {Math.abs(selectedTransaction.amount).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Data:</span>
                        <span>
                          {formatDateSafe(selectedTransaction.created_date)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Método:</span>
                        <span>
                          {selectedTransaction.payment_method === "pix" ? "PIX" :
                           selectedTransaction.payment_method === "usdt" ? "USDT" : 
                           selectedTransaction.payment_method === "balance" ? "Saldo" : 
                           "Outro"}
                        </span>
                      </div>
                      {selectedTransaction.description && (
                        <div className="pt-2 border-t border-gray-200">
                          <span className="text-gray-600">Descrição:</span>
                          <p className="mt-1">{selectedTransaction.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Alert className="bg-blue-50/50 backdrop-blur-sm border-blue-100">
                    <AlertTriangle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-700">
                      {selectedTransaction.type === "deposit"
                        ? "Ao aprovar, o valor será adicionado ao saldo do usuário."
                        : "Ao aprovar, você confirma que o pagamento foi realizado ao usuário."}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              
              <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => setApproveDialogOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleApprove}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800"
                  disabled={processingAction}
                >
                  {processingAction ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    "Confirmar Aprovação"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="backdrop-blur-xl bg-white/90 border border-white/50 shadow-xl">
          <DialogHeader>
            <DialogTitle>Rejeitar Transação</DialogTitle>
            <DialogDescription>
              Confirme a rejeição desta transação
            </DialogDescription>
          </DialogHeader>
          
          {actionSuccess ? (
            <div className="py-6 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Transação Rejeitada
              </h3>
              <p className="text-gray-600">
                A transação foi rejeitada com sucesso.
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
              
              {selectedTransaction && (
                <div className="space-y-4">
                  <div className="bg-red-50/50 backdrop-blur-sm rounded-lg p-4 border border-red-100">
                    <div className="flex items-center gap-3 mb-3">
                      <XCircle className="w-5 h-5 text-red-600" />
                      <div>
                        <h4 className="font-medium">Rejeitar Transação</h4>
                        <p className="text-sm text-gray-600">{selectedTransaction.user_email}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tipo:</span>
                        <span className="font-medium">
                          {selectedTransaction.type === "deposit" ? "Depósito" : 
                           selectedTransaction.type === "withdrawal" ? "Saque" :
                           selectedTransaction.type === "referral_bonus" ? "Bônus de Indicação" :
                           "Investimento"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Valor:</span>
                        <span className="font-medium">
                          R$ {Math.abs(selectedTransaction.amount).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Data:</span>
                        <span>
                          {formatDateSafe(selectedTransaction.created_date)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Alert className="bg-yellow-50/50 backdrop-blur-sm border-yellow-100">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-700">
                      {selectedTransaction.type === "deposit"
                        ? "Ao rejeitar, o depósito não será processado."
                        : "Ao rejeitar, o valor será retornado ao saldo do usuário."}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              
              <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => setRejectDialogOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleReject}
                  className="flex-1 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800"
                  disabled={processingAction}
                >
                  {processingAction ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    "Confirmar Rejeição"
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