
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
  const formatDate = (date: Date) => {
    if (!date) return "Não informado";
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
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
          <Badge variant="outline" className="w-fit">
            {renderPropertyRegime() || "Comunhão Parcial de Bens"}
          </Badge>
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
