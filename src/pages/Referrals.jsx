import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { Referral } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, 
  Users, 
  Copy, 
  Check, 
  Share2, 
  AlertCircle,
  UserPlus,
  User as UserIcon,
  Users2
} from "lucide-react";
import ReferralLevels from "../components/referrals/ReferralLevels";
import ReferralTreeView from "../components/referrals/ReferralTreeView";

export default function Referrals() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    level1Count: 0,
    level2Count: 0,
    level3Count: 0,
    totalEarnings: 0
  });

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
        
        // Load user's referrals
        const referralsData = await Referral.list();
        // Filtrar apenas os referrals onde o usuário atual é o referrer
        const userReferrals = referralsData.filter(ref => ref.referrer_id === userData.id);
        setReferrals(userReferrals);
        
        // Calculate statistics
        const level1Refs = userReferrals.filter(ref => ref.level === 1);
        const level2Refs = userReferrals.filter(ref => ref.level === 2);
        const level3Refs = userReferrals.filter(ref => ref.level === 3);
        
        // Calcular ganhos totais baseado nas comissões
        const totalEarnings = userReferrals.reduce((total, ref) => {
          if (ref.status === 'active') {
            switch (ref.level) {
              case 1:
                return total + (ref.commission_rate || 17);
              case 2:
                return total + (ref.commission_rate || 2);
              case 3:
                return total + (ref.commission_rate || 1);
              default:
                return total;
            }
          }
          return total;
        }, 0);
        
        setStats({
          level1Count: level1Refs.length,
          level2Count: level2Refs.length,
          level3Count: level3Refs.length,
          totalEarnings: totalEarnings
        });

        console.log('Referrals carregados:', userReferrals);
        console.log('Estatísticas:', {
          level1: level1Refs.length,
          level2: level2Refs.length,
          level3: level3Refs.length,
          total: totalEarnings
        });
      } catch (error) {
        console.error("Error loading referrals data:", error);
        setError("Erro ao carregar dados de indicações. Por favor, tente novamente.");
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [navigate]);

  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}${createPageUrl("Register")}?ref=${user.referral_code}`;
    navigator.clipboard.writeText(referralLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const shareReferralLink = () => {
    const referralLink = `${window.location.origin}${createPageUrl("Register")}?ref=${user.referral_code}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'BYD Profit - Programa de Indicação',
        text: 'Invista na revolução elétrica com a BYD Profit. Use meu link para se cadastrar!',
        url: referralLink,
      });
    } else {
      copyReferralLink();
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
        <h1 className="text-2xl font-bold text-gray-900">Programa de Indicação</h1>
        <p className="text-gray-600">Convide amigos e ganhe comissões sobre seus investimentos</p>
      </div>
      
      {error && (
        <Alert variant="destructive" className="bg-red-50/50 backdrop-blur-sm">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-md overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Indicações Diretas</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.level1Count}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-blue-600">
              <span>1º Nível - 17% de comissão</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-md overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">2º Nível</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.level2Count}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-indigo-600">
              <span>2% de comissão</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-md overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">3º Nível</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.level3Count}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Users2 className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-purple-600">
              <span>1% de comissão</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-md overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Ganhos Totais</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  R$ {stats.totalEarnings.toFixed(2)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-green-600">
              <span>Comissões acumuladas</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-lg">
          <CardHeader>
            <CardTitle>Seu Link de Indicação</CardTitle>
            <CardDescription>
              Compartilhe este link com seus amigos e ganhe comissões
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="referral-code">Seu código de indicação</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="referral-code"
                  value={user?.referral_code || ""}
                  readOnly
                  className="font-mono bg-gray-50/50"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyReferralLink}
                  className="flex-shrink-0 bg-white/50"
                >
                  {copySuccess ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="referral-link">Link de indicação completo</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="referral-link"
                  value={`${window.location.origin}${createPageUrl("Register")}?ref=${user?.referral_code || ""}`}
                  readOnly
                  className="bg-gray-50/50"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyReferralLink}
                  className="flex-shrink-0 bg-white/50"
                >
                  {copySuccess ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
          
          <CardFooter>
            <Button
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
              onClick={shareReferralLink}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Compartilhar Link
            </Button>
          </CardFooter>
        </Card>
        
        <ReferralLevels />
      </div>
      
      <Tabs defaultValue="list" className="space-y-6">
        <TabsList className="backdrop-blur-md bg-white/40 border border-white/30 p-1">
          <TabsTrigger value="list">Lista de Indicados</TabsTrigger>
          <TabsTrigger value="tree">Árvore de Indicações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list">
          <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-lg">
            <CardHeader>
              <CardTitle>Seus Indicados</CardTitle>
              <CardDescription>
                Lista de todas as pessoas que você indicou para a plataforma
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {referrals.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Nome</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Nível</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Comissão</th>
                      </tr>
                    </thead>
                    <tbody>
                      {referrals.map((referral, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-white/50 transition-colors">
                          <td className="py-3 px-4">
                            {referral.referred_name || 'Usuário'}
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={`
                              ${referral.level === 1 ? 'bg-blue-100 text-blue-800' : 
                                referral.level === 2 ? 'bg-indigo-100 text-indigo-800' : 
                                'bg-purple-100 text-purple-800'}
                            `}>
                              Nível {referral.level}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={`
                              ${referral.status === 'active' ? 'bg-green-100 text-green-800' : 
                                referral.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-gray-100 text-gray-800'}
                            `}>
                              {referral.status === 'active' ? 'Ativo' : 
                               referral.status === 'pending' ? 'Pendente' : 'Inativo'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right font-medium">
                            {referral.level === 1 ? '17%' : 
                             referral.level === 2 ? '2%' : '1%'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 bg-white/50 rounded-lg border border-blue-50">
                  <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum indicado ainda</h3>
                  <p className="text-gray-600 max-w-md mx-auto mb-6">
                    Compartilhe seu link de indicação com amigos e familiares para começar a ganhar comissões.
                  </p>
                  <Button
                    className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
                    onClick={shareReferralLink}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Compartilhar Link
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tree">
          <ReferralTreeView referrals={referrals} userId={user?.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
