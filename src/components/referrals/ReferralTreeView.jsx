import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Users } from "lucide-react";

export default function ReferralTreeView({ referrals, userId }) {
  // Group referrals by level
  const level1Refs = referrals.filter(ref => ref.level === 1);
  const level2Refs = referrals.filter(ref => ref.level === 2);
  const level3Refs = referrals.filter(ref => ref.level === 3);
  
  return (
    <Card className="backdrop-blur-xl bg-white/70 border border-white/50 shadow-lg">
      <CardHeader>
        <CardTitle>Árvore de Indicações</CardTitle>
        <CardDescription>
          Visualize sua rede de indicações em níveis
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {referrals.length > 0 ? (
          <div className="relative py-10">
            {/* Root Node (Current User) */}
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
            </div>
            
            {/* Level Connectors */}
            <div className="absolute left-1/2 top-[90px] w-0.5 h-10 bg-gray-300 -translate-x-1/2"></div>
            
            {/* Level 1 */}
            <div className="mb-16">
              <h3 className="text-center font-medium text-gray-700 mb-6">
                Nível 1 - Indicações Diretas ({level1Refs.length})
              </h3>
              
              {level1Refs.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-4">
                  {level1Refs.map((ref, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <p className="mt-2 text-sm font-medium text-gray-800">
                        {ref.referred_name || "Usuário"}
                      </p>
                      {/* Only show status if not active */}
                      {ref.status !== 'active' && (
                        <p className="text-xs text-gray-500">
                          {ref.status === 'pending' ? 'Pendente' : 'Inativo'}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 bg-white/50 rounded-lg border border-gray-100">
                  <p className="text-gray-500">Nenhuma indicação direta ainda</p>
                </div>
              )}
            </div>
            
            {/* Level 2 */}
            {level1Refs.length > 0 && (
              <div className="mb-16">
                <h3 className="text-center font-medium text-gray-700 mb-6">
                  Nível 2 - Indicações Indiretas ({level2Refs.length})
                </h3>
                
                {level2Refs.length > 0 ? (
                  <div className="flex flex-wrap justify-center gap-4">
                    {level2Refs.map((ref, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-indigo-600" />
                        </div>
                        <p className="mt-2 text-sm font-medium text-gray-800">
                          {ref.referred_name || "Usuário"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 bg-white/50 rounded-lg border border-gray-100">
                    <p className="text-gray-500">Nenhuma indicação de segundo nível ainda</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Level 3 */}
            {level2Refs.length > 0 && (
              <div>
                <h3 className="text-center font-medium text-gray-700 mb-6">
                  Nível 3 - Expansão da Rede ({level3Refs.length})
                </h3>
                
                {level3Refs.length > 0 ? (
                  <div className="flex flex-wrap justify-center gap-3">
                    {level3Refs.length <= 10 ? (
                      level3Refs.map((ref, index) => (
                        <div key={index} className="flex flex-col items-center">
                          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                            <User className="w-4 h-4 text-purple-600" />
                          </div>
                          <p className="mt-1 text-xs font-medium text-gray-800">
                            {ref.referred_name || "Usuário"}
                          </p>
                        </div>
                      ))
                    ) : (
                      <>
                        {level3Refs.slice(0, 8).map((ref, index) => (
                          <div key={index} className="flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                              <User className="w-4 h-4 text-purple-600" />
                            </div>
                            <p className="mt-1 text-xs font-medium text-gray-800">
                              {ref.referred_name || "Usuário"}
                            </p>
                          </div>
                        ))}
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                            <Users className="w-4 h-4 text-purple-600" />
                          </div>
                          <p className="mt-1 text-xs font-medium text-gray-800">
                            +{level3Refs.length - 8} mais
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 bg-white/50 rounded-lg border border-gray-100">
                    <p className="text-gray-500">Nenhuma indicação de terceiro nível ainda</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 bg-white/50 rounded-lg border border-blue-50">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sua árvore está vazia</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Compartilhe seu link de indicação para começar a construir sua rede. Quanto mais pessoas você indicar, maior será sua rede e seus ganhos.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}