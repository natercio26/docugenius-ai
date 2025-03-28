
import React from 'react';
import { ProtocoloData } from "@/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import BasicDetailsSection from './BasicDetailsSection';
import PersonalDetailsSection from './PersonalDetailsSection';
import SpouseDetailsSection from './SpouseDetailsSection';
import TextContentSection from './TextContentSection';
import MarriedDetailsView from './MarriedDetailsView';
import SingleDetailsView from './SingleDetailsView';
import { FileCog, Download } from 'lucide-react';

interface ModalContentProps {
  protocolo: ProtocoloData;
  onClose: () => void;
}

const ModalContent: React.FC<ModalContentProps> = ({ 
  protocolo, 
  onClose 
}) => {
  const isCasado = protocolo.registrationData?.type === 'casado';
  
  return (
    <>
      <ScrollArea className="max-h-[70vh]">
        <div className="space-y-6 p-4">
          <BasicDetailsSection
            nome={protocolo.nome}
            cpf={protocolo.cpf}
            dataGeracao={protocolo.dataGeracao}
            numero={protocolo.numero}
          />
          
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
