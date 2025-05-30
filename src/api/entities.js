import { auth } from "./auth";

// Constantes de armazenamento
const STORAGE_KEYS = {
  USERS: 'byd_profit_users',
  REFERRALS: 'byd_profit_referrals',
  TRANSACTIONS: 'byd_profit_transactions',
  INVESTMENT_PLANS: 'byd_profit_investment_plans',
  DIVIDENDS: 'byd_profit_dividends',
  COMMISSIONS: 'byd_profit_commissions',
  NETWORK_CHANGES: 'byd_profit_network_changes',
  SYSTEM_CONFIGS: 'byd_profit_system_configs',
  AUTO_PAYMENT_CONFIGS: 'byd_profit_auto_payment_configs'
};

// Função para persistir dados no localStorage
const persistData = () => {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  localStorage.setItem(STORAGE_KEYS.REFERRALS, JSON.stringify(referrals));
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  localStorage.setItem(STORAGE_KEYS.INVESTMENT_PLANS, JSON.stringify(investmentPlans));
  localStorage.setItem(STORAGE_KEYS.DIVIDENDS, JSON.stringify(dividends));
  localStorage.setItem(STORAGE_KEYS.COMMISSIONS, JSON.stringify(commissions));
  localStorage.setItem(STORAGE_KEYS.NETWORK_CHANGES, JSON.stringify(networkChanges));
  localStorage.setItem(STORAGE_KEYS.SYSTEM_CONFIGS, JSON.stringify(systemConfigs));
  localStorage.setItem(STORAGE_KEYS.AUTO_PAYMENT_CONFIGS, JSON.stringify(autoPaymentConfigs));
};

// Função para carregar dados do localStorage
const loadStoredData = () => {
  const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
  const storedReferrals = localStorage.getItem(STORAGE_KEYS.REFERRALS);
  const storedTransactions = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
  const storedInvestmentPlans = localStorage.getItem(STORAGE_KEYS.INVESTMENT_PLANS);
  const storedDividends = localStorage.getItem(STORAGE_KEYS.DIVIDENDS);
  const storedCommissions = localStorage.getItem(STORAGE_KEYS.COMMISSIONS);
  const storedNetworkChanges = localStorage.getItem(STORAGE_KEYS.NETWORK_CHANGES);
  const storedSystemConfigs = localStorage.getItem(STORAGE_KEYS.SYSTEM_CONFIGS);
  const storedAutoPaymentConfigs = localStorage.getItem(STORAGE_KEYS.AUTO_PAYMENT_CONFIGS);

  if (storedUsers) users = JSON.parse(storedUsers);
  if (storedReferrals) referrals = JSON.parse(storedReferrals);
  if (storedTransactions) transactions = JSON.parse(storedTransactions);
  if (storedInvestmentPlans) investmentPlans = JSON.parse(storedInvestmentPlans);
  if (storedDividends) dividends = JSON.parse(storedDividends);
  if (storedCommissions) commissions = JSON.parse(storedCommissions);
  if (storedNetworkChanges) networkChanges = JSON.parse(storedNetworkChanges);
  if (storedSystemConfigs) systemConfigs = JSON.parse(storedSystemConfigs);
  if (storedAutoPaymentConfigs) autoPaymentConfigs = JSON.parse(storedAutoPaymentConfigs);
};

// Funções auxiliares
const generateId = () => Date.now().toString();

const simulateApiCall = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
};

// Verificação de permissão admin
const requireAdmin = () => {
  if (!auth.isAdmin()) {
    throw new Error("Acesso negado. Esta operação requer privilégios administrativos.");
  }
};

// Simulação de bancos de dados locais
let users = [
  {
    id: "admin",
    name: "Administrador",
    email: "admin@bydprofit.com",
    password: "admin123",
    role: "admin",
    profile_complete: true,
    created_at: new Date().toISOString(),
    total_earnings: 0,
    available_balance: 0,
    total_invested: 0,
    active_investments: 0,
    total_referrals: 0,
    network_level: 1,
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
    available_balance: 500,
    total_invested: 1000,
    active_investments: 2,
    total_referrals: 3,
    network_level: 2,
    referral_code: "USER2024"
  }
];

