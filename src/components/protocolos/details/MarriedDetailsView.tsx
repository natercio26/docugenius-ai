
import React from 'react';
import { RegistrationData } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface MarriedDetailsViewProps {
  registrationData: RegistrationData;
}

const MarriedDetailsView: React.FC<MarriedDetailsViewProps> = ({ 
  registrationData 
}) => {
  const { personalInfo, spouseInfo } = registrationData;

  if (!spouseInfo) {
    return null;
  }
  
  const formatCpf = (cpf: string): string => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return "Não informado";
    try {
      const date = new Date(dateString);
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="space-y-6 pt-4 border-t">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Qualificação do Casal</h3>
        {spouseInfo.marriageDate && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Casados desde: {formatDate(spouseInfo.marriageDate)}
            </span>
          </div>
        )}
      </div>
      
      <Badge variant="outline" className="mb-4">
        {spouseInfo.propertyRegime || "Comunhão Parcial de Bens"}
      </Badge>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Dados do Titular */}
        <div className="space-y-4 p-4 bg-slate-50 rounded-lg border">
          <h4 className="font-medium">Dados do Titular</h4>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Nome Completo</p>
              <p className="font-medium">{personalInfo.name}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-muted-foreground">CPF</p>
                <p className="font-medium">{formatCpf(personalInfo.cpf)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">RG</p>
                <p className="font-medium">{personalInfo.rg} - {personalInfo.issuer}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Data de Nascimento</p>
              <p className="font-medium">{formatDate(personalInfo.birthDate)}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Naturalidade</p>
              <p className="font-medium">
                {personalInfo.naturality}, {personalInfo.uf}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Filiação</p>
              <p className="font-medium">{personalInfo.filiation || "Não informado"}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Profissão</p>
              <p className="font-medium">{personalInfo.profession}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">E-mail</p>
              <p className="font-medium">{personalInfo.email}</p>
            </div>
          </div>
        </div>
        
        {/* Dados do Cônjuge */}
        <div className="space-y-4 p-4 bg-slate-50 rounded-lg border">
          <h4 className="font-medium">Dados do Cônjuge</h4>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Nome Completo</p>
              <p className="font-medium">{spouseInfo.name}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-muted-foreground">CPF</p>
                <p className="font-medium">{formatCpf(spouseInfo.cpf)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">RG</p>
                <p className="font-medium">{spouseInfo.rg} - {spouseInfo.issuer}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Data de Nascimento</p>
              <p className="font-medium">{formatDate(spouseInfo.birthDate)}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Naturalidade</p>
              <p className="font-medium">
                {spouseInfo.naturality}, {spouseInfo.uf}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Filiação</p>
              <p className="font-medium">{spouseInfo.filiation || "Não informado"}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Profissão</p>
              <p className="font-medium">{spouseInfo.profession || "Não informado"}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">E-mail</p>
              <p className="font-medium">{spouseInfo.email || "Não informado"}</p>
            </div>
          </div>
        </div>
      </div>
      
      <Separator />
      
      <div>
        <p className="text-sm text-muted-foreground">Endereço</p>
        <p className="font-medium">{personalInfo.address}</p>
      </div>
    </div>
  );
};

export default MarriedDetailsView;
