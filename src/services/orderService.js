import axios from 'axios';

// Configuração do serviço de e-mail (você pode usar qualquer serviço de sua preferência)
const emailApi = axios.create({
  baseURL: 'https://api.emailprovider.com', // Substitua pela sua API de e-mail
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.EMAIL_API_KEY}` // Configure esta variável de ambiente
  }
});

export const orderService = {
  // Atualizar status do pedido
  updateOrderStatus: async (externalRef, status) => {
    try {
      // Aqui você deve implementar a lógica para atualizar o status no seu banco de dados
      // Exemplo usando uma API:
      const response = await axios.put(`/api/orders/${externalRef}`, {
        status,
        updatedAt: new Date().toISOString()
      });

      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar pedido ${externalRef}:`, error);
      throw error;
    }
  },

  // Enviar e-mail de confirmação de pagamento
  sendPaymentConfirmationEmail: async (transactionData) => {
    const { customer, amount, externalRef } = transactionData;
    
    const emailData = {
      to: customer.email,
      subject: 'Pagamento Confirmado!',
      template: 'payment-confirmation',
      data: {
        customerName: customer.name,
        orderNumber: externalRef,
        amount: (amount / 100).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }),
        paymentDate: new Date().toLocaleDateString('pt-BR'),
        items: transactionData.items
      }
    };

    try {
      await emailApi.post('/send', emailData);
    } catch (error) {
      console.error('Erro ao enviar e-mail de confirmação:', error);
      // Não lançamos o erro para não interromper o fluxo principal
    }
  },

  // Enviar e-mail de notificação de reembolso
  sendRefundNotificationEmail: async (transactionData) => {
    const { customer, amount, externalRef } = transactionData;
    
    const emailData = {
      to: customer.email,
      subject: 'Reembolso Processado',
      template: 'refund-notification',
      data: {
        customerName: customer.name,
        orderNumber: externalRef,
        amount: (amount / 100).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }),
        refundDate: new Date().toLocaleDateString('pt-BR')
      }
    };

    try {
      await emailApi.post('/send', emailData);
    } catch (error) {
      console.error('Erro ao enviar e-mail de reembolso:', error);
      // Não lançamos o erro para não interromper o fluxo principal
    }
  }
}; 