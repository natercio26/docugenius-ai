
import React from 'react';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReviewField from './ReviewField';
import { FormData } from './types';

interface SinglePersonReviewProps {
  formData: FormData;
}

const SinglePersonReview: React.FC<SinglePersonReviewProps> = ({ formData }) => {
  const formatDate = (date: Date) => {
    if (!date) return "Não informado";
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
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
