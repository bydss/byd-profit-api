import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateUniqueReferralCode } from "../components/utils/referralUtils";
import { auth } from "@/api/auth";

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [urlReferralCode, setUrlReferralCode] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: ""
  });

  React.useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const refCode = urlParams.get("ref");
    if (refCode) {
      console.log("Código de indicação encontrado na URL:", refCode);
      setUrlReferralCode(refCode);
    }
  }, [location.search]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Validações básicas
      if (!formData.email || !formData.password || !formData.confirmPassword || !formData.name) {
        throw new Error("Por favor, preencha todos os campos.");
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error("As senhas não coincidem.");
      }
      
      console.log("Enviando registro com código de indicação:", urlReferralCode);

      // Registrar usuário
      const user = await auth.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        referred_by: urlReferralCode || null
      });

      console.log("Usuário registrado com sucesso:", user);

      // Redirecionar para a página de perfil
      navigate(createPageUrl("Profile"));
    } catch (error) {
      console.error("Error registering user:", error);
      setError(error.message || "Erro ao criar conta. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-blue-400/10 blur-3xl"></div>
        <div className="absolute top-1/3 -left-10 w-60 h-60 rounded-full bg-indigo-400/10 blur-3xl"></div>
        <div className="absolute -bottom-10 right-1/3 w-60 h-60 rounded-full bg-purple-400/10 blur-3xl"></div>
      </div>
      
      <div className="w-full max-w-md z-10">
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(createPageUrl("Login"))}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        </div>
        
        <div className="text-center mb-8">
          <img 
            src="https://i.imgur.com/9qeZQxO.png" 
            alt="BYD Profit Logo" 
            className="h-12 mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-800 bg-clip-text text-transparent">
            BYD Profit
          </h1>
          <p className="mt-2 text-gray-600">
            Crie sua conta e comece a investir
          </p>
        </div>
        
        <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-xl">
          <CardContent className="pt-6">
            {error && (
              <Alert variant="destructive" className="mb-6 bg-red-50/50 backdrop-blur-sm">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-center mb-4">Cadastre-se agora</h2>
                
                {urlReferralCode && (
                  <div className="mb-6 p-3 bg-blue-50/50 backdrop-blur-sm border border-blue-100 rounded-lg">
                    <p className="text-sm text-blue-700 text-center">
                      Você foi convidado por um membro! 
                      <br />
                      <span className="font-semibold">Código: {urlReferralCode}</span>
                    </p>
                  </div>
                )}
                
                <p className="text-sm text-gray-600 text-center mb-6">
                  Ganhe bonificações por indicações e acompanhe seus investimentos
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="bg-white/70"
                    placeholder="Digite seu nome completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="bg-white/70"
                    placeholder="Digite seu e-mail"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="bg-white/70"
                    placeholder="Digite sua senha"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirme sua senha</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="bg-white/70"
                    placeholder="Digite sua senha novamente"
                  />
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 transition-all duration-300"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {loading ? "Processando..." : "Criar conta"}
              </Button>
              
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Já possui uma conta?{" "}
                  <Link to={createPageUrl("Login")} className="text-blue-600 hover:text-blue-800">
                    Entrar
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
        
        <div className="mt-12 text-center">
          <p className="text-xs text-gray-500">
            BYD Profit © {new Date().getFullYear()} - Todos os direitos reservados
          </p>
        </div>
      </div>
    </div>
  );
}
