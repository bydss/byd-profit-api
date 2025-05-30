import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ReferralLevels() {
  return (
    <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-lg">
      <CardHeader>
        <CardTitle>Níveis de Comissão</CardTitle>
        <CardDescription>
          Entenda como funciona nosso programa de indicação multinível
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 backdrop-blur-sm border border-indigo-100 rounded-lg p-5">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-700 font-semibold">1</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Nível 1 - Indicação Direta</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Receba <span className="font-semibold text-blue-700">17%</span> de comissão sobre os investimentos de pessoas que você indicou diretamente.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-indigo-700 font-semibold">2</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Nível 2 - Indicação Indireta</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Receba <span className="font-semibold text-indigo-700">2%</span> de comissão sobre os investimentos de pessoas indicadas pelos seus indicados diretos.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-purple-700 font-semibold">3</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Nível 3 - Expansão da Rede</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Receba <span className="font-semibold text-purple-700">1%</span> de comissão sobre os investimentos de pessoas no terceiro nível da sua rede.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white/50 border border-gray-100 rounded-lg p-5">
          <h4 className="font-medium text-gray-900 mb-3">Exemplo Prático</h4>
          <p className="text-sm text-gray-600 mb-4">
            Se um indicado direto seu investir R$ 1.000, você ganha R$ 170 de comissão (17%). Se esse indicado trouxer outra pessoa que invista R$ 1.000, você ganha mais R$ 20 (2%). E se essa pessoa indicar mais alguém que invista R$ 1.000, você ainda ganha R$ 10 (1%).
          </p>
          
          <div className="bg-gradient-to-r from-blue-50/30 to-indigo-50/30 backdrop-blur-sm rounded-md p-3 border border-blue-100/50">
            <p className="text-sm text-gray-700 font-medium text-center">
              Quanto mais pessoas na sua rede, maiores são seus ganhos passivos!
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}