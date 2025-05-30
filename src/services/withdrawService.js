import axios from 'axios';

export const withdrawService = {
  // Atualizar status do saque
  updateWithdrawStatus: async (id, status) => {
    try {
      // Aqui você deve implementar a lógica para atualizar o status no seu banco de dados
      // Exemplo usando uma API:
      const response = await axios.put(`/api/withdraws/${id}`, {
        status,
        updatedAt: new Date().toISOString()
      });

      // Se o saque foi completado ou falhou, notificar o usuário
      if (status === 'completed' || status === 'failed') {
        await withdrawService.notifyUser(id, status);
      }

      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar saque ${id}:`, error);
      throw error;
    }
  },

  // Notificar usuário sobre o status do saque
  notifyUser: async (id, status) => {
    try {
      // Buscar informações do saque
      const withdraw = await axios.get(`/api/withdraws/${id}`);
      const { amount, user } = withdraw.data;

      // Preparar dados do e-mail
      const emailData = {
        to: user.email,
        subject: status === 'completed' ? 'Saque Realizado com Sucesso' : 'Falha no Saque',
        template: status === 'completed' ? 'withdraw-success' : 'withdraw-failed',
        data: {
          userName: user.name,
          withdrawId: id,
          amount: (amount / 100).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }),
          date: new Date().toLocaleDateString('pt-BR'),
          status: status === 'completed' ? 'processado com sucesso' : 'não processado',
          message: status === 'completed'
            ? 'O valor solicitado foi transferido para sua conta bancária.'
            : 'Houve um problema ao processar seu saque. Por favor, entre em contato com o suporte.'
        }
      };

      // Enviar e-mail
      await axios.post('/api/email/send', emailData);
    } catch (error) {
      console.error('Erro ao notificar usuário sobre saque:', error);
      // Não lançamos o erro para não interromper o fluxo principal
    }
  }
}; 