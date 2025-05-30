import React, { useState, useEffect } from "react";
import { Commission } from "@/api/entities";
import { Referral } from "@/api/entities";
import { User } from "@/api/entities";
import { Transaction } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calculator, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

export default function CommissionCalculator({ onCalculationComplete }) {
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const calculatePendingCommissions = async () => {
    setCalculating(true);
    setError(null);
    setResult(null);
    
    try {
      // Get all completed deposit transactions without commissions
      const allTransactions = await Transaction.list();
      const depositTransactions = allTransactions.filter(t => 
        t.type === "deposit" && t.status === "completed"
      );
      
      // Get existing commissions
      const existingCommissions = await Commission.list();
      const existingTransactionIds = existingCommissions.map(c => c.transaction_id);
      
      // Find transactions without commissions
      const pendingTransactions = depositTransactions.filter(t => 
        !existingTransactionIds.includes(t.id)
      );
      
      let commissionsCreated = 0;
      let totalCommissionAmount = 0;
      
      for (const transaction of pendingTransactions) {
        // Get referrals for the user who made the deposit
        const userReferrals = await Referral.filter({ referred_id: transaction.user_id });
        
        for (const referral of userReferrals) {
          const commissionAmount = (transaction.amount * referral.commission_rate) / 100;
          
          // Get user info for description
          const sourceUser = await User.filter({ id: transaction.user_id });
          const sourceUserName = sourceUser.length > 0 ? sourceUser[0].full_name : "usuário";
          
          await Commission.create({
            user_id: referral.referrer_id,
            referral_id: referral.id,
            source_user_id: transaction.user_id,
            transaction_id: transaction.id,
            level: referral.level,
            rate: referral.commission_rate,
            base_amount: transaction.amount,
            commission_amount: commissionAmount,
            status: "pending",
            description: `Depósito de ${sourceUserName}`
          });
          
          commissionsCreated++;
          totalCommissionAmount += commissionAmount;
        }
      }
      
      setResult({
        transactionsProcessed: pendingTransactions.length,
        commissionsCreated,
        totalCommissionAmount
      });
      
      if (onCalculationComplete) {
        onCalculationComplete();
      }
    } catch (error) {
      console.error("Error calculating commissions:", error);
      setError("Erro ao calcular comissões. Por favor, tente novamente.");
    } finally {
      setCalculating(false);
    }
  };

  return (
    <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Calculadora de Comissões
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" className="bg-red-50/50 backdrop-blur-sm">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {result && (
          <Alert className="bg-green-50/50 backdrop-blur-sm border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              <div className="space-y-1">
                <div>Transações processadas: {result.transactionsProcessed}</div>
                <div>Comissões criadas: {result.commissionsCreated}</div>
                <div>Valor total: R$ {result.totalCommissionAmount.toFixed(2)}</div>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="bg-blue-50/50 backdrop-blur-sm rounded-lg p-4 border border-blue-100">
          <h4 className="font-medium text-gray-900 mb-2">Como funciona</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Analisa todas as transações de depósito concluídas</li>
            <li>• Identifica transações sem comissões calculadas</li>
            <li>• Cria comissões para todos os níveis da rede</li>
            <li>• Aplica as taxas configuradas no sistema</li>
          </ul>
        </div>
        
        <Button
          onClick={calculatePendingCommissions}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
          disabled={calculating}
        >
          {calculating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Calculando...
            </>
          ) : (
            <>
              <Calculator className="mr-2 h-4 w-4" />
              Calcular Comissões Pendentes
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}