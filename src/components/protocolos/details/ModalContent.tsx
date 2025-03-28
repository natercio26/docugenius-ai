
import React from 'react';
import { ProtocoloData } from "@/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import BasicDetailsSection from './BasicDetailsSection';
import TextContentSection from './TextContentSection';
import MarriedDetailsView from './MarriedDetailsView';
import SingleDetailsView from './SingleDetailsView';
import { FileCog, Download, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ModalContentProps {
  protocolo: ProtocoloData;
  onClose: () => void;
}

const ModalContent: React.FC<ModalContentProps> = ({ 
  protocolo, 
  onClose 
}) => {
  const isCasado = protocolo.registrationData?.type === 'casado';
  
  const formatDateTime = (date: Date): string => {
    return format(date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  };
  
  return (
    <>
      <ScrollArea className="max-h-[70vh]">
        <div className="space-y-6 p-4">
          <div className="flex items-center justify-between">
            <BasicDetailsSection
              nome={protocolo.nome}
              cpf={protocolo.cpf}
              dataGeracao={protocolo.dataGeracao}
              numero={protocolo.numero}
            />
            <div className="hidden md:flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-1" />
              <span>Gerado em: {formatDateTime(protocolo.dataGeracao)}</span>
            </div>
          </div>
          
          {protocolo.registrationData && (
            isCasado ? (
              <MarriedDetailsView registrationData={protocolo.registrationData} />
            ) : (
              <SingleDetailsView registrationData={protocolo.registrationData} />
            )
          )}

          {protocolo.textoQualificacao && (
            <TextContentSection
              title="Texto de Qualificação"
              content={protocolo.textoQualificacao}
            />
          )}

          {protocolo.conteudo && (
            <TextContentSection
              title="Conteúdo Completo"
              content={protocolo.conteudo}
            />
          )}
        </div>
      </ScrollArea>
      
      <div className="flex justify-end gap-2 mt-4">
        <Button 
          variant="outline" 
          onClick={onClose}
        >
          Fechar
        </Button>
      </div>
    </>
  );
};

export default ModalContent;
