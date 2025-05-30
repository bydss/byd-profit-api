import { PixPayment } from '@/components/PixPayment';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/router';

export default function CheckoutPage() {
  const { toast } = useToast();
  const router = useRouter();
  
  // Pegar valores da query string (você pode adaptar conforme sua necessidade)
  const amount = parseFloat(router.query.amount || '99.90');
  const description = router.query.description || 'Assinatura Premium';

  const handlePaymentSuccess = async (transactionData) => {
    try {
      // Aqui você pode implementar a lógica após o pagamento bem-sucedido
      // Por exemplo: atualizar status da assinatura, redirecionar para área do usuário, etc.
      
      toast({
        title: 'Pagamento realizado com sucesso!',
        description: 'Sua assinatura foi ativada.',
        variant: 'success'
      });

      // Redirecionar após 2 segundos
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Erro ao processar sucesso do pagamento:', error);
    }
  };

  const handlePaymentError = (error) => {
    toast({
      title: 'Erro no pagamento',
      description: error.message || 'Ocorreu um erro ao processar o pagamento. Tente novamente.',
      variant: 'destructive'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">
            Finalizar Compra
          </h1>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Resumo do Pedido</h2>
              <span className="text-2xl font-bold">
                R$ {amount.toFixed(2)}
              </span>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <PixPayment
                amount={amount}
                description={description}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </div>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>Pagamento processado com segurança pela StartCash</p>
          </div>
        </div>
      </div>
    </div>
  );
} 