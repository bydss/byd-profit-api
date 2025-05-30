import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { Commission } from "@/api/entities";
import { Transaction } from "@/api/entities";
import { Referral } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Search,
  DollarSign,
  TrendingUp,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calculator,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { format } from "date-fns";

import CommissionCalculator from "../components/referrals/CommissionCalculator";

export default function AdminCommissions() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [commissions, setCommissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [filteredCommissions, setFilteredCommissions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [selectedCommissions, setSelectedCommissions] = useState([]);
  const [bulkPaymentDialog, setBulkPaymentDialog] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalCommissions: 0,
    pendingCommissions: 0,
    paidCommissions: 0,
    totalPendingAmount: 0,
    totalPaidAmount: 0
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await User.me();
        
        if (userData.role !== "admin") {
          navigate(createPageUrl("Dashboard"));
          return;
        }
        
        // Load all data
        const commissionsData = await Commission.list("-created_date");
        const usersData = await User.list();
        const transactionsData = await Transaction.list();
        
        setCommissions(commissionsData);
        setUsers(usersData);
        setTransactions(transactionsData);
        setFilteredCommissions(commissionsData);
        
        // Calculate statistics
        const pending = commissionsData.filter(c => c.status === "pending");
        const paid = commissionsData.filter(c => c.status === "paid");
        
        setStats({
          totalCommissions: commissionsData.length,
          pendingCommissions: pending.length,
          paidCommissions: paid.length,
          totalPendingAmount: pending.reduce((sum, c) => sum + (c.commission_amount || 0), 0),
          totalPaidAmount: paid.reduce((sum, c) => sum + (c.commission_amount || 0), 0)
        });
      } catch (error) {
        console.error("Error loading commissions data:", error);
        setError("Erro ao carregar dados das comissões.");
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

  useEffect(() => {
    let filtered = commissions;
    
    // Apply search filter
    if (searchTerm) {
      const searchUsers = users.filter(user => 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      const userIds = searchUsers.map(u => u.id);
      filtered = filtered.filter(c => userIds.includes(c.user_id));
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(c => c.status === statusFilter);
    }
    
    // Apply level filter
    if (levelFilter !== "all") {
      filtered = filtered.filter(c => c.level === parseInt(levelFilter));
    }
    
    setFilteredCommissions(filtered);
  }, [searchTerm, statusFilter, levelFilter, commissions, users]);

  const getUserInfo = (userId) => {
    return users.find(u => u.id === userId) || {};
  };

  const getSourceUserInfo = (sourceUserId) => {
    return users.find(u => u.id === sourceUserId) || {};
  };

  const handleCommissionSelection = (commissionId, selected) => {
    if (selected) {
      setSelectedCommissions([...selectedCommissions, commissionId]);
    } else {
      setSelectedCommissions(selectedCommissions.filter(id => id !== commissionId));
    }
  };

  const handleSelectAll = (selected) => {
    if (selected) {
      const pendingCommissions = filteredCommissions
        .filter(c => c.status === "pending")
        .map(c => c.id);
      setSelectedCommissions(pendingCommissions);
    } else {
      setSelectedCommissions([]);
    }
  };

  const openBulkPaymentDialog = () => {
    if (selectedCommissions.length === 0) {
      setError("Selecione pelo menos uma comissão para pagar.");
      return;
    }
    
    setBulkPaymentDialog(true);
    setError(null);
    setSuccess(false);
  };

  const handleBulkPayment = async () => {
    setProcessing(true);
    setError(null);
    
    try {
      const selectedCommissionsList = commissions.filter(c => 
        selectedCommissions.includes(c.id) && c.status === "pending"
      );
      
      for (const commission of selectedCommissionsList) {
        // Update commission status
        await Commission.update(commission.id, {
          status: "paid",
          paid_date: new Date().toISOString()
        });
        
        // Add amount to user balance
        const user = getUserInfo(commission.user_id);
        const newBalance = (user.balance || 0) + commission.commission_amount;
        await User.update(commission.user_id, { balance: newBalance });
        
        // Create transaction record
        await Transaction.create({
          user_id: commission.user_id,
          type: "referral_bonus",
          amount: commission.commission_amount,
          status: "completed",
          description: `Comissão nível ${commission.level} - ${commission.description}`,
          payment_method: "balance",
          reference_id: commission.id
        });
      }
      
      setSuccess(true);
      setSelectedCommissions([]);
      
      // Reload data after 2 seconds
      setTimeout(async () => {
        await reloadCommissions();
        setBulkPaymentDialog(false);
      }, 2000);
    } catch (error) {
      setError(error.message || "Erro ao processar pagamento das comissões.");
    } finally {
      setProcessing(false);
    }
  };

  const calculateCommissionsForTransaction = async (transactionId) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction || transaction.type !== "deposit") return;
    
    // Get referrals for the user who made the deposit
    const userReferrals = await Referral.filter({ referred_id: transaction.user_id });
    
    for (const referral of userReferrals) {
      // Check if commission already exists
      const existingCommission = commissions.find(c => 
        c.transaction_id === transactionId && 
        c.referral_id === referral.id
      );
      
      if (!existingCommission) {
        const commissionAmount = (transaction.amount * referral.commission_rate) / 100;
        
        await Commission.create({
          user_id: referral.referrer_id,
          referral_id: referral.id,
          source_user_id: transaction.user_id,
          transaction_id: transactionId,
          level: referral.level,
          rate: referral.commission_rate,
          base_amount: transaction.amount,
          commission_amount: commissionAmount,
          status: "pending",
          description: `Depósito de ${getUserInfo(transaction.user_id).full_name || "usuário"}`
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const selectedCommissionsList = commissions.filter(c => selectedCommissions.includes(c.id));
  const totalSelectedAmount = selectedCommissionsList.reduce((sum, c) => sum + (c.commission_amount || 0), 0);

  const reloadCommissions = async () => {
    const commissionsData = await Commission.list("-created_date");
    setCommissions(commissionsData);
    setFilteredCommissions(commissionsData);
    
    // Recalculate stats
    const pending = commissionsData.filter(c => c.status === "pending");
    const paid = commissionsData.filter(c => c.status === "paid");
    
    setStats({
      totalCommissions: commissionsData.length,
      pendingCommissions: pending.length,
      paidCommissions: paid.length,
      totalPendingAmount: pending.reduce((sum, c) => sum + (c.commission_amount || 0), 0),
      totalPaidAmount: paid.reduce((sum, c) => sum + (c.commission_amount || 0), 0)
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestão de Comissões</h1>
        <p className="text-gray-600">Administre as comissões do programa de indicação</p>
      </div>
      
      {error && (
        <Alert variant="destructive" className="bg-red-50/50 backdrop-blur-sm">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-md">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Comissões</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.totalCommissions}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Calculator className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-md">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Pendentes</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.pendingCommissions}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-md">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Pagas</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.paidCommissions}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-md">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Valor Pendente</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      R$ {stats.totalPendingAmount.toFixed(2)}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-md">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Valor Pago</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      R$ {stats.totalPaidAmount.toFixed(2)}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div>
          <CommissionCalculator onCalculationComplete={reloadCommissions} />
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Buscar por usuário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/70 w-full md:w-64"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-white/70 w-full md:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="bg-white/70 w-full md:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Níveis</SelectItem>
              <SelectItem value="1">Nível 1</SelectItem>
              <SelectItem value="2">Nível 2</SelectItem>
              <SelectItem value="3">Nível 3</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {selectedCommissions.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              {selectedCommissions.length} selecionadas (R$ {totalSelectedAmount.toFixed(2)})
            </div>
            <Button
              onClick={openBulkPaymentDialog}
              className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800"
            >
              Pagar Selecionadas
            </Button>
          </div>
        )}
      </div>
      
      <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-lg">
        <CardHeader>
          <CardTitle>Lista de Comissões</CardTitle>
          <CardDescription>
            Todas as comissões geradas pelo programa de indicação
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">
                    <input
                      type="checkbox"
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      checked={selectedCommissions.length === filteredCommissions.filter(c => c.status === "pending").length && filteredCommissions.filter(c => c.status === "pending").length > 0}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Beneficiário</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Origem</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Nível</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Taxa</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Base</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Comissão</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Data</th>
                </tr>
              </thead>
              <tbody>
                {filteredCommissions.map((commission) => {
                  const user = getUserInfo(commission.user_id);
                  const sourceUser = getSourceUserInfo(commission.source_user_id);
                  
                  return (
                    <tr key={commission.id} className="border-b border-gray-100 hover:bg-white/50 transition-colors">
                      <td className="py-3 px-4">
                        {commission.status === "pending" && (
                          <input
                            type="checkbox"
                            checked={selectedCommissions.includes(commission.id)}
                            onChange={(e) => handleCommissionSelection(commission.id, e.target.checked)}
                            className="rounded border-gray-300"
                          />
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{user.full_name || '-'}</p>
                          <p className="text-sm text-gray-500">{user.email || '-'}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{sourceUser.full_name || '-'}</p>
                          <p className="text-sm text-gray-500">{commission.description || '-'}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={`
                          ${commission.level === 1 ? 'bg-blue-100 text-blue-800' : 
                            commission.level === 2 ? 'bg-indigo-100 text-indigo-800' : 
                            'bg-purple-100 text-purple-800'}
                        `}>
                          Nível {commission.level || '-'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {commission.rate || 0}%
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        R$ {(commission.base_amount || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-green-600">
                        R$ {(commission.commission_amount || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={`
                          ${commission.status === 'paid' ? 'bg-green-100 text-green-800' :
                            commission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'}
                        `}>
                          {commission.status === 'paid' ? 'Pago' :
                           commission.status === 'pending' ? 'Pendente' : 'Cancelado'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {commission.created_date ? format(new Date(commission.created_date), "dd/MM/yyyy") : '-'}
                        {commission.paid_date && (
                          <div className="text-xs text-green-600">
                            Pago: {format(new Date(commission.paid_date), "dd/MM/yyyy")}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredCommissions.length === 0 && (
              <div className="py-8 text-center text-gray-500">
                Nenhuma comissão encontrada com os filtros aplicados
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Bulk Payment Dialog */}
      <Dialog open={bulkPaymentDialog} onOpenChange={setBulkPaymentDialog}>
        <DialogContent className="backdrop-blur-xl bg-white/90 border border-white/50 shadow-xl">
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento em Lote</DialogTitle>
            <DialogDescription>
              Processe o pagamento das comissões selecionadas
            </DialogDescription>
          </DialogHeader>
          
          {success ? (
            <div className="py-6 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Pagamento Processado
              </h3>
              <p className="text-gray-600">
                As comissões foram pagas e adicionadas aos saldos dos usuários.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="bg-blue-50/50 backdrop-blur-sm rounded-lg p-4 border border-blue-100">
                  <h4 className="font-medium text-gray-900 mb-2">Resumo do Pagamento</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Comissões selecionadas:</span>
                      <span className="font-medium">{selectedCommissions.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valor total:</span>
                      <span className="font-medium text-green-600">R$ {totalSelectedAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-yellow-50/50 backdrop-blur-sm rounded-lg p-4 border border-yellow-100">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800 mb-2">Ações que serão executadas</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• Status das comissões será alterado para "Pago"</li>
                        <li>• Valores serão adicionados aos saldos dos usuários</li>
                        <li>• Transações de bônus serão criadas</li>
                        <li>• Data de pagamento será registrada</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => setBulkPaymentDialog(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleBulkPayment}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800"
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    "Confirmar Pagamento"
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
