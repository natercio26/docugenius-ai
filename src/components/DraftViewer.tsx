
import React, { useState, useEffect, useRef } from 'react';
import { Draft } from '@/types';
import { useLocation } from 'react-router-dom';
import DraftContent from './DraftContent';
import { 
  processLocalData, 
  replacePlaceholders 
} from '@/utils/placeholderReplacer';

interface DraftViewerProps {
  draft: Draft;
  extractedData?: Record<string, string>;
}

const DraftViewer: React.FC<DraftViewerProps> = ({ draft, extractedData }) => {
  const [processedContent, setProcessedContent] = useState(draft.content);
  const [localData, setLocalData] = useState<Record<string, string>>({});
  const location = useLocation();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isNewDraft = location.pathname.includes('/view/new');
  
  useEffect(() => {
    const preventScroll = (e: Event) => {
      if (!e.isTrusted) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('scroll', preventScroll, { passive: false });
    
    return () => {
      document.removeEventListener('scroll', preventScroll);
    };
  }, []);
  
  // Process extracted data into local data
  useEffect(() => {
    // Verificar qualificação diretamente do sessionStorage
    const qualificacaoTexto = sessionStorage.getItem('documentoGeradoTexto');
    if (qualificacaoTexto) {
      console.log("DraftViewer: Qualificação encontrada no sessionStorage:", qualificacaoTexto);
    }
    
    if (isNewDraft && !draft.protocoloInfo) {
      // Para novos rascunhos sem protocolo, usar dados do sessionStorage
      const initialData = qualificacaoTexto ? { qualificacaoCompleta: qualificacaoTexto } : {};
      setLocalData(initialData);
    } else if (extractedData) {
      // Para rascunhos com dados extraídos, processar normalmente
      const cleanedData = processLocalData(extractedData, draft);
      
      // Adicionar explicitamente a qualificação se disponível no sessionStorage
      if (qualificacaoTexto) {
        cleanedData.qualificacaoCompleta = qualificacaoTexto;
      }
      
      setLocalData(cleanedData);
    }
  }, [extractedData, draft.protocoloInfo, isNewDraft, draft]);

  // Process content with placeholders
  useEffect(() => {
    if (draft.content) {
      // Verificar qualificação no sessionStorage novamente antes de processar
      const qualificacaoTexto = sessionStorage.getItem('documentoGeradoTexto');
      if (qualificacaoTexto) {
        console.log("DraftViewer (processing): Usando qualificação do sessionStorage:", qualificacaoTexto);
        // Garantir que a qualificação esteja disponível nos dados locais
        if (!localData.qualificacaoCompleta) {
          setLocalData(prevData => ({
            ...prevData,
            qualificacaoCompleta: qualificacaoTexto
          }));
        }
      }
      
      const mergedData = {
        ...localData,
        ...(extractedData || {}),
        // Garantir que a qualificacaoCompleta tenha prioridade se existir
        ...(qualificacaoTexto ? { qualificacaoCompleta: qualificacaoTexto } : {})
      };
      
      const processedText = replacePlaceholders(draft.content, mergedData, draft, extractedData);
      setProcessedContent(processedText);
    } else {
      setProcessedContent('');
    }
  }, [draft.content, draft.protocoloInfo, localData, isNewDraft, extractedData, draft]);

  return (
    <div className="bg-white border rounded-md shadow-sm overflow-hidden">
      <DraftContent 
        content={processedContent} 
        scrollAreaRef={scrollAreaRef} 
      />
    </div>
  );
};

export default DraftViewer;
