import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { Transaction } from "@/api/entities";
import { InvestmentPlan } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, Users, DollarSign, BarChart2, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
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

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTransactions: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalInvestments: 0,
    pendingWithdrawals: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await User.me();
        
        // Verify if user is admin
        if (userData.role !== "admin") {
          navigate(createPageUrl("Dashboard"));
          return;
        }
        
        setUser(userData);
        
        // Load users
        const usersData = await User.list("-created_date");
        setRecentUsers(usersData.slice(0, 5));
        
        // Load transactions
        const transactionsData = await Transaction.list("-created_date");
        setRecentTransactions(transactionsData.slice(0, 10));
        
        // Calculate statistics
        const deposits = transactionsData.filter(t => t.type === "deposit");
        const withdrawals = transactionsData.filter(t => t.type === "withdrawal");
        const pendingWithdrawals = withdrawals.filter(t => t.status === "pending");
        const investments = transactionsData.filter(t => t.type === "investment_return");
        
        setStats({
          totalUsers: usersData.length,
          totalTransactions: transactionsData.length,
          totalDeposits: deposits.reduce((sum, t) => sum + t.amount, 0),
          totalWithdrawals: withdrawals.reduce((sum, t) => sum + Math.abs(t.amount), 0),
          totalInvestments: investments.reduce((sum, t) => sum + Math.abs(t.amount), 0),
          pendingWithdrawals: pendingWithdrawals.length
        });
      } catch (error) {
        console.error("Error loading admin data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [navigate]);

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
          label: "Investimento",
          icon: <TrendingUp className="w-4 h-4 text-purple-600" />,
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
        <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
        <p className="text-gray-600">Visão geral do sistema BYD Profit</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-md overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Usuários</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.totalUsers}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(createPageUrl("AdminUsers"))}
                className="w-full text-xs bg-white/70 border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                Gerenciar Usuários
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-md overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Transações</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.totalTransactions}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(createPageUrl("AdminTransactions"))}
                className="w-full text-xs bg-white/70 border-green-200 text-green-700 hover:bg-green-50"
              >
                Ver Transações
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-md overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Saques Pendentes</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.pendingWithdrawals}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <ArrowDownRight className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(createPageUrl("AdminTransactions"))}
                className="w-full text-xs bg-white/70 border-yellow-200 text-yellow-700 hover:bg-yellow-50"
              >
                Processar Saques
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-md overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Depósitos</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  R$ {stats.totalDeposits.toFixed(2)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <ArrowUpRight className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-md overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Saques</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  R$ {stats.totalWithdrawals.toFixed(2)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <ArrowDownRight className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-md overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Investimentos</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  R$ {stats.totalInvestments.toFixed(2)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <BarChart2 className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(createPageUrl("AdminInvestments"))}
                className="w-full text-xs bg-white/70 border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                Gerenciar Planos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-lg">
          <CardHeader>
            <CardTitle>Usuários Recentes</CardTitle>
            <CardDescription>
              Últimos usuários cadastrados na plataforma
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="font-medium text-blue-700">
                        {user.full_name?.charAt(0) || user.email?.charAt(0) || "U"}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{user.full_name || "Usuário"}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDateSafe(user.created_date)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate(createPageUrl("AdminUsers"))}
            >
              Ver Todos os Usuários
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-lg">
          <CardHeader>
            <CardTitle>Transações Recentes</CardTitle>
            <CardDescription>
              Últimas movimentações financeiras no sistema
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((transaction) => {
                const typeDetails = getTransactionTypeDetails(transaction.type);
                
                return (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {typeDetails.icon}
                      </div>
                      <div>
                        <p className={`font-medium ${typeDetails.color}`}>
                          {typeDetails.label}
                        </p>
                        <p className="text-xs text-gray-500">
                          {transaction.user_email || transaction.user_name || "Usuário"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <p className={transaction.amount >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                        R$ {Math.abs(transaction.amount || 0).toFixed(2)}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadgeClass(transaction.status || "pending")}`}>
                        {transaction.status || "pending"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
          
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate(createPageUrl("AdminTransactions"))}
            >
              Ver Todas as Transações
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => navigate(createPageUrl("AdminSettings"))}
        >
          Configurações do Sistema
        </Button>
        <Button
          className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
          onClick={() => navigate(createPageUrl("AdminUsers"))}
        >
          Gerenciar Usuários
        </Button>
      </div>
    </div>
  );
}