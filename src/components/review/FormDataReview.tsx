
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Check } from "lucide-react";

import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import ReviewHeader from './ReviewHeader';
import MarriedPersonReview from './MarriedPersonReview';
import SinglePersonReview from './SinglePersonReview';
import { FormData } from './types';

const FormDataReview: React.FC = () => {
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

  if (!formData) return null;

  return (
    <>
      <Navbar />
      <div className="container py-8 max-w-4xl mx-auto">
        <Card className="shadow-md">
          <ReviewHeader 
            formData={formData}
            isCasado={isCasado}
          />
          <CardContent className="py-6">
            <div className="space-y-8">
              {isCasado ? (
                <MarriedPersonReview formData={formData} />
              ) : (
                <SinglePersonReview formData={formData} />
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

export default FormDataReview;
