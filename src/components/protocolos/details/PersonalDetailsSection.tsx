
import React from 'react';
import { RegistrationData } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PersonalDetailsSectionProps {
  registrationData: RegistrationData;
}

const PersonalDetailsSection: React.FC<PersonalDetailsSectionProps> = ({ 
  registrationData 
}) => {
  return (
    <div className="pt-4 border-t">
      <h3 className="text-lg font-medium mb-4">Informações Detalhadas</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">RG</p>
          <p className="font-medium">{registrationData.personalInfo.rg}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Órgão Expedidor</p>
          <p className="font-medium">{registrationData.personalInfo.issuer || 'Não informado'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Data de Nascimento</p>
          <p className="font-medium">{registrationData.personalInfo.birthDate}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Nacionalidade</p>
          <p className="font-medium">{registrationData.personalInfo.nationality || 'Brasileiro(a)'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Naturalidade</p>
          <p className="font-medium">
            {registrationData.personalInfo.naturality}, 
            {registrationData.personalInfo.uf}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Profissão</p>
          <p className="font-medium">{registrationData.personalInfo.profession}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Estado Civil</p>
          <p className="font-medium">{registrationData.personalInfo.civilStatus}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Filiação</p>
          <p className="font-medium">{registrationData.personalInfo.filiation}</p>
        </div>
        <div className="col-span-2">
          <p className="text-sm text-muted-foreground">Endereço</p>
          <p className="font-medium">{registrationData.personalInfo.address}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">E-mail</p>
          <p className="font-medium">{registrationData.personalInfo.email}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Telefone</p>
          <p className="font-medium">{registrationData.personalInfo.phone || 'Não informado'}</p>
        </div>
      </div>
    </div>
  );
};

export default PersonalDetailsSection;
