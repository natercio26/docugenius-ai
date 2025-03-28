
import React, { useState, useEffect, useRef } from 'react';
import { Draft } from '@/types';
import { useLocation } from 'react-router-dom';
import DraftContent from './DraftContent';
import { 
  processLocalData, 
  replacePlaceholders,
  generateHeirQualification
} from '@/utils/placeholderReplacer';
import { getProtocoloByNumero } from '@/utils/protocoloStorage';

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
  
  // Prevent scrolling
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
    // Verificar qualificação no sessionStorage
    const qualificacaoTexto = sessionStorage.getItem('documentoGeradoTexto');
    if (qualificacaoTexto) {
      console.log("DraftViewer: Qualificação encontrada no sessionStorage:", qualificacaoTexto);
    }
    
    // Verificar se existe protocolo
    if (draft.protocoloInfo?.numero) {
      console.log("DraftViewer: Protocolo encontrado:", draft.protocoloInfo.numero);
      const protocolo = getProtocoloByNumero(draft.protocoloInfo.numero);
      if (protocolo) {
        console.log("DraftViewer: Dados do protocolo carregados com sucesso");
        
        // Se temos o protocolo, podemos usar os dados dele para gerar a qualificação
        const qualificacao = generateHeirQualification(draft.protocoloInfo);
        if (qualificacao) {
          console.log("DraftViewer: Qualificação gerada a partir do protocolo:", qualificacao);
          const initialData = { qualificacaoCompleta: qualificacao };
          setLocalData(initialData);
          return;
        }
      }
    }
    
    if (isNewDraft) {
      // Para novos rascunhos, usar dados do sessionStorage
      const initialData = qualificacaoTexto ? { qualificacaoCompleta: qualificacaoTexto } : {};
      console.log("DraftViewer: Definindo dados locais do sessionStorage:", initialData);
      setLocalData(initialData);
    } else if (extractedData) {
      // Para rascunhos com dados extraídos, processar normalmente
      const cleanedData = processLocalData(extractedData, draft);
      
      // Adicionar explicitamente a qualificação se disponível no sessionStorage
      if (qualificacaoTexto) {
        cleanedData.qualificacaoCompleta = qualificacaoTexto;
      }
      
      console.log("DraftViewer: Definindo dados locais processados:", cleanedData);
      setLocalData(cleanedData);
    }
  }, [extractedData, draft.protocoloInfo, isNewDraft, draft]);

  // Process content with placeholders
  useEffect(() => {
    if (draft.content) {
      // Garantir que temos a qualificação antes de processar
      const qualificacaoTexto = sessionStorage.getItem('documentoGeradoTexto');
      
      // Verificar em todas as fontes possíveis de dados
      const mergedData = {
        ...localData,
        ...(extractedData || {}),
        ...(qualificacaoTexto ? { qualificacaoCompleta: qualificacaoTexto } : {})
      };
      
      console.log("DraftViewer: Dados finais para substituição:", mergedData);
      console.log("DraftViewer: Dados do protocolo na minuta:", draft.protocoloInfo);
      
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
