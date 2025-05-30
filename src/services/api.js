import { auth } from '@/api/auth';
import { StartCash } from '@/api/startcash';
import {
  User,
  Transaction,
  InvestmentPlan,
  Referral,
  Commission,
  Dividend,
  NetworkChange,
  SystemConfig,
  AutoPaymentConfig
} from '@/api/entities';

// Serviço de autenticação
export const authService = {
  login: async (email, password) => {
    return auth.login(email, password);
  },
  
  register: async (userData) => {
    return auth.register(userData);
  },
  
  logout: async () => {
    return auth.logout();
  },
  
  me: async () => {
    return auth.me();
  },
  
  isAuthenticated: () => {
    return auth.isAuthenticated();
  },
  
  getCurrentUser: () => {
    return auth.getCurrentUser();
  },
  
  updateProfile: async (data) => {
    return auth.updateMyUserData(data);
  }
};

// Serviço de usuários
export const userService = {
  list: async () => {
    return User.list();
  },
  
  filter: async (filters) => {
    return User.filter(filters);
  },
  
  create: async (data) => {
    return User.create(data);
  },
  
  update: async (id, data) => {
    return User.update(id, data);
  }
};

// Serviço de transações
export const transactionService = {
  list: async () => {
    return Transaction.list();
  },
  
  filter: async (filters) => {
    return Transaction.filter(filters);
  },
  
  create: async (data) => {
    return Transaction.create(data);
  }
};

// Serviço de planos de investimento
export const investmentService = {
  list: async () => {
    return InvestmentPlan.list();
  },
  
  create: async (data) => {
    return InvestmentPlan.create(data);
  },
  
  update: async (id, data) => {
    return InvestmentPlan.update(id, data);
  }
};

// Serviço de indicações
export const referralService = {
  list: async () => {
    return Referral.list();
  },
  
  filter: async (filters) => {
    return Referral.filter(filters);
  },
  
  create: async (data) => {
    return Referral.create(data);
  }
};

// Serviço de comissões
export const commissionService = {
  list: async () => {
    return Commission.list();
  },
  
  filter: async (filters) => {
    return Commission.filter(filters);
  },
  
  create: async (data) => {
    return Commission.create(data);
  }
};

// Serviço de dividendos
export const dividendService = {
  list: async () => {
    return Dividend.list();
  },
  
  create: async (data) => {
    return Dividend.create(data);
  }
};

// Serviço de alterações na rede
export const networkService = {
  list: async () => {
    return NetworkChange.list();
  },
  
  create: async (data) => {
    return NetworkChange.create(data);
  }
};

// Serviço de configurações do sistema
export const systemConfigService = {
  list: async () => {
    return SystemConfig.list();
  },
  
  create: async (data) => {
    return SystemConfig.create(data);
  },
  
  update: async (id, data) => {
    return SystemConfig.update(id, data);
  }
};

// Serviço de configurações de pagamento automático
export const autoPaymentService = {
  list: async () => {
    return AutoPaymentConfig.list();
  },
  
  create: async (data) => {
    return AutoPaymentConfig.create(data);
  },
  
  update: async (id, data) => {
    return AutoPaymentConfig.update(id, data);
  }
};

// Serviço de pagamento StartCash
export const startCashService = {
  getCompanyData: async () => {
    return StartCash.getCompanyData();
  },
  
  createPixPayment: async (paymentData) => {
    const transactionData = {
      amount: paymentData.amount,
      items: paymentData.items || [{
        title: paymentData.description || 'Pagamento',
        quantity: 1,
        tangible: false,
        unitPrice: paymentData.amount
      }],
      customer: {
        name: paymentData.customer.name,
        email: paymentData.customer.email,
        phone: paymentData.customer.phone,
        document: {
          type: 'cpf',
          number: paymentData.customer.document
        },
        address: paymentData.customer.address
      },
      externalRef: paymentData.externalRef || `order-${Date.now()}`,
      postbackUrl: paymentData.postbackUrl
    };

    return StartCash.createPixTransaction(transactionData);
  },
  
  getTransaction: async (transactionId) => {
    return StartCash.getTransaction(transactionId);
  },
  
  listTransactions: async (filters) => {
    return StartCash.listTransactions(filters);
  },
  
  createWithdraw: async (withdrawData) => {
    return StartCash.createWithdraw(withdrawData);
  },
  
  getWithdraw: async (withdrawId) => {
    return StartCash.getWithdraw(withdrawId);
  },
  
  listWithdraws: async () => {
    return StartCash.listWithdraws();
  },
  
  getBalance: async () => {
    return StartCash.getAvailableBalance();
  },
  
  handleWebhook: (requestBody, signature) => {
    return StartCash.validateWebhook(requestBody, signature);
  }
};

try {
  const filters = {
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    status: 'paid' // opcional
  };
  
  const transactions = await startCashService.listTransactions(filters);
} catch (error) {
  console.error('Erro ao listar transações:', error);
}

try {
  const balance = await startCashService.getBalance();
  console.log('Saldo disponível:', balance.amount);
} catch (error) {
  console.error('Erro ao consultar saldo:', error);
}

try {
  const withdrawData = {
    amount: 1000, // R$ 10,00
    withdrawKey: 'wk_SUA-CHAVE-DE-SAQUE-EXTERNO'
  };
  
  const withdraw = await startCashService.createWithdraw(withdrawData);
} catch (error) {
  console.error('Erro ao criar saque:', error);
}

// No seu servidor
app.post('/webhook/startcash', async (req, res) => {
  const signature = req.headers['x-signature'];
  const isValid = startCashService.handleWebhook(req.body, signature);
  
  if (!isValid) {
    return res.status(400).json({ error: 'Invalid signature' });
  }
  
  const { type, data } = req.body;
  
  if (type === 'transaction' && data.status === 'paid') {
    // Atualizar o status do pedido no seu sistema
    await updateOrderStatus(data.externalRef, 'paid');
  }
  
  res.json({ received: true });
});

# Verificar status da aplicação
pm2 status

# Monitorar logs
pm2 logs byd-profit

# Configurar monitoramento automático
pm2 startup
pm2 save 

sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22
sudo ufw enable 

# Atualizar dependências
npm update

# Verificar logs de erro
pm2 logs byd-profit --err

# Monitorar uso de recursos
pm2 monit 