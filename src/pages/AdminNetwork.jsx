import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { Referral } from "@/api/entities";
import { NetworkChange } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
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
  Users,
  GitBranch,
  UserX,
  UserPlus,
  AlertTriangle,
  CheckCircle2,
  Network,
  ArrowRight,
  History
} from "lucide-react";
import { format } from "date-fns";

const isValidDate = (dateStr) => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date);
};

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

export default function AdminNetwork() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [networkChanges, setNetworkChanges] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [potentialSponsors, setPotentialSponsors] = useState([]);
  const [changeDialogOpen, setChangeDialogOpen] = useState(false);
  const [newSponsorId, setNewSponsorId] = useState("");
  const [changeReason, setChangeReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await User.me();
        
        if (userData.role !== "admin") {
          navigate(createPageUrl("Dashboard"));
          return;
        }
        
        // Load all users
        const usersData = await User.list("-created_date");
        setUsers(usersData);
        setFilteredUsers(usersData);
        
        // Load all referrals
        const referralsData = await Referral.list();
        setReferrals(referralsData);
        
        // Load network changes history
        const changesData = await NetworkChange.list("-created_date", 20);
        setNetworkChanges(changesData);
      } catch (error) {
        console.error("Error loading network data:", error);
        setError("Erro ao carregar dados da rede.");
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
        user.referral_code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const getUserNetwork = (userId) => {
    const userReferrals = referrals.filter(ref => ref.referrer_id === userId);
    const userSponsor = users.find(user => user.referral_code === users.find(u => u.id === userId)?.referred_by);
    
    return {
      sponsor: userSponsor,
      directReferrals: userReferrals.filter(ref => ref.level === 1).length,
      totalNetwork: userReferrals.length
    };
  };

  const openChangeSponsorDialog = (user) => {
    setSelectedUser(user);
    
    // Get potential sponsors (users who are not in this user's downline)
    const userDownline = getUserDownline(user.id);
    const potential = users.filter(u => 
      u.id !== user.id && 
      !userDownline.includes(u.id) && 
      u.profile_complete
    );
    
    setPotentialSponsors(potential);
    setNewSponsorId("");
    setChangeReason("");
    setSuccess(false);
    setError(null);
    setChangeDialogOpen(true);
  };

  const getUserDownline = (userId) => {
    const downline = [];
    const userReferrals = referrals.filter(ref => ref.referrer_id === userId);
    
    userReferrals.forEach(ref => {
      downline.push(ref.referred_id);
      downline.push(...getUserDownline(ref.referred_id));
    });
    
    return downline;
  };

  const handleSponsorChange = async () => {
    setProcessing(true);
    setError(null);
    
    try {
      if (!newSponsorId || !changeReason.trim()) {
        throw new Error("Por favor, selecione um novo patrocinador e informe o motivo.");
      }
      
      const newSponsor = users.find(u => u.id === newSponsorId);
      const oldSponsor = users.find(u => u.referral_code === selectedUser.referred_by);
      
      // Update user's sponsor
      await User.update(selectedUser.id, {
        referred_by: newSponsor.referral_code
      });
      
      // Remove old referral records
      const oldReferrals = referrals.filter(ref => ref.referred_id === selectedUser.id);
      for (const ref of oldReferrals) {
        await Referral.delete(ref.id);
      }
      
      // Create new referral records for the new network position
      await createReferralChain(selectedUser, newSponsor);
      
      // Log the network change
      await NetworkChange.create({
        user_id: selectedUser.id,
        old_sponsor_id: oldSponsor?.id || null,
        new_sponsor_id: newSponsor.id,
        admin_id: (await User.me()).id,
        reason: changeReason,
        old_network_path: oldSponsor ? `${oldSponsor.full_name} -> ${selectedUser.full_name}` : `Sem patrocinador -> ${selectedUser.full_name}`,
        new_network_path: `${newSponsor.full_name} -> ${selectedUser.full_name}`
      });
      
      setSuccess(true);
      
      // Reload data after 2 seconds
      setTimeout(async () => {
        const usersData = await User.list("-created_date");
        const referralsData = await Referral.list();
        const changesData = await NetworkChange.list("-created_date", 20);
        
        setUsers(usersData);
        setFilteredUsers(usersData);
        setReferrals(referralsData);
        setNetworkChanges(changesData);
        setChangeDialogOpen(false);
      }, 2000);
    } catch (error) {
      setError(error.message || "Erro ao alterar patrocinador. Por favor, tente novamente.");
    } finally {
      setProcessing(false);
    }
  };

  const createReferralChain = async (user, newSponsor) => {
    // Level 1 - Direct referral
    await Referral.create({
      referrer_id: newSponsor.id,
      referred_id: user.id,
      referred_email: user.email,
      referred_name: user.full_name,
      level: 1,
      commission_rate: 17,
      status: "active"
    });
    
    // Level 2 - If new sponsor has a sponsor
    if (newSponsor.referred_by) {
      const level2Sponsor = users.find(u => u.referral_code === newSponsor.referred_by);
      if (level2Sponsor) {
        await Referral.create({
          referrer_id: level2Sponsor.id,
          referred_id: user.id,
          referred_email: user.email,
          referred_name: user.full_name,
          parent_id: newSponsor.id,
          level: 2,
          commission_rate: 2,
          status: "active"
        });
        
        // Level 3 - If level 2 sponsor has a sponsor
        if (level2Sponsor.referred_by) {
          const level3Sponsor = users.find(u => u.referral_code === level2Sponsor.referred_by);
          if (level3Sponsor) {
            await Referral.create({
              referrer_id: level3Sponsor.id,
              referred_id: user.id,
              referred_email: user.email,
              referred_name: user.full_name,
              parent_id: level2Sponsor.id,
              level: 3,
              commission_rate: 1,
              status: "active"
            });
          }
        }
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestão de Rede</h1>
        <p className="text-gray-600">Administre a estrutura de indicações e patrocínios</p>
      </div>
      
      {error && (
        <Alert variant="destructive" className="bg-red-50/50 backdrop-blur-sm">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-md">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Total de Usuários</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {users.length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-md">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Com Patrocinador</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {users.filter(u => u.referred_by).length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <GitBranch className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-md">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Sem Patrocinador</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {users.filter(u => !u.referred_by).length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <UserX className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-md">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Alterações Hoje</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {networkChanges.filter(change => {
                    if (!isValidDate(change.created_date)) return false;
                    const changeDate = format(new Date(change.created_date), "yyyy-MM-dd");
                    const today = format(new Date(), "yyyy-MM-dd");
                    return changeDate === today;
                  }).length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Network className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="Buscar por nome, e-mail ou código"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/70 w-full md:w-80"
          />
        </div>
      </div>
      
      <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-lg">
        <CardHeader>
          <CardTitle>Estrutura da Rede</CardTitle>
          <CardDescription>
            Visualize e gerencie a estrutura de patrocínios
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Usuário</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Patrocinador</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Rede</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const network = getUserNetwork(user.id);
                  const sponsor = network.sponsor;
                  
                  return (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-white/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <span className="font-medium text-gray-600">
                              {user.full_name?.charAt(0) || user.email?.charAt(0) || "U"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.full_name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            <p className="text-xs text-gray-400 font-mono">{user.referral_code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {sponsor ? (
                          <div>
                            <p className="font-medium text-gray-900">{sponsor.full_name}</p>
                            <p className="text-sm text-gray-500">{sponsor.email}</p>
                          </div>
                        ) : (
                          <Badge variant="outline" className="border-orange-200 text-orange-700">
                            Sem patrocinador
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Diretos:</span>
                            <Badge className="bg-blue-100 text-blue-800">{network.directReferrals}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Total:</span>
                            <Badge className="bg-indigo-100 text-indigo-800">{network.totalNetwork}</Badge>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge 
                          className={user.profile_complete 
                            ? "bg-green-100 text-green-800" 
                            : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {user.profile_complete ? "Ativo" : "Pendente"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDateSafe(user.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-white/50"
                            onClick={() => openChangeSponsorDialog(user)}
                          >
                            <UserPlus className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
      
      {/* Recent Network Changes */}
      <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-lg">
        <CardHeader>
          <CardTitle>Histórico de Alterações</CardTitle>
          <CardDescription>
            Últimas mudanças na estrutura da rede
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {networkChanges.length > 0 ? (
            <div className="space-y-4">
              {networkChanges.map((change) => {
                const user = users.find(u => u.id === change.user_id);
                const oldSponsor = users.find(u => u.id === change.old_sponsor_id);
                const newSponsor = users.find(u => u.id === change.new_sponsor_id);
                
                return (
                  <div key={change.id} className="flex items-center justify-between p-4 bg-white/50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <History className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{user?.full_name}</span>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {oldSponsor?.full_name || "Sem patrocinador"} → {newSponsor?.full_name}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{change.reason}</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      {formatDateSafe(change.created_date)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              Nenhuma alteração registrada ainda
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Change Sponsor Dialog */}
      <Dialog open={changeDialogOpen} onOpenChange={setChangeDialogOpen}>
        <DialogContent className="backdrop-blur-xl bg-white/90 border border-white/50 shadow-xl max-w-2xl">
          <DialogHeader>
            <DialogTitle>Alterar Patrocinador</DialogTitle>
            <DialogDescription>
              Mova um usuário para outro local na rede de indicações
            </DialogDescription>
          </DialogHeader>
          
          {success ? (
            <div className="py-6 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Patrocinador Alterado
              </h3>
              <p className="text-gray-600">
                A estrutura da rede foi atualizada com sucesso.
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
                <div className="space-y-6">
                  <div className="bg-blue-50/50 backdrop-blur-sm rounded-lg p-4 border border-blue-100">
                    <h4 className="font-medium text-gray-900 mb-2">Usuário Selecionado</h4>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="font-medium text-blue-700">
                          {selectedUser.full_name?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{selectedUser.full_name}</p>
                        <p className="text-sm text-gray-600">{selectedUser.email}</p>
                        <p className="text-xs text-gray-500 font-mono">{selectedUser.referral_code}</p>
                      </div>
                    </div>
                    
                    {/* Current sponsor */}
                    <div className="mt-4 pt-4 border-t border-blue-100">
                      <p className="text-sm text-gray-600 mb-2">Patrocinador atual:</p>
                      {(() => {
                        const currentSponsor = users.find(u => u.referral_code === selectedUser.referred_by);
                        return currentSponsor ? (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{currentSponsor.full_name}</span>
                            <span className="text-sm text-gray-500">({currentSponsor.email})</span>
                          </div>
                        ) : (
                          <span className="text-gray-500 italic">Sem patrocinador</span>
                        );
                      })()}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="new-sponsor">Novo Patrocinador</Label>
                      <Select value={newSponsorId} onValueChange={setNewSponsorId}>
                        <SelectTrigger className="bg-white/70">
                          <SelectValue placeholder="Selecione o novo patrocinador" />
                        </SelectTrigger>
                        <SelectContent>
                          {potentialSponsors.map((sponsor) => (
                            <SelectItem key={sponsor.id} value={sponsor.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{sponsor.full_name}</span>
                                <span className="text-sm text-gray-500">{sponsor.email}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        Usuários na linha descendente deste usuário não podem ser selecionados
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="change-reason">Motivo da Alteração</Label>
                      <Textarea
                        id="change-reason"
                        value={changeReason}
                        onChange={(e) => setChangeReason(e.target.value)}
                        placeholder="Descreva o motivo para esta alteração na rede..."
                        className="bg-white/70"
                        rows={3}
                      />
                    </div>
                    
                    {newSponsorId && (
                      <div className="bg-yellow-50/50 backdrop-blur-sm rounded-lg p-4 border border-yellow-100">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-yellow-800 mb-2">Atenção</h4>
                            <ul className="text-sm text-yellow-700 space-y-1">
                              <li>• Todos os registros de indicação atuais serão removidos</li>
                              <li>• Novos registros serão criados na nova posição</li>
                              <li>• As comissões futuras serão calculadas na nova estrutura</li>
                              <li>• Esta ação não pode ser desfeita automaticamente</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => setChangeDialogOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSponsorChange}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800"
                  disabled={
                    processing ||
                    !newSponsorId ||
                    !changeReason.trim()
                  }
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    "Confirmar Alteração"
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