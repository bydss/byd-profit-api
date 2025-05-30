import React, { useState, useEffect } from 'react';
import { startCashService } from '@/services/api';
import QRCode from 'qrcode.react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

export function PixPayment({ amount, description, onSuccess, onError }) {
  const [qrCodeData, setQrCodeData] = useState('');
  const [expirationDate, setExpirationDate] = useState(null);
  const [transactionId, setTransactionId] = useState(null);
  const [status, setStatus] = useState('initial');
  const [customerData, setCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
    address: {
      street: '',
      streetNumber: '',
      complement: '',
      zipCode: '',
      neighborhood: '',
      city: '',
      state: '',
      country: 'BR'
    }
  });

  const { toast } = useToast();

  // Função para criar o pagamento
  const createPayment = async () => {
    try {
      setStatus('loading');
      const paymentData = {
        amount: Math.round(amount * 100), // Convertendo para centavos
        description,
        customer: customerData,
        externalRef: `order-${Date.now()}`,
        postbackUrl: `${window.location.origin}/api/webhook/startcash`
      };

      const response = await startCashService.createPixPayment(paymentData);
      
      if (response.data?.pix?.qrcode) {
        setQrCodeData(response.data.pix.qrcode);
        setExpirationDate(new Date(response.data.pix.expirationDate));
        setTransactionId(response.data.id);
        setStatus('created');
        startPolling(response.data.id);
      } else {
        throw new Error('QR Code não gerado');
      }
    } catch (error) {
      setStatus('error');
      toast({
        title: "Erro ao gerar pagamento",
        description: error.message,
        variant: "destructive"
      });
      onError?.(error);
    }
  };

  // Polling para verificar status do pagamento
  const startPolling = (id) => {
    const interval = setInterval(async () => {
      try {
        const transaction = await startCashService.getTransaction(id);
        if (transaction.data.status === 'paid') {
          clearInterval(interval);
          setStatus('paid');
          onSuccess?.(transaction.data);
          toast({
            title: "Pagamento confirmado!",
            description: "O pagamento foi processado com sucesso.",
            variant: "success"
          });
        } else if (transaction.data.status === 'refused' || transaction.data.status === 'cancelled') {
          clearInterval(interval);
          setStatus('failed');
          toast({
            title: "Pagamento não realizado",
            description: "O pagamento foi recusado ou cancelado.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
      }
    }, 5000); // Verifica a cada 5 segundos

    // Limpa o intervalo após 1 hora
    setTimeout(() => clearInterval(interval), 3600000);
  };

  // Handler para atualização dos dados do cliente
  const handleCustomerDataChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setCustomerData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setCustomerData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Pagamento via PIX</h2>
          <p className="text-gray-500">Valor: R$ {amount.toFixed(2)}</p>
          {description && <p className="text-sm text-gray-400">{description}</p>}
        </div>

        {status === 'initial' && (
          <div className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  value={customerData.name}
                  onChange={(e) => handleCustomerDataChange('name', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={customerData.email}
                  onChange={(e) => handleCustomerDataChange('email', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="document">CPF</Label>
                <Input
                  id="document"
                  value={customerData.document}
                  onChange={(e) => handleCustomerDataChange('document', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={customerData.phone}
                  onChange={(e) => handleCustomerDataChange('phone', e.target.value)}
                  required
                />
              </div>
            </div>

            <Button
              className="w-full"
              onClick={createPayment}
              disabled={!customerData.name || !customerData.email || !customerData.document}
            >
              Gerar QR Code PIX
            </Button>
          </div>
        )}

        {status === 'loading' && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2">Gerando pagamento...</p>
          </div>
        )}

        {status === 'created' && qrCodeData && (
          <div className="text-center space-y-4">
            <div className="bg-white p-4 rounded-lg inline-block">
              <QRCode value={qrCodeData} size={200} />
            </div>
            
            <div>
              <p className="text-sm text-gray-500">
                Escaneie o QR Code com seu aplicativo de banco
              </p>
              {expirationDate && (
                <p className="text-xs text-gray-400">
                  Válido até {format(expirationDate, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </p>
              )}
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigator.clipboard.writeText(qrCodeData)}
            >
              Copiar código PIX
            </Button>
          </div>
        )}

        {status === 'paid' && (
          <div className="text-center text-green-600 space-y-2">
            <svg
              className="w-16 h-16 mx-auto text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <h3 className="text-xl font-semibold">Pagamento confirmado!</h3>
            <p className="text-sm text-gray-500">
              Obrigado pela sua compra
            </p>
          </div>
        )}

        {status === 'failed' && (
          <div className="text-center text-red-600 space-y-2">
            <svg
              className="w-16 h-16 mx-auto text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            <h3 className="text-xl font-semibold">Pagamento não realizado</h3>
            <p className="text-sm text-gray-500">
              Por favor, tente novamente
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setStatus('initial')}
            >
              Tentar novamente
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
} 