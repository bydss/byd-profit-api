// Configurações do ambiente
export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_URL: process.env.VITE_API_URL || 'http://localhost:3000',
  APP_URL: process.env.VITE_APP_URL || 'http://localhost:5173'
};

// Configurações da aplicação
export const APP_CONFIG = {
  name: 'BYD Profit',
  version: '1.0.0',
  description: 'Plataforma de investimentos e marketing multinível',
  company: 'BYD Profit LTDA',
  cnpj: '00.000.000/0000-00',
  address: 'Av. Paulista, 1000 - São Paulo/SP',
  support: {
    email: 'suporte@bydprofit.com',
    phone: '0800 123 4567',
    whatsapp: '+55 11 99999-9999',
    telegram: '@bydprofit',
    hours: 'Segunda a Sexta, das 9h às 18h'
  }
};

// Configurações de autenticação
export const AUTH_CONFIG = {
  tokenKey: '@bydprofit:token',
  userKey: '@bydprofit:user',
  sessionTimeout: 30 * 60 * 1000, // 30 minutos
  refreshTokenKey: '@bydprofit:refresh_token',
  refreshTokenTimeout: 7 * 24 * 60 * 60 * 1000 // 7 dias
};

// Configurações de investimento
export const INVESTMENT_CONFIG = {
  minAmount: 100,
  maxAmount: 1000000,
  minDuration: 30,
  maxDuration: 365,
  returnRates: {
    30: 0.10, // 10% ao mês para 30 dias
    60: 0.12, // 12% ao mês para 60 dias
    90: 0.15, // 15% ao mês para 90 dias
    180: 0.18, // 18% ao mês para 180 dias
    365: 0.20 // 20% ao mês para 365 dias
  }
};

// Configurações de rede
export const NETWORK_CONFIG = {
  maxDepth: 6, // Profundidade máxima da rede
  commissionRates: {
    1: 0.05, // 5% para nível 1
    2: 0.03, // 3% para nível 2
    3: 0.02, // 2% para nível 3
    4: 0.015, // 1.5% para nível 4
    5: 0.01, // 1% para nível 5
    6: 0.005 // 0.5% para nível 6
  },
  levelRequirements: {
    1: { directReferrals: 0, networkVolume: 0 },
    2: { directReferrals: 2, networkVolume: 5000 },
    3: { directReferrals: 5, networkVolume: 15000 },
    4: { directReferrals: 10, networkVolume: 50000 },
    5: { directReferrals: 20, networkVolume: 150000 },
    6: { directReferrals: 50, networkVolume: 500000 }
  }
};

// Configurações de pagamento
export const PAYMENT_CONFIG = {
  methods: {
    pix: {
      enabled: true,
      minAmount: 100,
      maxAmount: 50000,
      fees: 0
    },
    bankTransfer: {
      enabled: true,
      minAmount: 500,
      maxAmount: 100000,
      fees: 0
    },
    crypto: {
      enabled: true,
      minAmount: 100,
      maxAmount: 1000000,
      fees: 0,
      currencies: ['BTC', 'ETH', 'USDT']
    }
  },
  withdrawal: {
    minAmount: 100,
    maxAmount: 50000,
    dailyLimit: 100000,
    processingDays: ['monday', 'wednesday', 'friday'],
    processingTime: '14:00',
    fees: {
      pix: 0,
      bankTransfer: 0,
      crypto: 0
    }
  }
};

// Configurações de cache
export const CACHE_CONFIG = {
  ttl: {
    user: 5 * 60, // 5 minutos
    investment: 5 * 60,
    transaction: 5 * 60,
    systemConfig: 60 * 60 // 1 hora
  },
  prefix: {
    user: 'user:',
    investment: 'investment:',
    transaction: 'transaction:',
    systemConfig: 'config:'
  }
};

// Configurações de upload
export const UPLOAD_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  documents: {
    rg: {
      required: true,
      maxSize: 2 * 1024 * 1024,
      allowedTypes: ['image/jpeg', 'image/png', 'application/pdf']
    },
    cpf: {
      required: true,
      maxSize: 2 * 1024 * 1024,
      allowedTypes: ['image/jpeg', 'image/png', 'application/pdf']
    },
    proofOfAddress: {
      required: true,
      maxSize: 2 * 1024 * 1024,
      allowedTypes: ['image/jpeg', 'image/png', 'application/pdf']
    },
    selfie: {
      required: true,
      maxSize: 2 * 1024 * 1024,
      allowedTypes: ['image/jpeg', 'image/png']
    }
  }
};

// Configurações de notificação
export const NOTIFICATION_CONFIG = {
  email: {
    enabled: true,
    templates: {
      welcome: 'welcome',
      resetPassword: 'reset-password',
      verifyEmail: 'verify-email',
      investmentConfirmation: 'investment-confirmation',
      withdrawalConfirmation: 'withdrawal-confirmation',
      commissionPaid: 'commission-paid',
      levelUp: 'level-up'
    }
  },
  sms: {
    enabled: true,
    templates: {
      verifyPhone: 'verify-phone',
      withdrawalCode: 'withdrawal-code',
      loginAlert: 'login-alert'
    }
  },
  push: {
    enabled: true,
    topics: {
      news: 'news',
      promotions: 'promotions',
      system: 'system'
    }
  }
};

// Configurações de segurança
export const SECURITY_CONFIG = {
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true
  },
  session: {
    maxAttempts: 5,
    blockDuration: 30 * 60, // 30 minutos
    requireMFA: false
  },
  jwt: {
    expiresIn: '1h',
    refreshExpiresIn: '7d'
  }
};

// Configurações de localização
export const LOCALE_CONFIG = {
  default: 'pt-BR',
  supported: ['pt-BR', 'en-US', 'es-ES'],
  currency: {
    code: 'BRL',
    symbol: 'R$',
    decimal: ',',
    thousand: '.'
  },
  timezone: 'America/Sao_Paulo'
}; 