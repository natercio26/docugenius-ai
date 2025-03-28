
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Check } from "lucide-react";

import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface FormData {
  nome: string;
  naturalidade: string;
  uf: string;
  dataNascimento: Date;
  filiacao: string;
  profissao: string;
  estadoCivil: string;
  rg: string;
  orgaoExpedidor: string;
  cpf: string;
  email: string;
  endereco: string;
  nacionalidade?: string;
  // Campos específicos para pessoa casada
  nomeConjuge?: string;
  naturalidadeConjuge?: string;
  ufConjuge?: string;
  dataNascimentoConjuge?: Date;
  filiacaoConjuge?: string;
  profissaoConjuge?: string;
  rgConjuge?: string;
  orgaoExpedidorConjuge?: string;
  cpfConjuge?: string;
  emailConjuge?: string;
  dataCasamento?: Date;
  regimeBens?: string;
}

const RevisaoDados: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Recuperar os dados do estado da navegação
  const formData = location.state?.formData as FormData;
  
  // Se não houver dados, redirecionar para o formulário
  React.useEffect(() => {
    if (!formData) {
      toast({
        title: "Dados não encontrados",
        description: "Por favor, preencha o formulário novamente.",
        variant: "destructive"
      });
      navigate('/cadastro/solteiro');
    }
  }, [formData, navigate, toast]);

  const handleConfirm = () => {
    // Navegar para a página de documento gerado com os dados do formulário
    navigate('/cadastro/documento', { state: { formData } });
    toast({
      title: "Documento gerado com sucesso",
      description: "Seus dados foram processados e o documento foi gerado."
    });
  };

  const handleBack = () => {
    navigate('/cadastro/solteiro', { state: { formData } });
  };

  const isCasado = formData?.estadoCivil === "Casado(a)";

  const formatDate = (date: Date) => {
    if (!date) return "Não informado";
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  if (!formData) return null;

  const renderPropertyRegime = () => {
    if (!formData.regimeBens) return null;
    
    const regimeMap: Record<string, string> = {
      "comunhao_parcial": "Comunhão Parcial de Bens",
      "comunhao_universal": "Comunhão Universal de Bens",
      "separacao_total": "Separação Total de Bens",
      "separacao_obrigatoria": "Separação Obrigatória de Bens",
      "participacao_final_aquestos": "Participação Final nos Aquestos",
    };
    
    return regimeMap[formData.regimeBens] || formData.regimeBens;
  };

  return (
    <>
      <Navbar />
      <div className="container py-8 max-w-4xl mx-auto">
        <Card className="shadow-md">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-2xl font-serif">Revisão de Dados</CardTitle>
            {isCasado && formData.dataCasamento && (
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2 mt-2">
                <Badge variant="outline" className="w-fit">
                  {renderPropertyRegime() || "Comunhão Parcial de Bens"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Data do casamento: {formatDate(formData.dataCasamento)}
                </span>
              </div>
            )}
          </CardHeader>
          <CardContent className="py-6">
            <div className="space-y-8">
              {isCasado ? (
                // Layout para dados do casal
                <div className="space-y-6">
                  <h3 className="text-lg font-medium mb-3 text-gray-700 border-b pb-2">Dados do Casal</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Dados do Titular */}
                    <div className="space-y-4 p-4 bg-slate-50 rounded-lg border">
                      <h4 className="font-medium border-b pb-2">Dados do Titular</h4>
                      
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500">Nome Completo</p>
                          <p className="font-medium">{formData.nome}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">Data de Nascimento</p>
                          <p className="font-medium">
                            {formatDate(formData.dataNascimento)}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">Naturalidade</p>
                          <p className="font-medium">{formData.naturalidade} - {formData.uf}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">Filiação</p>
                          <p className="font-medium">{formData.filiacao}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">Profissão</p>
                          <p className="font-medium">{formData.profissao}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">Estado Civil</p>
                          <p className="font-medium">{formData.estadoCivil}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">Documento de Identidade</p>
                          <p className="font-medium">{formData.rg} - {formData.orgaoExpedidor}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">CPF</p>
                          <p className="font-medium">{formData.cpf}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">E-mail</p>
                          <p className="font-medium">{formData.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Dados do Cônjuge */}
                    <div className="space-y-4 p-4 bg-slate-50 rounded-lg border">
                      <h4 className="font-medium border-b pb-2">Dados do Cônjuge</h4>
                      
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500">Nome Completo</p>
                          <p className="font-medium">{formData.nomeConjuge}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">Data de Nascimento</p>
                          <p className="font-medium">
                            {formatDate(formData.dataNascimentoConjuge)}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">Naturalidade</p>
                          <p className="font-medium">{formData.naturalidadeConjuge} - {formData.ufConjuge}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">Filiação</p>
                          <p className="font-medium">{formData.filiacaoConjuge}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">Profissão</p>
                          <p className="font-medium">{formData.profissaoConjuge}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">Documento de Identidade</p>
                          <p className="font-medium">{formData.rgConjuge} - {formData.orgaoExpedidorConjuge}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">CPF</p>
                          <p className="font-medium">{formData.cpfConjuge}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">E-mail</p>
                          <p className="font-medium">{formData.emailConjuge}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <p className="text-sm text-gray-500">Endereço</p>
                    <p className="font-medium">{formData.endereco}</p>
                  </div>
                </div>
              ) : (
                // Layout original para pessoa solteira
                <>
                  <div>
                    <h3 className="text-lg font-medium mb-3 text-gray-700 border-b pb-2">Informações Pessoais</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Nome Completo</p>
                        <p className="font-medium">{formData.nome}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Data de Nascimento</p>
                        <p className="font-medium">
                          {formatDate(formData.dataNascimento)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Naturalidade</p>
                        <p className="font-medium">{formData.naturalidade} - {formData.uf}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Filiação</p>
                        <p className="font-medium">{formData.filiacao}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Profissão</p>
                        <p className="font-medium">{formData.profissao}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Estado Civil</p>
                        <p className="font-medium">{formData.estadoCivil}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3 text-gray-700 border-b pb-2">Documentos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Documento de Identidade</p>
                        <p className="font-medium">{formData.rg}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Órgão Expedidor</p>
                        <p className="font-medium">{formData.orgaoExpedidor}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">CPF</p>
                        <p className="font-medium">{formData.cpf}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3 text-gray-700 border-b pb-2">Contato</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Endereço</p>
                        <p className="font-medium">{formData.endereco}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">E-mail</p>
                        <p className="font-medium">{formData.email}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t bg-slate-50 p-4">
            <Button 
              variant="outline" 
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar e Editar
            </Button>
            <Button 
              onClick={handleConfirm}
              className="gap-2"
            >
              Confirmar Dados
              <Check className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
};

export default RevisaoDados;
