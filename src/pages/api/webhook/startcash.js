import { startCashService } from '@/services/api';
import { orderService } from '@/services/orderService';
import { withdrawService } from '@/services/withdrawService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const signature = req.headers['x-signature'];
    
    // Validar a assinatura do webhook
    const isValid = startCashService.handleWebhook(req.body, signature);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const { type, data } = req.body;

    // Processar diferentes tipos de eventos
    switch (type) {
      case 'transaction':
        await handleTransactionWebhook(data);
        break;
      
      case 'transfer':
        await handleTransferWebhook(data);
        break;
      
      default:
        console.warn(`Unhandled webhook type: ${type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleTransactionWebhook(data) {
  const { status, externalRef } = data;

  switch (status) {
    case 'paid':
      // Atualizar o status do pedido para pago
      await orderService.updateOrderStatus(externalRef, 'paid');
      // Enviar e-mail de confirmação
      await orderService.sendPaymentConfirmationEmail(data);
      break;

    case 'refused':
      // Atualizar o status do pedido para recusado
      await orderService.updateOrderStatus(externalRef, 'refused');
      break;

    case 'refunded':
      // Atualizar o status do pedido para reembolsado
      await orderService.updateOrderStatus(externalRef, 'refunded');
      // Enviar e-mail de reembolso
      await orderService.sendRefundNotificationEmail(data);
      break;
  }
}

async function handleTransferWebhook(data) {
  const { status, id } = data;

  switch (status) {
    case 'completed':
      // Atualizar o status do saque para completado
      await withdrawService.updateWithdrawStatus(id, 'completed');
      break;

    case 'failed':
      // Atualizar o status do saque para falhou
      await withdrawService.updateWithdrawStatus(id, 'failed');
      break;
  }
}

// Funções auxiliares que devem ser implementadas de acordo com seu sistema
async function updateOrderStatus(externalRef, status) {
  // Implementar a atualização do status do pedido no seu sistema
  console.log(`Atualizando pedido ${externalRef} para ${status}`);
}

async function sendPaymentConfirmationEmail(data) {
  // Implementar o envio de e-mail de confirmação
  console.log(`Enviando e-mail de confirmação para pedido ${data.externalRef}`);
}

async function sendRefundNotificationEmail(data) {
  // Implementar o envio de e-mail de reembolso
  console.log(`Enviando e-mail de reembolso para pedido ${data.externalRef}`);
}

async function updateWithdrawStatus(id, status) {
  // Implementar a atualização do status do saque no seu sistema
  console.log(`Atualizando saque ${id} para ${status}`);
} 