import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import Layout from "./Layout.jsx";
import Login from "./Login";
import Register from "./Register";
import Profile from "./Profile";
import Dashboard from "./Dashboard";
import Investments from "./Investments";
import Referrals from "./Referrals";
import Finances from "./Finances";
import AdminDashboard from "./AdminDashboard";
import AdminSettings from "./AdminSettings";
import AdminUsers from "./AdminUsers";
import AdminTransactions from "./AdminTransactions";
import AdminInvestments from "./AdminInvestments";
import AdminNetwork from "./AdminNetwork";
import AdminCommissions from "./AdminCommissions";
import AdminDividends from "./AdminDividends";
import { auth } from "@/api/auth";

const PAGES = {
    Login: Login,
    Register: Register,
    Profile: Profile,
    Dashboard: Dashboard,
    Investments: Investments,
    Referrals: Referrals,
    Finances: Finances,
    AdminDashboard: AdminDashboard,
    AdminSettings: AdminSettings,
    AdminUsers: AdminUsers,
    AdminTransactions: AdminTransactions,
    AdminInvestments: AdminInvestments,
    AdminNetwork: AdminNetwork,
    AdminCommissions: AdminCommissions,
    AdminDividends: AdminDividends,
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    // Converter o formato da URL (ex: admin-dashboard) para o formato da página (ex: AdminDashboard)
    const formattedUrl = urlLastPart
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');

    const pageName = Object.keys(PAGES).find(page => page === formattedUrl);
    return pageName || 'Login';
}

// Componente de proteção para rotas que requerem autenticação
function PrivateRoute({ children, requireAdmin = false }) {
    const isAuthenticated = auth.isAuthenticated();
    const user = auth.getCurrentUser();
    const isAdmin = user?.role === 'admin';

    // Se não estiver autenticado, redirecionar para login
    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    // Se a rota requer admin e o usuário não é admin, redirecionar para dashboard
    if (requireAdmin && !isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    const isPublicRoute = ['Login', 'Register'].includes(currentPage);
    
    return (
        <>
            {isPublicRoute ? (
                <Routes>
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                </Routes>
            ) : (
        <Layout currentPageName={currentPage}>
            <Routes>            
                        {/* Rotas do usuário comum */}
                        <Route path="/profile" element={
                            <PrivateRoute>
                                <Profile />
                            </PrivateRoute>
                        } />
                        <Route path="/dashboard" element={
                            <PrivateRoute>
                                <Dashboard />
                            </PrivateRoute>
                        } />
                        <Route path="/investments" element={
                            <PrivateRoute>
                                <Investments />
                            </PrivateRoute>
                        } />
                        <Route path="/referrals" element={
                            <PrivateRoute>
                                <Referrals />
                            </PrivateRoute>
                        } />
                        <Route path="/finances" element={
                            <PrivateRoute>
                                <Finances />
                            </PrivateRoute>
                        } />
                
                        {/* Rotas administrativas */}
                        <Route path="/admin-dashboard" element={
                            <PrivateRoute requireAdmin>
                                <AdminDashboard />
                            </PrivateRoute>
                        } />
                        <Route path="/admin-settings" element={
                            <PrivateRoute requireAdmin>
                                <AdminSettings />
                            </PrivateRoute>
                        } />
                        <Route path="/admin-users" element={
                            <PrivateRoute requireAdmin>
                                <AdminUsers />
                            </PrivateRoute>
                        } />
                        <Route path="/admin-transactions" element={
                            <PrivateRoute requireAdmin>
                                <AdminTransactions />
                            </PrivateRoute>
                        } />
                        <Route path="/admin-investments" element={
                            <PrivateRoute requireAdmin>
                                <AdminInvestments />
                            </PrivateRoute>
                        } />
                        <Route path="/admin-network" element={
                            <PrivateRoute requireAdmin>
                                <AdminNetwork />
                            </PrivateRoute>
                        } />
                        <Route path="/admin-commissions" element={
                            <PrivateRoute requireAdmin>
                                <AdminCommissions />
                            </PrivateRoute>
                        } />
                        <Route path="/admin-dividends" element={
                            <PrivateRoute requireAdmin>
                                <AdminDividends />
                            </PrivateRoute>
                        } />

                        {/* Rota de fallback */}
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </Layout>
            )}
        </>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}