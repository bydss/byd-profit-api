// Status de transação
export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

// Tipos de transação
export const TRANSACTION_TYPES = {
  DEPOSIT: 'deposit',
  WITHDRAWAL: 'withdrawal',
  INVESTMENT: 'investment',
  COMMISSION: 'commission',
  DIVIDEND: 'dividend'
};

// Status de investimento
export const INVESTMENT_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Status de pagamento
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed'
};

// Tipos de comissão
export const COMMISSION_TYPES = {
  REFERRAL: 'referral',
  NETWORK: 'network',
  LEADERSHIP: 'leadership'
};

// Níveis de usuário
export const USER_LEVELS = {
  STARTER: 1,
  BRONZE: 2,
  SILVER: 3,
  GOLD: 4,
  PLATINUM: 5,
  DIAMOND: 6
};

// Requisitos de nível
export const LEVEL_REQUIREMENTS = {
  [USER_LEVELS.STARTER]: { directReferrals: 0, networkVolume: 0 },
  [USER_LEVELS.BRONZE]: { directReferrals: 2, networkVolume: 5000 },
  [USER_LEVELS.SILVER]: { directReferrals: 5, networkVolume: 15000 },
  [USER_LEVELS.GOLD]: { directReferrals: 10, networkVolume: 50000 },
  [USER_LEVELS.PLATINUM]: { directReferrals: 20, networkVolume: 150000 },
  [USER_LEVELS.DIAMOND]: { directReferrals: 50, networkVolume: 500000 }
};

// Taxas de comissão por nível
export const COMMISSION_RATES = {
  [USER_LEVELS.STARTER]: 0.05,
  [USER_LEVELS.BRONZE]: 0.07,
  [USER_LEVELS.SILVER]: 0.08,
  [USER_LEVELS.GOLD]: 0.10,
  [USER_LEVELS.PLATINUM]: 0.12,
  [USER_LEVELS.DIAMOND]: 0.15
};

// Profundidade da rede por nível
export const NETWORK_DEPTH = {
  [USER_LEVELS.STARTER]: 1,
  [USER_LEVELS.BRONZE]: 2,
  [USER_LEVELS.SILVER]: 3,
  [USER_LEVELS.GOLD]: 4,
  [USER_LEVELS.PLATINUM]: 5,
  [USER_LEVELS.DIAMOND]: 6
};

// Taxas de comissão por nível de profundidade
export const NETWORK_COMMISSION_RATES = {
  1: 0.05,
  2: 0.03,
  3: 0.02,
  4: 0.015,
  5: 0.01,
  6: 0.005
};

// Limites de saque
export const WITHDRAWAL_LIMITS = {
  MIN_AMOUNT: 100,
  MAX_AMOUNT: 50000,
  DAILY_LIMIT: 100000
};

// Configurações de investimento
export const INVESTMENT_CONFIG = {
  MIN_AMOUNT: 100,
  MAX_AMOUNT: 1000000,
  MIN_DURATION: 30,
  MAX_DURATION: 365
};

// Configurações de pagamento automático
export const AUTO_PAYMENT_CONFIG = {
  DIVIDEND_FREQUENCY: 'daily',
  COMMISSION_FREQUENCY: 'daily',
  PROCESSING_TIME: '00:00'
};

// Configurações de perfil
export const PROFILE_FIELDS = {
  REQUIRED: [
    'full_name',
    'cpf',
    'phone',
    'birth_date',
    'address'
  ],
  OPTIONAL: [
    'company_name',
    'cnpj',
    'website',
    'social_media'
  ]
};

// Configurações de documentos
export const DOCUMENT_TYPES = {
  RG: 'rg',
  CPF: 'cpf',
  CNH: 'cnh',
  PROOF_OF_ADDRESS: 'proof_of_address',
  SELFIE: 'selfie'
};

// Status de verificação
export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

// Configurações de notificação
export const NOTIFICATION_TYPES = {
  TRANSACTION: 'transaction',
  INVESTMENT: 'investment',
  COMMISSION: 'commission',
  DIVIDEND: 'dividend',
  NETWORK: 'network',
  SYSTEM: 'system'
};

// Configurações de segurança
export const SECURITY_CONFIG = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REQUIRES_UPPERCASE: true,
  PASSWORD_REQUIRES_NUMBER: true,
  PASSWORD_REQUIRES_SPECIAL: true,
  SESSION_TIMEOUT: 30 // minutos
};

// Configurações de paginação
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100
};

// Configurações de cache
export const CACHE_CONFIG = {
  USER_TTL: 300, // 5 minutos
  INVESTMENT_TTL: 300,
  TRANSACTION_TTL: 300,
  SYSTEM_CONFIG_TTL: 3600 // 1 hora
};

// URLs do sistema
export const SYSTEM_URLS = {
  TERMS_OF_SERVICE: '/terms',
  PRIVACY_POLICY: '/privacy',
  HELP_CENTER: '/help',
  SUPPORT: '/support',
  FAQ: '/faq'
};

// Configurações de contato
export const CONTACT_INFO = {
  EMAIL: 'suporte@bydprofit.com',
  PHONE: '0800 123 4567',
  WHATSAPP: '+55 11 99999-9999',
  TELEGRAM: '@bydprofit'
}; 