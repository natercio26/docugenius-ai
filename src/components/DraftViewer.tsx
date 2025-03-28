
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
import { toast } from 'sonner';

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
  
  // Log draft data when component mounts
  useEffect(() => {
    console.log("DraftViewer: Draft content contains qualificacao placeholder:", 
      draft.content.includes("¿qualificacao_do(a)(s)_herdeiro(a)(s)>"));
  }, [draft.content]);
  
  // Process extracted data into local data
  useEffect(() => {
    console.log("DraftViewer: Inicializando com protocolo:", draft.protocoloInfo);
    
    // Clear previous local data
    setLocalData({});
    
    // Primeiro, verificar diretamente no protocolo se existir
    if (draft.protocoloInfo?.numero) {
      console.log("DraftViewer: Verificando protocolo número:", draft.protocoloInfo.numero);
      const protocolo = getProtocoloByNumero(draft.protocoloInfo.numero);
      
      if (protocolo) {
        console.log("DraftViewer: Protocolo encontrado:", protocolo.numero);
        toast.success(`Protocolo ${protocolo.numero} carregado com sucesso`);
        
        // Verificar se o protocolo tem texto de qualificação
        if (protocolo.textoQualificacao) {
          console.log("DraftViewer: Texto de qualificação encontrado no protocolo:", protocolo.textoQualificacao);
          
          // Criar dados locais com a qualificação
          const protocoloData = {
            qualificacaoCompleta: protocolo.textoQualificacao,
            // Garantir que o placeholder específico também seja substituído diretamente
            'qualificacao_do(a)(s)_herdeiro(a)(s)': protocolo.textoQualificacao
          };
          
          setLocalData(protocoloData);
          return;
        }
        
        // Se não tem texto pronto, mas tem dados de registro, tentar gerar
        if (draft.protocoloInfo) {
          const qualificacao = generateHeirQualification(draft.protocoloInfo);
          if (qualificacao) {
            console.log("DraftViewer: Qualificação gerada a partir do protocolo:", qualificacao);
            
            const initialData = { 
              qualificacaoCompleta: qualificacao,
              'qualificacao_do(a)(s)_herdeiro(a)(s)': qualificacao 
            };
            setLocalData(initialData);
            return;
          }
        }
      } else {
        console.log("DraftViewer: Protocolo não encontrado:", draft.protocoloInfo.numero);
        toast.error(`Protocolo ${draft.protocoloInfo.numero} não encontrado`);
      }
    }
    
    // Verificar qualificação no sessionStorage se não encontrou no protocolo
    const qualificacaoTexto = sessionStorage.getItem('documentoGeradoTexto');
    if (qualificacaoTexto) {
      console.log("DraftViewer: Qualificação encontrada no sessionStorage:", qualificacaoTexto);
      const storageData = { 
        qualificacaoCompleta: qualificacaoTexto,
        'qualificacao_do(a)(s)_herdeiro(a)(s)': qualificacaoTexto 
      };
      setLocalData(storageData);
      return;
    }
    
    // Se chegou aqui e temos dados extraídos, processar normalmente
    if (extractedData) {
      const cleanedData = processLocalData(extractedData, draft);
      console.log("DraftViewer: Definindo dados locais processados:", cleanedData);
      setLocalData(cleanedData);
    } else {
      console.log("DraftViewer: Sem dados extraídos disponíveis");
      setLocalData({});
    }
  }, [draft.protocoloInfo, extractedData, draft]);

  // Process content with placeholders
  useEffect(() => {
    if (draft.content) {
      // Obter todas as possíveis fontes de dados
      const mergedData = { ...localData };
      
      console.log("DraftViewer: Dados finais para substituição:", mergedData);
      console.log("DraftViewer: Qualificação no mergedData:", mergedData['qualificacao_do(a)(s)_herdeiro(a)(s)']);
      
      const processedText = replacePlaceholders(draft.content, mergedData, draft, extractedData);
      console.log("DraftViewer: Content after replacement (preview):", 
        processedText.substring(0, 100) + "..." + 
        (processedText.includes("¿qualificacao_do(a)(s)_herdeiro(a)(s)>") ? 
          " (placeholder still present!)" : " (placeholder replaced)"));
      
      setProcessedContent(processedText);
    } else {
      setProcessedContent('');
    }
  }, [draft.content, draft.protocoloInfo, localData, extractedData, draft]);

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
