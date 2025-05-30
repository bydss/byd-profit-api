import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { Transaction } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Loader2, 
  Search, 
  User as UserIcon,
  UserCog,
  Wallet,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight
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

export default function AdminUsers() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceType, setBalanceType] = useState("add");
  const [processingBalance, setProcessingBalance] = useState(false);
  const [balanceSuccess, setBalanceSuccess] = useState(false);
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
        
        // Load all users
        const usersData = await User.list("-created_date");
        setUsers(usersData);
        setFilteredUsers(usersData);
      } catch (error) {
        console.error("Error loading users data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [navigate]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(user => 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.cpf?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const viewUserDetails = async (user) => {
    setSelectedUser(user);
    setUserDialogOpen(true);
    
    try {
      // Get user's transactions
      const transactions = await Transaction.filter({ user_id: user.id }, "-created_date", 10);
      
      setUserDetails({
        ...user,
        transactions
      });
    } catch (error) {
      console.error("Error loading user details:", error);
    }
  };

  const openBalanceDialog = (user, type) => {
    setSelectedUser(user);
    setBalanceType(type);
    setBalanceAmount("");
    setBalanceSuccess(false);
    setError(null);
    setBalanceDialogOpen(true);
  };

  const handleBalanceUpdate = async () => {
    setProcessingBalance(true);
    setError(null);
    
    try {
      const amount = parseFloat(balanceAmount);
      
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Por favor, insira um valor válido");
      }
      
      // Calculate new balance
      const newBalance = balanceType === "add"
        ? (selectedUser.balance || 0) + amount
        : (selectedUser.balance || 0) - amount;
      
      // Don't allow negative balance
      if (newBalance < 0) {
        throw new Error("O saldo não pode ficar negativo");
      }
      
      // Update user balance
      await User.update(selectedUser.id, {
        balance: newBalance
      });
      
      // Create transaction record
      await Transaction.create({
        user_id: selectedUser.id,
        type: balanceType === "add" ? "deposit" : "withdrawal",
        amount: balanceType === "add" ? amount : -amount,
        status: "completed",
        description: balanceType === "add" 
          ? "Adição de saldo pelo administrador" 
          : "Dedução de saldo pelo administrador",
        payment_method: "balance"
      });
      
      setBalanceSuccess(true);
      
      // Reset and reload user list after 2 seconds
      setTimeout(() => {
        setBalanceSuccess(false);
        setBalanceDialogOpen(false);
        
        // Reload user list
        User.list("-created_date").then(usersData => {
          setUsers(usersData);
          setFilteredUsers(usersData);
        });
      }, 2000);
    } catch (error) {
      setError(error.message || "Erro ao atualizar saldo. Por favor, tente novamente.");
    } finally {
      setProcessingBalance(false);
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
        <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
        <p className="text-gray-600">Administre os usuários da plataforma</p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="Buscar por nome, e-mail ou CPF"
            value={searchTerm}
            onChange={handleSearch}
            className="pl-10 bg-white/70 w-full md:w-80"
          />
        </div>
        
        <div className="space-x-2">
          <span className="text-sm text-gray-600">Total: {users.length} usuários</span>
        </div>
      </div>
      
      <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-lg">
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>
            Todos os usuários registrados na plataforma
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Usuário</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Data de Cadastro</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Perfil</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Saldo</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-white/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="font-medium text-gray-600">
                            {user.full_name?.charAt(0) || user.email?.charAt(0) || "U"}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.full_name || "Usuário"}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatDateSafe(user.created_date)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Badge 
                          className={user.role === "admin" 
                            ? "bg-purple-100 text-purple-800" 
                            : "bg-blue-100 text-blue-800"
                          }
                        >
                          {user.role === "admin" ? "Admin" : "Usuário"}
                        </Badge>
                        
                        {user.profile_complete ? (
                          <Badge className="bg-green-100 text-green-800">
                            Perfil completo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-yellow-200 text-yellow-700">
                            Perfil incompleto
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      R$ {user.balance?.toFixed(2) || "0.00"}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-white/50"
                          onClick={() => viewUserDetails(user)}
                        >
                          <UserCog className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-white/50 text-green-700 border-green-200 hover:bg-green-50"
                          onClick={() => openBalanceDialog(user, "add")}
                        >
                          <PlusCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-white/50 text-red-700 border-red-200 hover:bg-red-50"
                          onClick={() => openBalanceDialog(user, "subtract")}
                          disabled={!user.balance || user.balance <= 0}
                        >
                          <ArrowDownRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredUsers.length === 0 && (
              <div className="py-8 text-center text-gray-500">
                Nenhum usuário encontrado com o termo "{searchTerm}"
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* User Details Dialog */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="backdrop-blur-xl bg-white/90 border border-white/50 shadow-xl max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
            <DialogDescription>
              Informações detalhadas do usuário selecionado
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3 space-y-4">
                  <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 backdrop-blur-sm rounded-lg p-4 border border-blue-100">
                    <div className="flex justify-center mb-4">
                      <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                        <UserIcon className="w-10 h-10 text-blue-600" />
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <h3 className="font-medium text-lg">{selectedUser.full_name}</h3>
                      <p className="text-gray-600 text-sm">{selectedUser.email}</p>
                      <div className="mt-2">
                        <Badge 
                          className={selectedUser.role === "admin" 
                            ? "bg-purple-100 text-purple-800" 
                            : "bg-blue-100 text-blue-800"
                          }
                        >
                          {selectedUser.role === "admin" ? "Administrador" : "Usuário"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white/50 rounded-lg border border-gray-100 p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Informações Pessoais</h4>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Data de Cadastro:</span>
                        <span>{formatDateSafe(selectedUser.created_date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">CPF:</span>
                        <span>{selectedUser.cpf || "Não informado"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Telefone:</span>
                        <span>{selectedUser.phone || "Não informado"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Perfil Completo:</span>
                        <span>{selectedUser.profile_complete ? "Sim" : "Não"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Código de Indicação:</span>
                        <span className="font-mono">{selectedUser.referral_code || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="md:w-2/3 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50/50 backdrop-blur-sm rounded-lg p-4 border border-green-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Saldo Disponível</p>
                          <p className="text-xl font-bold text-gray-900 mt-1">
                            R$ {selectedUser.balance?.toFixed(2) || "0.00"}
                          </p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <Wallet className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50/50 backdrop-blur-sm rounded-lg p-4 border border-blue-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Ganhos Totais</p>
                          <p className="text-xl font-bold text-gray-900 mt-1">
                            R$ {selectedUser.total_earnings?.toFixed(2) || "0.00"}
                          </p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <DollarSign className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white/50 rounded-lg border border-gray-100 p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Últimas Transações</h4>
                    
                    {userDetails?.transactions?.length > 0 ? (
                      <div className="overflow-x-auto max-h-56">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 px-3 font-medium text-gray-600">Tipo</th>
                              <th className="text-left py-2 px-3 font-medium text-gray-600">Data</th>
                              <th className="text-left py-2 px-3 font-medium text-gray-600">Status</th>
                              <th className="text-right py-2 px-3 font-medium text-gray-600">Valor</th>
                            </tr>
                          </thead>
                          <tbody>
                            {userDetails.transactions.map((transaction) => {
                              const isPositive = transaction.amount >= 0;
                              return (
                                <tr key={transaction.id} className="border-b border-gray-100">
                                  <td className="py-2 px-3">
                                    <div className="flex items-center">
                                      {isPositive ? (
                                        <ArrowUpRight className="w-3 h-3 text-green-600 mr-1" />
                                      ) : (
                                        <ArrowDownRight className="w-3 h-3 text-red-600 mr-1" />
                                      )}
                                      <span className={isPositive ? "text-green-600" : "text-red-600"}>
                                        {transaction.type === "deposit" ? "Depósito" : 
                                         transaction.type === "withdrawal" ? "Saque" :
                                         transaction.type === "referral_bonus" ? "Bônus" : "Investimento"}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-2 px-3">
                                    {formatDateSafe(transaction.created_date)}
                                  </td>
                                  <td className="py-2 px-3">
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium
                                      ${transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                                        transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        transaction.status === 'failed' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'}`
                                    }>
                                      {transaction.status === 'completed' ? 'Concluído' :
                                       transaction.status === 'pending' ? 'Pendente' :
                                       transaction.status === 'failed' ? 'Falhou' : 'Cancelado'}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-right font-medium">
                                    <span className={isPositive ? "text-green-600" : "text-red-600"}>
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
                      <div className="py-4 text-center text-gray-500">
                        Nenhuma transação encontrada
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setUserDialogOpen(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Balance Update Dialog */}
      <Dialog open={balanceDialogOpen} onOpenChange={setBalanceDialogOpen}>
        <DialogContent className="backdrop-blur-xl bg-white/90 border border-white/50 shadow-xl">
          <DialogHeader>
            <DialogTitle>
              {balanceType === "add" ? "Adicionar Saldo" : "Remover Saldo"}
            </DialogTitle>
            <DialogDescription>
              {balanceType === "add" 
                ? "Adicione saldo à conta do usuário" 
                : "Remova saldo da conta do usuário"
              }
            </DialogDescription>
          </DialogHeader>
          
          {balanceSuccess ? (
            <div className="py-6 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {balanceType === "add" ? "Saldo Adicionado" : "Saldo Removido"}
              </h3>
              <p className="text-gray-600">
                A operação foi realizada com sucesso.
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
              
              {selectedUser && (
                <div className="space-y-4">
                  <div className="bg-blue-50/50 backdrop-blur-sm rounded-lg p-4 border border-blue-100">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{selectedUser.full_name}</h4>
                        <p className="text-sm text-gray-600">{selectedUser.email}</p>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-blue-100">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Saldo atual:</span>
                        <span className="font-medium">R$ {selectedUser.balance?.toFixed(2) || "0.00"}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="balance-amount">
                      {balanceType === "add" ? "Valor a adicionar (R$)" : "Valor a remover (R$)"}
                    </Label>
                    <Input
                      id="balance-amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      max={balanceType === "subtract" ? selectedUser.balance : undefined}
                      value={balanceAmount}
                      onChange={(e) => setBalanceAmount(e.target.value)}
                      placeholder="0.00"
                      className="bg-white/70"
                    />
                    
                    {balanceType === "subtract" && (
                      <p className="text-xs text-gray-500">
                        Valor máximo: R$ {selectedUser.balance?.toFixed(2) || "0.00"}
                      </p>
                    )}
                  </div>
                  
                  {balanceAmount && !isNaN(parseFloat(balanceAmount)) && parseFloat(balanceAmount) > 0 && (
                    <div className={`bg-${balanceType === "add" ? "green" : "red"}-50/50 backdrop-blur-sm rounded-lg p-4 border border-${balanceType === "add" ? "green" : "red"}-100`}>
                      <h4 className="font-medium mb-2">Resumo da operação</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Saldo atual:</span>
                          <span className="font-medium">R$ {selectedUser.balance?.toFixed(2) || "0.00"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            {balanceType === "add" ? "Valor a adicionar:" : "Valor a remover:"}
                          </span>
                          <span className={`font-medium ${balanceType === "add" ? "text-green-600" : "text-red-600"}`}>
                            {balanceType === "add" ? "+" : "-"} R$ {parseFloat(balanceAmount).toFixed(2)}
                          </span>
                        </div>
                        <div className="border-t border-gray-200 my-1 pt-1"></div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Novo saldo:</span>
                          <span className="font-medium">
                            R$ {(
                              balanceType === "add"
                                ? (selectedUser.balance || 0) + parseFloat(balanceAmount)
                                : (selectedUser.balance || 0) - parseFloat(balanceAmount)
                            ).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => setBalanceDialogOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleBalanceUpdate}
                  className={`flex-1 ${
                    balanceType === "add"
                      ? "bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800"
                      : "bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800"
                  }`}
                  disabled={
                    processingBalance ||
                    !balanceAmount ||
                    isNaN(parseFloat(balanceAmount)) ||
                    parseFloat(balanceAmount) <= 0 ||
                    (balanceType === "subtract" && parseFloat(balanceAmount) > (selectedUser?.balance || 0))
                  }
                >
                  {processingBalance ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    balanceType === "add" ? "Adicionar Saldo" : "Remover Saldo"
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
