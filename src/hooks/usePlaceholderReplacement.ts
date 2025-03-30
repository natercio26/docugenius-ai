import { useState, useEffect } from 'react';
import { Draft } from '@/types';
import { replacePlaceholders, processLocalData } from '@/utils/placeholderReplacer';
import { toast } from 'sonner';

/**
 * Custom hook to process content with placeholders and handle their replacement
 */
export const usePlaceholderReplacement = (
  draft: Draft,
  extractedData?: Record<string, string>
) => {
  const [processedContent, setProcessedContent] = useState(draft.content || '');
  const [localData, setLocalData] = useState<Record<string, string>>({});

  // Process extracted data into local data
  useEffect(() => {
    console.log("usePlaceholderReplacement: Processing data for replacement");
    
    // Clear previous local data - but initialize with empty object to prevent type errors
    setLocalData({});
    
    // First, try to use extracted data directly from the draft
    if (draft.extractedData && Object.keys(draft.extractedData).length > 0) {
      console.log("usePlaceholderReplacement: Using data extracted from draft:", Object.keys(draft.extractedData));
      
      const processedData = processLocalData(draft.extractedData, draft);
      setLocalData(processedData);
    }
    // Otherwise, try to use extracted data from props
    else if (extractedData && Object.keys(extractedData).length > 0) {
      console.log("usePlaceholderReplacement: Using extracted data from props:", Object.keys(extractedData));
      
      const processedData = processLocalData(extractedData, draft);
      setLocalData(processedData);
    }
    else {
      console.warn("usePlaceholderReplacement: No extracted data available from any source");
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
        console.log("usePlaceholderReplacement: Adding qualification text from sessionStorage");
        setLocalData(prevData => ({
          ...prevData,
          qualificacaoCompleta: qualificacaoTexto,
          'qualificacao_do(a)(s)_herdeiro(a)(s)': qualificacaoTexto
        }));
      }
      
      // Try to load document data from sessionStorage if needed
      const documentData = sessionStorage.getItem('documentExtractedData');
      if (documentData) {
        const parsedData = JSON.parse(documentData);
        console.log("usePlaceholderReplacement: Adding document data from sessionStorage");
        setLocalData(prevData => ({
          ...prevData,
          ...parsedData
        }));
      }
    } catch (e) {
      console.warn("Could not access sessionStorage", e);
    }
  }, [draft.extractedData, extractedData, draft]);

  // Process content with placeholders
  useEffect(() => {
    if (!draft.content) {
      console.warn("usePlaceholderReplacement: No draft content available");
      setProcessedContent("");
      return;
    }
    
    console.log("usePlaceholderReplacement: Replacing placeholders in content");
    
    // Combine all available data for replacement
    const dataForReplacement: Record<string, string> = { 
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
      
      // Try to load document data from sessionStorage if needed
      const documentData = sessionStorage.getItem('documentExtractedData');
      if (documentData) {
        const parsedData = JSON.parse(documentData);
        Object.assign(dataForReplacement, parsedData);
      }
    } catch (e) {
      console.warn("Could not access sessionStorage", e);
    }
    
    console.log("usePlaceholderReplacement: Data for placeholder replacement:", Object.keys(dataForReplacement));
    
    // Start the replacement process
    const processedText = replacePlaceholders(
      draft.content, 
      dataForReplacement,
      draft,
      draft.extractedData || extractedData
    );
    
    // Count remaining placeholders
    const remainingPlaceholders = (processedText.match(/¿[^>]+>/g) || []).length;
    console.log(`usePlaceholderReplacement: Document still contains ${remainingPlaceholders} unreplaced placeholders`);
    
    let finalContent = processedText;
    
    // Handle any missing placeholders by filling them with "DADO NÃO ENCONTRADO"
    if (remainingPlaceholders > 0) {
      finalContent = processedText.replace(/¿[^>]+>/g, "DADO NÃO ENCONTRADO");
      setProcessedContent(finalContent);
      
      toast.warning(`${remainingPlaceholders} campos não foram encontrados nos documentos e foram preenchidos com "DADO NÃO ENCONTRADO"`);
    } else {
      finalContent = processedText;
      toast.success("Todos os campos foram preenchidos com sucesso com os dados dos documentos!");
    }
    
    setProcessedContent(finalContent);
  }, [draft.content, localData, extractedData, draft]);

  return { processedContent };
};
