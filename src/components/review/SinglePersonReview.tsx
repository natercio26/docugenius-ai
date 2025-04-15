
import React from 'react';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReviewField from './ReviewField';
import { FormData } from './types';

interface SinglePersonReviewProps {
  formData: FormData;
}

const SinglePersonReview: React.FC<SinglePersonReviewProps> = ({ formData }) => {
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

  return (
    <>
      <div>
        <h3 className="text-lg font-medium mb-3 text-gray-700 border-b pb-2">Informações Pessoais</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ReviewField label="Nome Completo" value={formData.nome} />
          <ReviewField label="Data de Nascimento" value={formatDate(formData.dataNascimento)} />
          <ReviewField label="Naturalidade" value={`${formData.naturalidade} - ${formData.uf}`} />
          <ReviewField label="Filiação" value={formData.filiacao} />
          <ReviewField label="Profissão" value={formData.profissao} />
          <ReviewField label="Estado Civil" value={formData.estadoCivil} />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-3 text-gray-700 border-b pb-2">Documentos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ReviewField label="Documento de Identidade" value={formData.rg} />
          <ReviewField label="Órgão Expedidor" value={formData.orgaoExpedidor} />
          <ReviewField label="CPF" value={formData.cpf} />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-3 text-gray-700 border-b pb-2">Contato</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ReviewField label="Endereço" value={formData.endereco} />
          <ReviewField label="E-mail" value={formData.email} />
        </div>
      </div>
    </>
  );
};

export default SinglePersonReview;