let transactions = [
  {
    id: "1",
    user_id: "user1",
    type: "investment",
    amount: -1000,
    status: "completed",
    description: "Investimento em Plano Básico BYD",
    payment_method: "balance",
    reference_id: "BASIC",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "2",
    user_id: "user1",
    type: "deposit",
    amount: 1000,
    status: "completed",
    description: "Depósito via PIX",
    payment_method: "pix",
    reference_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

let investmentPlans = [
  {
    id: "1",
    code: "BASIC",
    name: "Plano Básico BYD",
    description: "Invista no futuro da mobilidade elétrica",
    value: 1000,
    return_rate: 10,
    return_period: 30,
    daily_profit: 3.33,
    total_profit: 100,
    image_url: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=500&auto=format&fit=crop",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "2",
    code: "PREMIUM",
    name: "Plano Premium BYD",
    description: "Maximize seus ganhos com investimentos premium",
    value: 5000,
    return_rate: 15,
    return_period: 60,
    daily_profit: 12.50,
    total_profit: 750,
    image_url: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=500&auto=format&fit=crop",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

let referrals = [];

let dividends = [
  {
    id: "1",
    user_id: "user1",
    investment_plan_id: "BASIC",
    amount: 3.33,
    status: "pending",
    payment_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

let commissions = [
  {
    id: "1",
    user_id: "user1",
    referral_id: "2",
    amount: 50,
    type: "referral_investment",
    status: "pending",
    description: "Comissão por investimento de referido",
    payment_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

let networkChanges = [
  {
    id: "1",
    user_id: "user1",
    type: "level_up",
    old_level: 1,
    new_level: 2,
    reason: "Atingiu 3 referências ativas",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

let systemConfigs = [
  {
    id: "1",
    key: "referral_commission_rate",
    value: "0.1",
    description: "Taxa de comissão para indicações",
    type: "decimal",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "2",
    key: "min_withdrawal",
    value: "100",
    description: "Valor mínimo para saque",
    type: "decimal",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "3",
    key: "withdrawal_fee",
    value: "0.02",
    description: "Taxa de saque (2%)",
    type: "decimal",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

let autoPaymentConfigs = [
  {
    id: "1",
    type: "dividend",
    frequency: "daily",
    active: true,
    last_run: new Date().toISOString(),
    next_run: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Carregar dados do localStorage
loadStoredData();

// Persistir dados iniciais se não houver dados armazenados
if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
  persistData();
}

// Função para verificar e corrigir inconsistências nos dados
const verifyDataConsistency = () => {
  // Verificar comissões e saldos
  commissions.forEach(commission => {
    if (commission.status === "paid") {
      const user = users.find(u => u.id === commission.user_id);
      if (user) {
        // Verificar se a transação correspondente existe
        const transactionExists = transactions.some(t => 
          t.reference_id === commission.id && 
          t.type === "referral_bonus" && 
          t.status === "completed"
        );

        if (!transactionExists) {
          // Criar transação faltante
          transactions.push({
            id: generateId(),
            user_id: commission.user_id,
            type: "referral_bonus",
            amount: commission.commission_amount,
            status: "completed",
            description: `Comissão nível ${commission.level} - ${commission.description}`,
            payment_method: "balance",
            reference_id: commission.id,
            created_at: commission.paid_date || commission.updated_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      }
    }
  });

  // Recalcular saldos dos usuários
  users.forEach(user => {
    const userTransactions = transactions.filter(t => 
      t.user_id === user.id && 
      t.status === "completed"
    );

    const balance = userTransactions.reduce((sum, t) => sum + t.amount, 0);
    if (user.balance !== balance) {
      const index = users.findIndex(u => u.id === user.id);
      if (index !== -1) {
        users[index] = {
          ...users[index],
          balance: balance,
          updated_at: new Date().toISOString()
        };
      }
    }
  });

  persistData();
};

// Adicionar verificação de consistência ao syncData
const syncData = () => {
  verifyDataConsistency();
  persistData();
  // Emitir evento de atualização
  const event = new CustomEvent('dataUpdated');
  window.dispatchEvent(event);
};

// User entity
export const User = {
  // Listar todos os usuários (requer admin)
  list: async (orderBy = "-created_at") => {
    await simulateApiCall();
    requireAdmin();
    return [...users].sort((a, b) => {
      const field = orderBy.startsWith("-") ? orderBy.slice(1) : orderBy;
      const order = orderBy.startsWith("-") ? -1 : 1;
      return a[field] > b[field] ? order : -order;
    });
  },

  // Buscar usuário por ID (requer admin)
  get: async (id) => {
    await simulateApiCall();
    requireAdmin();
    const user = users.find(u => u.id === id);
    if (!user) throw new Error("Usuário não encontrado");
    return user;
  },

  // Atualizar usuário por ID (requer admin)
  update: async (id, data) => {
    await simulateApiCall();
    requireAdmin();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) throw new Error("Usuário não encontrado");
    users[index] = { ...users[index], ...data, updated_at: new Date().toISOString() };
    syncData(); // Sincronizar após atualização
    return users[index];
  },

  // Deletar usuário (requer admin)
  delete: async (id) => {
    await simulateApiCall();
    requireAdmin();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) throw new Error("Usuário não encontrado");
    users.splice(index, 1);
  },

  // Obter usuário atual
  me: async () => {
    await simulateApiCall();
    return auth.me();
  },

  filter: async (filters) => {
    await simulateApiCall();
    return users.filter(u => {
      for (const [key, value] of Object.entries(filters)) {
        if (u[key] !== value) return false;
      }
      return true;
    });
  },

  create: async (data) => {
    await simulateApiCall();
    const newUser = { id: generateId(), ...data };
    users.push(newUser);
    return newUser;
  }
};

// Transaction entity
export const Transaction = {
  // Listar todas as transações (requer admin para ver todas, ou filtra por usuário)
  list: async (orderBy = "-created_at") => {
    await simulateApiCall();
    const currentUser = auth.getCurrentUser();
    
    if (!currentUser) {
      throw new Error("Usuário não autenticado");
    }

    let filteredTransactions = transactions;
    if (currentUser.role !== "admin") {
      filteredTransactions = transactions.filter(t => t.user_id === currentUser.id);
    }

    return [...filteredTransactions].sort((a, b) => {
      const field = orderBy.startsWith("-") ? orderBy.slice(1) : orderBy;
      const order = orderBy.startsWith("-") ? -1 : 1;
      return a[field] > b[field] ? order : -order;
    });
  },

  // Criar nova transação
  create: async (data) => {
    await simulateApiCall();
    const currentUser = auth.getCurrentUser();
    
    if (!currentUser) {
      throw new Error("Usuário não autenticado");
    }

    // Apenas admin pode criar transações para outros usuários
    if (data.user_id && data.user_id !== currentUser.id && !auth.isAdmin()) {
      throw new Error("Operação não permitida");
    }

    const transaction = {
      id: generateId(),
      user_id: data.user_id || currentUser.id,
      type: data.type,
      amount: data.amount,
      status: data.status || "pending",
      description: data.description,
      payment_method: data.payment_method,
      reference_id: data.reference_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    transactions.push(transaction);
    syncData(); // Sincronizar após criar transação
    return transaction;
  },

  // Atualizar transação (requer admin)
  update: async (id, data) => {
    await simulateApiCall();
    requireAdmin();
    
    const index = transactions.findIndex(t => t.id === id);
    if (index === -1) throw new Error("Transação não encontrada");
    
    transactions[index] = {
      ...transactions[index],
      ...data,
      updated_at: new Date().toISOString()
    };
    
    syncData(); // Sincronizar após atualizar transação
    return transactions[index];
  },

  // Filtrar transações
  filter: async (filters = {}, orderBy = "-created_at") => {
    await simulateApiCall();
    const currentUser = auth.getCurrentUser();
    
    if (!currentUser) {
      throw new Error("Usuário não autenticado");
    }

    // Se não for admin, força filtro por user_id
    if (!auth.isAdmin()) {
      filters.user_id = currentUser.id;
    }

    let filtered = transactions.filter(transaction => {
      return Object.entries(filters).every(([key, value]) => {
        return transaction[key] === value;
      });
    });

    return [...filtered].sort((a, b) => {
      const field = orderBy.startsWith("-") ? orderBy.slice(1) : orderBy;
      const order = orderBy.startsWith("-") ? -1 : 1;
      return a[field] > b[field] ? order : -order;
    });
  }
};

// InvestmentPlan entity
export const InvestmentPlan = {
  list: async () => {
    await simulateApiCall();
    return investmentPlans;
  },
  create: async (data) => {
    await simulateApiCall();
    const newPlan = {
      id: generateId(),
      code: data.code,
      name: data.name,
      value: parseFloat(data.value),
      return_rate: parseFloat(data.return_rate),
      return_period: parseInt(data.return_period),
      daily_profit: parseFloat(data.daily_profit),
      total_profit: parseFloat(data.total_profit),
      image_url: data.image_url || "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=500&auto=format&fit=crop",
      is_active: data.is_active !== false
    };
    investmentPlans.push(newPlan);
    return newPlan;
  },
  update: async (id, data) => {
    await simulateApiCall();
    const index = investmentPlans.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Plano não encontrado");
    
    const updatedPlan = {
      ...investmentPlans[index],
      ...data,
      value: parseFloat(data.value || investmentPlans[index].value),
      return_rate: parseFloat(data.return_rate || investmentPlans[index].return_rate),
      return_period: parseInt(data.return_period || investmentPlans[index].return_period),
      daily_profit: parseFloat(data.daily_profit || investmentPlans[index].daily_profit),
      total_profit: parseFloat(data.total_profit || investmentPlans[index].total_profit),
      is_active: data.is_active !== undefined ? data.is_active : investmentPlans[index].is_active
    };
    
    investmentPlans[index] = updatedPlan;
    return updatedPlan;
  },
  delete: async (id) => {
    await simulateApiCall();
    const index = investmentPlans.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Plano não encontrado");
    investmentPlans.splice(index, 1);
  }
};

// Referral entity
export const Referral = {
  list: async () => {
    await simulateApiCall();
    return referrals;
  },

  filter: async (filters) => {
    await simulateApiCall();
    return referrals.filter(ref => {
      for (const [key, value] of Object.entries(filters)) {
        if (ref[key] !== value) return false;
      }
      return true;
    });
  },

  create: async (data) => {
    await simulateApiCall();
    const newReferral = {
      id: generateId(),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    referrals.push(newReferral);
    persistData(); // Persistir dados após criar referral
    return newReferral;
  },

  update: async (id, data) => {
    await simulateApiCall();
    const index = referrals.findIndex(r => r.id === id);
    if (index === -1) throw new Error("Referral não encontrado");
    referrals[index] = {
      ...referrals[index],
      ...data,
      updated_at: new Date().toISOString()
    };
    persistData(); // Persistir dados após atualizar referral
    return referrals[index];
  },

  delete: async (id) => {
    await simulateApiCall();
    const index = referrals.findIndex(r => r.id === id);
    if (index === -1) throw new Error("Referral não encontrado");
    referrals.splice(index, 1);
    persistData(); // Persistir dados após deletar referral
  },

  // Função para criar a cadeia de referrals
  createReferralChain: async (user, sponsor) => {
    console.log('Criando cadeia de referrals para:', user.name);
    console.log('Patrocinador:', sponsor.name);

    // Nível 1 - Indicação direta
    const level1Referral = await Referral.create({
      referrer_id: sponsor.id,
      referred_id: user.id,
      referred_email: user.email,
      referred_name: user.name,
      level: 1,
      commission_rate: 17,
      status: "active",
      parent_id: null
    });

    console.log('Referral nível 1 criado:', level1Referral);

    // Nível 2 - Se o patrocinador tem um patrocinador
    if (sponsor.referred_by) {
      const level2Sponsor = users.find(u => u.referral_code === sponsor.referred_by);
      if (level2Sponsor) {
        const level2Referral = await Referral.create({
          referrer_id: level2Sponsor.id,
          referred_id: user.id,
          referred_email: user.email,
          referred_name: user.name,
          level: 2,
          commission_rate: 2,
          status: "active",
          parent_id: level1Referral.id
        });

        console.log('Referral nível 2 criado:', level2Referral);

        // Nível 3 - Se o patrocinador nível 2 tem um patrocinador
        if (level2Sponsor.referred_by) {
          const level3Sponsor = users.find(u => u.referral_code === level2Sponsor.referred_by);
          if (level3Sponsor) {
            const level3Referral = await Referral.create({
              referrer_id: level3Sponsor.id,
              referred_id: user.id,
              referred_email: user.email,
              referred_name: user.name,
              level: 3,
              commission_rate: 1,
              status: "active",
              parent_id: level2Referral.id
            });

            console.log('Referral nível 3 criado:', level3Referral);
          }
        }
      }
    }

    persistData(); // Persistir todos os dados após criar a cadeia completa
  }
};

// Dividend entity
export const Dividend = {
  list: async () => {
    await simulateApiCall();
    return dividends;
  },
  filter: async (filters, orderBy = "-created_at") => {
    await simulateApiCall();
    let filtered = dividends.filter(d => {
      for (const [key, value] of Object.entries(filters)) {
        if (d[key] !== value) return false;
      }
      return true;
    });

    // Ordenar por data de criação
    filtered.sort((a, b) => {
      const aDate = new Date(a.created_at);
      const bDate = new Date(b.created_at);
      return orderBy.startsWith("-") ? bDate - aDate : aDate - bDate;
    });

    return filtered;
  },
  create: async (data) => {
    await simulateApiCall();
    const newDividend = {
      id: generateId(),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    dividends.push(newDividend);
    return newDividend;
  }
};

// Commission entity
export const Commission = {
  list: async () => {
    await simulateApiCall();
    return commissions;
  },
  filter: async (filters, orderBy = "-created_at") => {
    await simulateApiCall();
    let filtered = commissions.filter(c => {
      for (const [key, value] of Object.entries(filters)) {
        if (c[key] !== value) return false;
      }
      return true;
    });

    // Ordenar por data de criação
    filtered.sort((a, b) => {
      const aDate = new Date(a.created_at);
      const bDate = new Date(b.created_at);
      return orderBy.startsWith("-") ? bDate - aDate : aDate - bDate;
    });

    return filtered;
  },
  create: async (data) => {
    await simulateApiCall();
    const newCommission = {
      id: generateId(),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    commissions.push(newCommission);
    syncData(); // Sincronizar após criar comissão
    return newCommission;
  },
  update: async (id, data) => {
    await simulateApiCall();
    const index = commissions.findIndex(c => c.id === id);
    if (index === -1) throw new Error("Comissão não encontrada");
    commissions[index] = {
      ...commissions[index],
      ...data,
      updated_at: new Date().toISOString()
    };
    syncData(); // Sincronizar após atualizar comissão
    return commissions[index];
  }
};

// NetworkChange entity
export const NetworkChange = {
  list: async () => {
    await simulateApiCall();
    return networkChanges;
  },
  filter: async (filters, orderBy = "-created_at") => {
    await simulateApiCall();
    let filtered = networkChanges.filter(n => {
      for (const [key, value] of Object.entries(filters)) {
        if (n[key] !== value) return false;
      }
      return true;
    });

    // Ordenar por data de criação
    filtered.sort((a, b) => {
      const aDate = new Date(a.created_at);
      const bDate = new Date(b.created_at);
      return orderBy.startsWith("-") ? bDate - aDate : aDate - bDate;
    });

    return filtered;
  },
  create: async (data) => {
    await simulateApiCall();
    const newChange = {
      id: generateId(),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    networkChanges.push(newChange);
    return newChange;
  }
};

// SystemConfig entity
export const SystemConfig = {
  list: async () => {
    await simulateApiCall();
    return systemConfigs;
  },
  get: async (key) => {
    await simulateApiCall();
    const config = systemConfigs.find(c => c.key === key);
    if (!config) throw new Error(`Configuração '${key}' não encontrada`);
    return config;
  },
  create: async (data) => {
    await simulateApiCall();
    const newConfig = {
      id: generateId(),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    systemConfigs.push(newConfig);
    return newConfig;
  },
  update: async (id, data) => {
    await simulateApiCall();
    const index = systemConfigs.findIndex(c => c.id === id);
    if (index === -1) throw new Error("Configuração não encontrada");
    
    const updatedConfig = {
      ...systemConfigs[index],
      ...data,
      updated_at: new Date().toISOString()
    };
    
    systemConfigs[index] = updatedConfig;
    return updatedConfig;
  }
};

// AutoPaymentConfig entity
export const AutoPaymentConfig = {
  list: async () => {
    await simulateApiCall();
    return autoPaymentConfigs;
  },
  get: async (type) => {
    await simulateApiCall();
    const config = autoPaymentConfigs.find(c => c.type === type);
    if (!config) throw new Error(`Configuração de pagamento automático '${type}' não encontrada`);
    return config;
  },
  create: async (data) => {
    await simulateApiCall();
    const newConfig = {
      id: generateId(),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    autoPaymentConfigs.push(newConfig);
    return newConfig;
  },
  update: async (id, data) => {
    await simulateApiCall();
    const index = autoPaymentConfigs.findIndex(c => c.id === id);
    if (index === -1) throw new Error("Configuração não encontrada");
    
    const updatedConfig = {
      ...autoPaymentConfigs[index],
      ...data,
      updated_at: new Date().toISOString()
    };
    
    autoPaymentConfigs[index] = updatedConfig;
    return updatedConfig;
  }
}; 