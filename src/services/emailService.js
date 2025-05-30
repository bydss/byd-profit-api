import sgMail from '@sendgrid/mail';

// Configurar API key do SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const emailService = {
  async sendEmail(to, subject, templateId, dynamicData) {
    try {
      const msg = {
        to,
        from: process.env.EMAIL_FROM,
        subject,
        templateId,
        dynamic_template_data: dynamicData
      };

      await sgMail.send(msg);
      return true;
    } catch (error) {
      console.error('Erro ao enviar e-mail:', error);
      return false;
    }
  },

  // Templates pré-definidos
  templates: {
    PAYMENT_CONFIRMATION: 'd-template-id-confirmacao', // Substitua pelo ID do seu template
    PAYMENT_FAILED: 'd-template-id-falha',
    WITHDRAW_SUCCESS: 'd-template-id-saque-sucesso',
    WITHDRAW_FAILED: 'd-template-id-saque-falha',
    REFUND_NOTIFICATION: 'd-template-id-reembolso'
  }
}; 