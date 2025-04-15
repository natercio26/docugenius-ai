import React from 'react';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "lucide-react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FormData } from './types';

interface ReviewHeaderProps {
  formData: FormData;
  isCasado: boolean;
}

const ReviewHeader: React.FC<ReviewHeaderProps> = ({ formData, isCasado }) => {
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
    <CardHeader className="bg-slate-50 border-b">
      <CardTitle className="text-2xl font-serif">Revisão de Dados</CardTitle>
      {isCasado && (
        <div className="flex flex-col sm:flex-row sm:justify-between gap-2 mt-2">
          {formData.regimeBens && (
            <Badge variant="outline" className="w-fit">
              {renderPropertyRegime() || "Comunhão Parcial de Bens"}
            </Badge>
          )}
          {formData.dataCasamento && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Data do casamento: {formatDate(formData.dataCasamento)}</span>
            </div>
          )}
        </div>
      )}
    </CardHeader>
  );
};

export default ReviewHeader;
