import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { auth } from "@/api/auth";
import { Menu, X, ChevronDown, LogOut, Home, BarChart2, Users, Settings, DollarSign, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [systemSettings, setSystemSettings] = useState({
    company_name: "BYD Profit", // Valor padrão
    company_logo_url: "https://i.imgur.com/9qeZQxO.png" // Valor padrão
  });
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const loadUser = async () => {
      try {
        // Verificar se está autenticado antes de tentar carregar os dados
        if (!auth.isAuthenticated()) {
          setLoadingUser(false);
          return;
        }
        
        const userData = await auth.me();
        setUser(userData);
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
        // Se houver erro de autenticação, limpar o estado do usuário
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };

    loadUser();
    setLoadingSettings(false);
  }, []);

  const handleLogout = async () => {
    await auth.logout();
    window.location.href = createPageUrl("Login"); // Redireciona para a página de login
  };

  const isAdmin = user?.role === "admin";
  const isProfileComplete = user?.profile_complete;

  const adminMenuItems = [
    { name: "Dashboard", icon: Home, path: "AdminDashboard" },
    { name: "Usuários", icon: Users, path: "AdminUsers" },
    { name: "Rede", icon: Users, path: "AdminNetwork" },
    { name: "Comissões", icon: DollarSign, path: "AdminCommissions" },
    { name: "Dividendos", icon: BarChart2, path: "AdminDividends" },
    { name: "Investimentos", icon: BarChart2, path: "AdminInvestments" },
    { name: "Transações", icon: DollarSign, path: "AdminTransactions" },
    { name: "Configurações", icon: Settings, path: "AdminSettings" }
  ];
  
  const userMenuItems = [
    { name: "Dashboard", icon: Home, path: "Dashboard" },
    { name: "Investimentos", icon: BarChart2, path: "Investments" },
    { name: "Indicações", icon: Users, path: "Referrals" },
    { name: "Finanças", icon: DollarSign, path: "Finances" },
    { name: "Perfil", icon: UserIcon, path: "Profile" }
  ];

  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  const companyName = loadingSettings ? "Carregando..." : systemSettings.company_name;
  const companyLogoUrl = loadingSettings ? "" : systemSettings.company_logo_url;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-40 w-64 h-screen transition-transform ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0 bg-white/70 backdrop-blur-xl border-r border-white/30`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-white/30">
            <Link to={createPageUrl(isAdmin ? "AdminDashboard" : "Dashboard")} className="flex items-center gap-2">
              {companyLogoUrl && <img 
                src={companyLogoUrl}
                alt={`${companyName} Logo`} 
                className="h-8"
              />}
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-800 bg-clip-text text-transparent">
                {companyName}
              </span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const url = createPageUrl(item.path);
                const isActive = location.pathname === url;
                
                return (
                  <Link
                    key={item.path}
                    to={url}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive 
                        ? "bg-blue-600/10 text-blue-700 font-medium" 
                        : "text-gray-700 hover:bg-white/50"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-gray-500"}`} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </nav>
          
          <div className="p-4 border-t border-white/30">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:bg-white/50 px-4 py-3"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-3 text-gray-500" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="md:ml-64 min-h-screen">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 md:hidden bg-white/70 backdrop-blur-md border-b border-white/30 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            
            <Link to={createPageUrl(isAdmin ? "AdminDashboard" : "Dashboard")} className="flex items-center gap-2">
              {companyLogoUrl && <img 
                src={companyLogoUrl}
                alt={`${companyName} Logo`} 
                className="h-6"
              />}
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-800 bg-clip-text text-transparent">
                {companyName}
              </span>
            </Link>
            
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full w-8 h-8 bg-white/50"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <UserIcon className="h-5 w-5" />
              </Button>
              
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white/80 backdrop-blur-md border border-white/50 rounded-lg shadow-lg py-1 z-50">
                  <div className="px-4 py-2 border-b border-white/30">
                    <p className="text-sm font-medium">{user?.full_name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <Link
                    to={createPageUrl("Profile")}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-white/50"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Perfil
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-white/50"
                  >
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="p-4 md:p-6 pb-20">
          {(!loadingUser && user && !user.profile_complete && currentPageName !== "Profile" && currentPageName !== "Login" && currentPageName !== "Register") && (
            <div className="mb-6 p-4 bg-yellow-50/80 backdrop-blur-sm border border-yellow-200 rounded-lg shadow-sm">
              <div className="flex items-center gap-2">
                <div className="text-yellow-600 text-sm font-medium">
                  Complete seu perfil para acessar todas as funcionalidades
                </div>
                <Link to={createPageUrl("Profile")}>
                  <Button size="sm" variant="outline" className="text-xs bg-white/50 border-yellow-300 text-yellow-700">
                    Completar perfil
                  </Button>
                </Link>
              </div>
            </div>
          )}
          
          {children}
        </main>
      </div>
    </div>
  );
}

