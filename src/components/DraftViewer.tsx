
import React, { useState, useEffect, useRef } from 'react';
import { Draft } from '@/types';
import { useLocation } from 'react-router-dom';
import DraftContent from './DraftContent';
import { 
  processLocalData, 
  replacePlaceholders
} from '@/utils/placeholderReplacer';
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
    console.log("DraftViewer: Component mounted");
    
    if (draft.content?.includes("¿qualificacao_do(a)(s)_herdeiro(a)(s)>")) {
      console.log("DraftViewer: Draft content contains qualification placeholder");
    }
    
    if (draft.extractedData) {
      console.log("DraftViewer: Draft contains extracted data with keys:", 
        Object.keys(draft.extractedData));
      
      // Detailed logging of qualification data if available
      if (draft.extractedData.qualificacaoCompleta) {
        console.log("DraftViewer: Draft contains complete qualification data:", 
          draft.extractedData.qualificacaoCompleta.substring(0, 100) + "...");
      } else if (draft.extractedData.qualificacaoFalecido || 
                draft.extractedData.qualificacaoConjuge || 
                draft.extractedData.qualificacaoHerdeiro1) {
        console.log("DraftViewer: Draft contains individual qualification data for:",
          [
            draft.extractedData.qualificacaoFalecido ? "falecido" : "",
            draft.extractedData.qualificacaoConjuge ? "conjuge" : "",
            draft.extractedData.qualificacaoHerdeiro1 ? "herdeiro1" : ""
          ].filter(Boolean).join(", "));
      } else {
        console.log("DraftViewer: Draft does NOT contain qualification data");
      }
    } else {
      console.log("DraftViewer: Draft does NOT contain extracted data");
    }
    
    if (extractedData) {
      console.log("DraftViewer: Props contains extracted data with keys:", 
        Object.keys(extractedData));
    } else {
      console.log("DraftViewer: Props does NOT contain extracted data");
    }
    
    // Try to get qualification data from sessionStorage
    try {
      const qualificacaoTexto = sessionStorage.getItem('documentoGeradoTexto');
      if (qualificacaoTexto) {
        console.log("DraftViewer: Found qualification text in sessionStorage");
        
        // CRITICAL: This was missing type safety
        setLocalData(prevData => ({
          ...prevData,
          qualificacaoCompleta: qualificacaoTexto,
          'qualificacao_do(a)(s)_herdeiro(a)(s)': qualificacaoTexto
        }));
        
        // Also update draft data if possible
        if (draft.extractedData) {
          draft.extractedData.qualificacaoCompleta = qualificacaoTexto;
          draft.extractedData['qualificacao_do(a)(s)_herdeiro(a)(s)'] = qualificacaoTexto;
        }
      }
    } catch (e) {
      console.warn("Could not access sessionStorage for qualification data", e);
    }
  }, [draft, extractedData]);
  
  // Process extracted data into local data
  useEffect(() => {
    console.log("DraftViewer: Processing data for replacement");
    
    // Clear previous local data - but initialize with empty object to prevent type errors
    setLocalData({});
    
    // First, try to use extracted data directly from the draft
    if (draft.extractedData && Object.keys(draft.extractedData).length > 0) {
      console.log("DraftViewer: Using data extracted from draft:", draft.extractedData);
      
      const processedData = processLocalData(draft.extractedData, draft);
      setLocalData(processedData);
      
      // Check if qualification data is available
      if (draft.extractedData.qualificacaoCompleta) {
        console.log("DraftViewer: Using complete qualification data from draft");
      } else if (draft.extractedData.qualificacaoFalecido || 
                draft.extractedData.qualificacaoConjuge ||
                draft.extractedData.qualificacaoHerdeiro1) {
        console.log("DraftViewer: Using individual qualification data from draft");
      } else {
        console.warn("DraftViewer: No qualification data found in extracted data");
      }
    }
    // Otherwise, try to use extracted data from props
    else if (extractedData && Object.keys(extractedData).length > 0) {
      console.log("DraftViewer: Using extracted data from props:", extractedData);
      
      const processedData = processLocalData(extractedData, draft);
      setLocalData(processedData);
      
      // Check if qualification data is available
      if ('qualificacaoCompleta' in extractedData) {
        console.log("DraftViewer: Using complete qualification data from props");
      } else if ('qualificacaoFalecido' in extractedData || 
                'qualificacaoConjuge' in extractedData ||
                'qualificacaoHerdeiro1' in extractedData) {
        console.log("DraftViewer: Using individual qualification data from props");
      } else {
        console.warn("DraftViewer: No qualification data found in props data");
      }
    }
    else {
      console.warn("DraftViewer: No extracted data available from any source");
      toast.warning("Não há dados extraídos disponíveis para preencher o documento");
      
      // Provide minimal fallback data
      setLocalData({
        dataLavratura: new Date().toLocaleDateString('pt-BR')
      });
    }
    
    // Try to get qualification data from sessionStorage
    try {
      const qualificacaoTexto = sessionStorage.getItem('documentoGeradoTexto');
      if (qualificacaoTexto) {
        console.log("DraftViewer: Adding qualification text from sessionStorage");
        setLocalData(prevData => ({
          ...prevData,
          qualificacaoCompleta: qualificacaoTexto,
          'qualificacao_do(a)(s)_herdeiro(a)(s)': qualificacaoTexto
        }));
      }
    } catch (e) {
      console.warn("Could not access sessionStorage for qualification data", e);
    }
  }, [draft.extractedData, extractedData, draft]);

  // Process content with placeholders
  useEffect(() => {
    if (!draft.content) {
      console.warn("DraftViewer: No draft content available");
      setProcessedContent("");
      return;
    }
    
    console.log("DraftViewer: Replacing placeholders in content");
    
    // Combine all available data for replacement
    const dataForReplacement = { 
      ...localData,
      // Try to add data directly from the draft extractedData and props
      ...(draft.extractedData || {}),
      ...(extractedData || {}),
      // Add any additional data that might be needed
      dataLavratura: new Date().toLocaleDateString('pt-BR'),
    };
    
    // Add special case for qualificacao_do(a)(s)_herdeiro(a)(s)
    try {
      const qualificacaoTexto = sessionStorage.getItem('documentoGeradoTexto');
      if (qualificacaoTexto) {
        dataForReplacement.qualificacaoCompleta = qualificacaoTexto;
        dataForReplacement['qualificacao_do(a)(s)_herdeiro(a)(s)'] = qualificacaoTexto;
      }
    } catch (e) {
      console.warn("Could not access sessionStorage", e);
    }
    
    console.log("DraftViewer: Data for placeholder replacement:", Object.keys(dataForReplacement));
    
    // Start the replacement process
    const processedText = replacePlaceholders(
      draft.content, 
      dataForReplacement,
      draft,
      draft.extractedData || extractedData
    );
    
    // Log whether qualification placeholder was replaced
    const qualificationPlaceholder = "¿qualificacao_do(a)(s)_herdeiro(a)(s)>";
    const placeholderWasReplaced = !processedText.includes(qualificationPlaceholder);
    
    if (draft.content.includes(qualificationPlaceholder)) {
      console.log("DraftViewer: Qualification placeholder was replaced:", placeholderWasReplaced);
      
      if (!placeholderWasReplaced) {
        console.warn("DraftViewer: Qualification placeholder was NOT replaced");
        
        // Log available qualification data
        console.log("Available qualification data sources:");
        if (draft.extractedData?.qualificacaoCompleta) {
          console.log("- draft.extractedData.qualificacaoCompleta:", 
            draft.extractedData.qualificacaoCompleta.substring(0, 50) + "...");
        }
        // FIX: Add proper type checking to prevent error
        if (localData && typeof localData === 'object' && 'qualificacaoCompleta' in localData) {
          console.log("- localData.qualificacaoCompleta:", 
            localData.qualificacaoCompleta.substring(0, 50) + "...");
        }
        if (extractedData && 'qualificacaoCompleta' in extractedData) {
          console.log("- extractedData.qualificacaoCompleta:", 
            extractedData.qualificacaoCompleta.substring(0, 50) + "...");
        }
        if ('qualificacao_do(a)(s)_herdeiro(a)(s)' in dataForReplacement) {
          console.log("- dataForReplacement['qualificacao_do(a)(s)_herdeiro(a)(s)']:", 
            dataForReplacement['qualificacao_do(a)(s)_herdeiro(a)(s)'].substring(0, 50) + "...");
        }
      }
    }
    
    // Count remaining placeholders
    const remainingPlaceholders = (processedText.match(/¿[^>]+>/g) || []).length;
    console.log(`DraftViewer: Document still contains ${remainingPlaceholders} unreplaced placeholders`);
    
    setProcessedContent(processedText);
    
    // Notify user about replacement status
    if (remainingPlaceholders > 0) {
      toast.warning(`${remainingPlaceholders} campos não foram preenchidos automaticamente`);
    } else {
      toast.success("Todos os campos foram preenchidos com sucesso!");
    }
  }, [draft.content, localData, extractedData, draft]);

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
