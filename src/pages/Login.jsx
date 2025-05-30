import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { auth } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Validações básicas
      if (!formData.email || !formData.password) {
        throw new Error("Por favor, preencha todos os campos.");
      }

      // Login
      const user = await auth.login(formData.email, formData.password);
      
      // Redirecionar com base no perfil do usuário
      if (user.role === "admin") {
        navigate(createPageUrl("AdminDashboard"));
      } else if (user.profile_complete) {
        navigate(createPageUrl("Dashboard"));
      } else {
        navigate(createPageUrl("Profile"));
      }
    } catch (error) {
      console.error("Error logging in:", error);
      setError(error.message || "Erro ao fazer login. Por favor, tente novamente.");
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
            Entre na sua conta para continuar
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
            
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
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
              </div>
              
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 transition-all duration-300"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {loading ? "Entrando..." : "Entrar"}
              </Button>
              
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Ainda não tem uma conta?{" "}
                  <Link to={createPageUrl("Register")} className="text-blue-600 hover:text-blue-800">
                    Cadastre-se
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