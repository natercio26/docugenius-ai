import React from 'react';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Mail, Calendar } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import ReviewField from './ReviewField';
import { FormData } from './types';

interface MarriedPersonReviewProps {
  formData: FormData;
}

const MarriedPersonReview: React.FC<MarriedPersonReviewProps> = ({ formData }) => {
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "Não informado";
    
    try {
      // Se a data for uma string no formato DD/MM/YYYY, converte para Date
      if (typeof date === 'string') {
        if (date === '00/00/0000') return "Não informado";
        
        const parts = date.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // Mês em JS começa em 0
          const year = parseInt(parts[2], 10);
          
          if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            date = new Date(year, month, day);
          }
        }
      }
      
      // Verifica se a data é válida antes de formatar
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return "Data inválida";
      }
      
      return format(dateObj, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch (error) {
      console.error("Erro ao formatar data:", error, date);
      return "Data inválida";
    }
  };

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
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ReviewField label="Endereço" value={formData.endereco} />
          
          {formData.dataCasamento && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-gray-500">Data do Casamento</p>
                <p className="font-medium">{formatDate(formData.dataCasamento)}</p>
              </div>
            </div>
          )}
        </div>
        
        {formData.regimeBens && (
          <div>
            <p className="text-sm text-gray-500">Regime de Bens</p>
            <Badge variant="outline" className="mt-1">
              {renderPropertyRegime()}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarriedPersonReview;
