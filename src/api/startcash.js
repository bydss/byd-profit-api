import axios from 'axios';

const PUBLIC_KEY = 'pk_nrik0IeE1ptuhwaqjHg0IBFucTnKvtgqVbJSe2Kx77ZA3RmV';
const SECRET_KEY = 'sk_cqV72l8N_yrWizYMZkNvxw5wCdDRK-wuih9-y0V-IiZ6BoCV';

const startCashApi = axios.create({
  baseURL: 'https://api.startcash.io/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Basic ${Buffer.from(PUBLIC_KEY + ':' + SECRET_KEY).toString('base64')}`
  }
});

// Interceptor para adicionar o token de autenticação
startCashApi.interceptors.request.use(config => {
  const token = localStorage.getItem('startcash_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const StartCash = {
  // Dados da empresa
  getCompanyData: async () => {
    try {
      const response = await startCashApi.get('/company');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Criar transação PIX
  createPixTransaction: async (transactionData) => {
    try {
      const payload = {
        amount: transactionData.amount,
        paymentMethod: 'pix',
        currency: 'BRL',
        items: transactionData.items || [],
        customer: transactionData.customer,
        externalRef: transactionData.externalRef,
        postbackUrl: transactionData.postbackUrl
      };

      const response = await startCashApi.post('/transactions', payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Buscar transação específica
  getTransaction: async (transactionId) => {
    try {
      const response = await startCashApi.get(`/transactions/${transactionId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Listar transações
  listTransactions: async (filters = {}) => {
    try {
      const response = await startCashApi.get('/transactions', { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Criar saque
  createWithdraw: async (withdrawData) => {
    try {
      const response = await startCashApi.post('/transfers', withdrawData, {
        headers: {
          'x-withdraw-key': withdrawData.withdrawKey
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Buscar saque específico
  getWithdraw: async (withdrawId) => {
    try {
      const response = await startCashApi.get(`/transfers/${withdrawId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Listar saques
  listWithdraws: async () => {
    try {
      const response = await startCashApi.get('/transfers');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Obter saldo disponível
  getAvailableBalance: async () => {
    try {
      const response = await startCashApi.get('/balance/available');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Validar webhook
  validateWebhook: (requestBody, signature) => {
    // Implementar validação do webhook conforme documentação
    return true;
  }
}; 