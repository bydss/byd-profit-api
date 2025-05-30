// Simulação de um banco de dados local
import { Referral } from './entities';

const USERS_STORAGE_KEY = 'byd_profit_users';
const CURRENT_USER_STORAGE_KEY = 'byd_profit_current_user';

// Função para limpar o localStorage
const clearLocalStorage = () => {
  localStorage.removeItem(USERS_STORAGE_KEY);
  localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
};

// Limpar o localStorage para recriar os usuários padrão
clearLocalStorage();

// Carregar usuários do localStorage ou usar padrão
let users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY)) || [
  {
    id: "admin",
    name: "Administrador",
    email: "admin@bydprofit.com",
    password: "admin123",
    role: "admin",
    profile_complete: true,
    created_at: new Date().toISOString(),
    total_earnings: 0,
    balance: 0,
    total_invested: 0,
    active_investments: [],
    total_referrals: 0,
    network_level: 1,
    updated_at: new Date().toISOString(),
    referral_code: "ADMIN2024"
  },
  {
    id: "user1",
    name: "Usuário Teste",
    email: "user@bydprofit.com",
    password: "user123",
    role: "user",
    profile_complete: true,
    created_at: new Date().toISOString(),
    total_earnings: 1500,
    balance: 500,
    total_invested: 1000,
    active_investments: [
      {
        plan_id: "BASIC",
        amount: 1000,
        start_date: "2024-03-01",
        end_date: "2024-03-31",
        daily_return: 3.33
      }
    ],
    total_referrals: 3,
    network_level: 2,
    updated_at: new Date().toISOString(),
    referral_code: "USER2024"
  }
];

// Carregar usuário atual do localStorage
let currentUser = JSON.parse(localStorage.getItem(CURRENT_USER_STORAGE_KEY));

// Função para persistir dados
const persistData = () => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(currentUser));
};

// Persistir os dados iniciais
persistData();

export const auth = {
  // Registrar um novo usuário
  register: async (userData) => {
    // Simular uma chamada de API
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verificar se o e-mail já está em uso
    if (users.find(u => u.email === userData.email)) {
      throw new Error("Este e-mail já está em uso.");
    }

    // Verificar código de indicação se fornecido
    let sponsor = null;
    if (userData.referred_by) {
      console.log("Procurando patrocinador com código:", userData.referred_by);
      console.log("Usuários disponíveis:", users);
      sponsor = users.find(u => u.referral_code === userData.referred_by);
      if (!sponsor) {
        throw new Error("Código de indicação inválido.");
      }
    }

    // Criar novo usuário
    const newUser = {
      id: Date.now().toString(),
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: "user",
      profile_complete: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      total_earnings: 0,
      balance: 0,
      total_invested: 0,
      active_investments: [],
      total_referrals: 0,
      network_level: 1,
      referral_code: `${userData.name.split(' ')[0].toUpperCase()}${Date.now().toString().slice(-6)}`,
      referred_by: userData.referred_by || null,
      full_name: userData.name
    };

    // Verificar se o código de indicação é único
    while (users.find(u => u.referral_code === newUser.referral_code)) {
      const timestamp = new Date().getTime().toString().slice(-6);
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      newUser.referral_code = `${userData.name.split(' ')[0].toUpperCase()}${timestamp}${randomNum}`;
    }

    users.push(newUser);
    currentUser = newUser;

    // Se houver um patrocinador, criar a cadeia de referrals
    if (sponsor) {
      await Referral.createReferralChain(newUser, sponsor);
      
      // Atualizar o número de indicações do patrocinador
      const sponsorIndex = users.findIndex(u => u.id === sponsor.id);
      if (sponsorIndex !== -1) {
        users[sponsorIndex].total_referrals = (users[sponsorIndex].total_referrals || 0) + 1;
      }
    }

    persistData();
    return newUser;
  },

  // Login de usuário
  login: async (email, password) => {
    // Simular uma chamada de API
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      throw new Error("E-mail ou senha inválidos.");
    }

    currentUser = user;
    persistData();
    return user;
  },

  // Logout de usuário
  logout: async () => {
    // Simular uma chamada de API
    await new Promise(resolve => setTimeout(resolve, 1000));
    currentUser = null;
    persistData();
  },

  // Obter usuário atual
  me: async () => {
    // Simular uma chamada de API
    await new Promise(resolve => setTimeout(resolve, 100));

    if (!currentUser) {
      throw new Error("Usuário não autenticado.");
    }

    // Buscar usuário atualizado no "banco de dados"
    const user = users.find(u => u.id === currentUser.id);
    if (!user) {
      throw new Error("Usuário não encontrado.");
    }

    return user;
  },

  // Verificar se o usuário está autenticado
  isAuthenticated: () => {
    return currentUser !== null;
  },

  // Verificar se o usuário atual é admin
  isAdmin: () => {
    return currentUser?.role === "admin";
  },

  // Obter usuário atual de forma síncrona
  getCurrentUser: () => {
    return currentUser;
  },

  // Atualizar dados do usuário
  updateMyUserData: async (updateData) => {
    // Simular uma chamada de API
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (!currentUser) {
      throw new Error("Usuário não autenticado.");
    }

    // Atualizar usuário no "banco de dados"
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex === -1) {
      throw new Error("Usuário não encontrado.");
    }

    // Impedir alteração do role a menos que seja admin
    if (updateData.role && currentUser.role !== "admin") {
      throw new Error("Operação não permitida.");
    }

    // Garantir que active_investments seja sempre um array
    if (updateData.active_investments !== undefined) {
      updateData.active_investments = Array.isArray(updateData.active_investments) 
        ? updateData.active_investments 
        : [];
    }

    // Preservar dados existentes que não devem ser sobrescritos
    const preservedData = {
      id: users[userIndex].id,
      referral_code: users[userIndex].referral_code,
      referred_by: users[userIndex].referred_by,
      role: users[userIndex].role,
      total_referrals: users[userIndex].total_referrals,
      network_level: users[userIndex].network_level,
      created_at: users[userIndex].created_at
    };

    // Atualizar dados do usuário
    const updatedUser = {
      ...users[userIndex], // Dados existentes
      ...updateData, // Novos dados
      ...preservedData, // Dados que devem ser preservados
      updated_at: new Date().toISOString()
    };

    // Atualizar totais
    if (updateData.active_investments !== undefined) {
      updatedUser.total_invested = updateData.active_investments.reduce((sum, inv) => sum + inv.amount, 0);
    }

    users[userIndex] = updatedUser;
    currentUser = updatedUser;
    persistData();

    return updatedUser;
  },

  // Funções administrativas
  admin: {
    // Criar um novo usuário admin (apenas admins podem fazer isso)
    createAdmin: async (userData) => {
      if (!currentUser || currentUser.role !== "admin") {
        throw new Error("Acesso negado.");
      }

      const newAdmin = {
        ...userData,
        id: Date.now().toString(),
        role: "admin",
        profile_complete: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      users.push(newAdmin);
      persistData();
      return newAdmin;
    },

    // Atualizar role de um usuário (apenas admins podem fazer isso)
    updateUserRole: async (userId, newRole) => {
      if (!currentUser || currentUser.role !== "admin") {
        throw new Error("Acesso negado.");
      }

      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex === -1) {
        throw new Error("Usuário não encontrado.");
      }

      users[userIndex] = {
        ...users[userIndex],
        role: newRole,
        updated_at: new Date().toISOString()
      };

      persistData();
      return users[userIndex];
    }
  }
}; 