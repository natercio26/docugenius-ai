
import React from 'react';

interface SpouseDetailsSectionProps {
  spouseInfo: {
    name: string;
    birthDate: string;
    cpf: string;
    rg: string;
    address?: string;
    profession?: string;
    civilStatus?: string;
    nationality?: string;
    naturality?: string;
    uf?: string;
    filiation?: string;
    issuer?: string;
  };
}

const SpouseDetailsSection: React.FC<SpouseDetailsSectionProps> = ({ 
  spouseInfo 
}) => {
  const formatCpf = (cpf: string): string => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };
  
  return (
    <div className="pt-4 mt-4 border-t">
      <h3 className="text-lg font-medium mb-4">Dados do Cônjuge</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Nome</p>
          <p className="font-medium">{spouseInfo.name}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">CPF</p>
          <p className="font-medium">{formatCpf(spouseInfo.cpf)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">RG</p>
          <p className="font-medium">{spouseInfo.rg}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Órgão Expedidor</p>
          <p className="font-medium">{spouseInfo.issuer || 'Não informado'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Data de Nascimento</p>
          <p className="font-medium">{spouseInfo.birthDate}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Nacionalidade</p>
          <p className="font-medium">{spouseInfo.nationality || 'Brasileiro(a)'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Naturalidade</p>
          <p className="font-medium">
            {spouseInfo.naturality}, 
            {spouseInfo.uf}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Profissão</p>
          <p className="font-medium">{spouseInfo.profession}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Filiação</p>
          <p className="font-medium">{spouseInfo.filiation || 'Não informado'}</p>
        </div>
        <div className="col-span-2">
          <p className="text-sm text-muted-foreground">Endereço</p>
          <p className="font-medium">{spouseInfo.address || 'Mesmo endereço'}</p>
        </div>
      </div>
    </div>
  );
};

export default SpouseDetailsSection;
