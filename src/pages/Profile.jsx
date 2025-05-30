import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { auth } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { generateUniqueReferralCode } from "../components/utils/referralUtils";

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    cpf: "",
    phone: "",
    address: "",
    birth_date: "",
    pix_key: ""
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        let userData = await auth.me();
        
        if (!userData.referral_code) {
          const newReferralCode = generateUniqueReferralCode(userData.name);
          await auth.updateMyUserData({ referral_code: newReferralCode });
          userData = await auth.me(); 
        }
        
        setUser(userData);
        setFormData({
          name: userData.name || "",
          email: userData.email || "",
          cpf: userData.cpf || "",
          phone: userData.phone || "",
          address: userData.address || "",
          birth_date: userData.birth_date ? format(new Date(userData.birth_date), "yyyy-MM-dd") : "",
          pix_key: userData.pix_key || ""
        });
      } catch (error) {
        console.error("Error loading user data:", error);
        // Se houver erro de autenticação, redirecionar para login
        if (error.message?.includes("não autenticado")) {
        navigate(createPageUrl("Login"));
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Validações básicas
      if (!formData.name || !formData.email || !formData.cpf || !formData.phone || !formData.address || !formData.birth_date || !formData.pix_key) {
        throw new Error("Por favor, preencha todos os campos obrigatórios.");
      }
      
      // Atualizar perfil
      const updatedUser = await auth.updateMyUserData({
        ...formData,
        profile_complete: true
      });

      setUser(updatedUser);
          navigate(createPageUrl("Dashboard"));
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(error.message || "Erro ao atualizar perfil. Por favor, tente novamente.");
    } finally {
      setLoading(false);
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
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="mt-1 text-sm text-gray-600">
          Atualize suas informações pessoais e configure sua conta
        </p>
      </div>
      
      <Card>
        <CardContent className="pt-6">
              {error && (
            <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
            <Alert className="mb-6 bg-green-50 text-green-700 border-green-200">
              <AlertDescription>Perfil atualizado com sucesso!</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo *</Label>
                    <Input
                  id="name"
                  name="name"
                  value={formData.name}
                      onChange={handleChange}
                  className="bg-white/70"
                    />
                  </div>

              <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      name="email"
                      value={formData.email}
                      disabled
                  className="bg-gray-50"
                    />
                  </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                    <Input
                      id="cpf"
                      name="cpf"
                      value={formData.cpf}
                      onChange={handleChange}
                  placeholder="123.456.789-00"
                  className="bg-white/70"
                    />
                  </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                  placeholder="(11) 98765-4321"
                  className="bg-white/70"
                    />
                  </div>

              <div className="space-y-2">
                <Label htmlFor="birth_date">Data de nascimento *</Label>
                    <Input
                      id="birth_date"
                      name="birth_date"
                      type="date"
                      value={formData.birth_date}
                      onChange={handleChange}
                  className="bg-white/70"
                    />
                  </div>

              <div className="space-y-2">
                <Label htmlFor="pix_key">Chave PIX *</Label>
                    <Input
                      id="pix_key"
                      name="pix_key"
                      value={formData.pix_key}
                      onChange={handleChange}
                  placeholder="CPF, e-mail ou telefone"
                  className="bg-white/70"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Endereço completo *</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Rua, número, complemento, bairro, cidade e estado"
                  className="bg-white/70"
                    />
                  </div>
                </div>
                
            <div className="flex justify-end gap-4">
                <Button
                  type="submit"
                  disabled={saving}
                className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                  "Salvar alterações"
                  )}
                </Button>
            </div>
              </form>
            </CardContent>
          </Card>

      {user?.referral_code && (
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold mb-2">Seu código de indicação</h2>
              <p className="text-sm text-gray-600 mb-4">
                Compartilhe este código com seus amigos e ganhe bonificações
              </p>
              <div className="inline-block px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-mono text-lg">
                {user.referral_code}
                </div>
              </div>
            </CardContent>
          </Card>
      )}
    </div>
  );
}
