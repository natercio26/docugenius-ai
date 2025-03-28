
import React from 'react';
import { Badge } from "@/components/ui/badge";

interface BasicDetailsSectionProps {
  nome: string;
  cpf: string;
  dataGeracao: Date;
  numero: string;
}

const BasicDetailsSection: React.FC<BasicDetailsSectionProps> = ({ 
  nome, 
  cpf, 
  dataGeracao, 
  numero 
}) => {
  const formatCpf = (cpf: string): string => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Dados Pessoais</h3>
        <Badge variant="outline" className="font-mono">
          {numero}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Nome</p>
          <p className="font-medium">{nome}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">CPF</p>
          <p className="font-medium">{formatCpf(cpf)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Data de Cadastro</p>
          <p className="font-medium">{formatDate(dataGeracao)}</p>
        </div>
      </div>
    </div>
  );
};

export default BasicDetailsSection;
