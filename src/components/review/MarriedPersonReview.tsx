
import React from 'react';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Mail } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import ReviewField from './ReviewField';
import { FormData } from './types';

interface MarriedPersonReviewProps {
  formData: FormData;
}

const MarriedPersonReview: React.FC<MarriedPersonReviewProps> = ({ formData }) => {
  const formatDate = (date: Date) => {
    if (!date) return "Não informado";
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium mb-3 text-gray-700 border-b pb-2">Dados do Casal</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Dados do Titular */}
        <div className="space-y-4 p-4 bg-slate-50 rounded-lg border">
          <h4 className="font-medium border-b pb-2">Dados do Titular</h4>
          
          <div className="space-y-3">
            <ReviewField label="Nome Completo" value={formData.nome} />
            <ReviewField label="Data de Nascimento" value={formatDate(formData.dataNascimento)} />
            <ReviewField label="Naturalidade" value={`${formData.naturalidade} - ${formData.uf}`} />
            <ReviewField label="Filiação" value={formData.filiacao} />
            <ReviewField label="Profissão" value={formData.profissao} />
            <ReviewField label="Estado Civil" value={formData.estadoCivil} />
            <ReviewField label="Documento de Identidade" value={`${formData.rg} - ${formData.orgaoExpedidor}`} />
            <ReviewField label="CPF" value={formData.cpf} />
            <ReviewField 
              label="E-mail" 
              value={formData.email} 
              icon={<Mail className="h-4 w-4 text-muted-foreground" />} 
            />
          </div>
        </div>
        
        {/* Dados do Cônjuge */}
        <div className="space-y-4 p-4 bg-slate-50 rounded-lg border">
          <h4 className="font-medium border-b pb-2">Dados do Cônjuge</h4>
          
          <div className="space-y-3">
            <ReviewField label="Nome Completo" value={formData.nomeConjuge} />
            <ReviewField label="Data de Nascimento" value={formatDate(formData.dataNascimentoConjuge)} />
            <ReviewField label="Naturalidade" value={`${formData.naturalidadeConjuge} - ${formData.ufConjuge}`} />
            <ReviewField label="Filiação" value={formData.filiacaoConjuge} />
            <ReviewField label="Profissão" value={formData.profissaoConjuge} />
            <ReviewField label="Documento de Identidade" value={`${formData.rgConjuge} - ${formData.orgaoExpedidorConjuge}`} />
            <ReviewField label="CPF" value={formData.cpfConjuge} />
            <ReviewField 
              label="E-mail" 
              value={formData.emailConjuge} 
              icon={<Mail className="h-4 w-4 text-muted-foreground" />} 
            />
          </div>
        </div>
      </div>
      
      <Separator />
      
      <ReviewField label="Endereço" value={formData.endereco} />
    </div>
  );
};

export default MarriedPersonReview;
