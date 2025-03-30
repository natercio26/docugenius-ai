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
      console.log("usePlaceholderReplacement: Using data extracted from draft:", draft.extractedData);
      
      const processedData = processLocalData(draft.extractedData, draft);
      setLocalData(processedData);
      
      // Check if qualification data is available - with proper type checking
      if (draft.extractedData && 'qualificacaoCompleta' in draft.extractedData) {
        console.log("usePlaceholderReplacement: Using complete qualification data from draft");
      } else if (draft.extractedData && 
                ('qualificacaoFalecido' in draft.extractedData || 
                'qualificacaoConjuge' in draft.extractedData ||
                'qualificacaoHerdeiro1' in draft.extractedData)) {
        console.log("usePlaceholderReplacement: Using individual qualification data from draft");
      } else {
        console.warn("usePlaceholderReplacement: No qualification data found in extracted data");
      }
    }
    // Otherwise, try to use extracted data from props
    else if (extractedData && Object.keys(extractedData).length > 0) {
      console.log("usePlaceholderReplacement: Using extracted data from props:", extractedData);
      
      const processedData = processLocalData(extractedData, draft);
      setLocalData(processedData);
      
      // Check if qualification data is available - with proper type checking
      if (extractedData && typeof extractedData === 'object' && 'qualificacaoCompleta' in extractedData) {
        console.log("usePlaceholderReplacement: Using complete qualification data from props");
      } else if (extractedData && typeof extractedData === 'object' && 
                ('qualificacaoFalecido' in extractedData || 
                'qualificacaoConjuge' in extractedData ||
                'qualificacaoHerdeiro1' in extractedData)) {
        console.log("usePlaceholderReplacement: Using individual qualification data from props");
      } else {
        console.warn("usePlaceholderReplacement: No qualification data found in props data");
      }
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
    } catch (e) {
      console.warn("Could not access sessionStorage for qualification data", e);
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
    
    // Log whether qualification placeholder was replaced
    const qualificationPlaceholder = "¿qualificacao_do(a)(s)_herdeiro(a)(s)>";
    const placeholderWasReplaced = !processedText.includes(qualificationPlaceholder);
    
    if (draft.content.includes(qualificationPlaceholder)) {
      console.log("usePlaceholderReplacement: Qualification placeholder was replaced:", placeholderWasReplaced);
      
      if (!placeholderWasReplaced) {
        console.warn("usePlaceholderReplacement: Qualification placeholder was NOT replaced");
        
        // Log available qualification data
        console.log("Available qualification data sources:");
        if (draft.extractedData?.qualificacaoCompleta) {
          const qualText = draft.extractedData.qualificacaoCompleta;
          if (typeof qualText === 'string') {
            console.log("- draft.extractedData.qualificacaoCompleta:", 
              qualText.substring(0, 50) + "...");
          }
        }
        if (localData && 'qualificacaoCompleta' in localData) {
          const qualText = localData.qualificacaoCompleta;
          if (typeof qualText === 'string') {
            console.log("- localData.qualificacaoCompleta:", 
              qualText.substring(0, 50) + "...");
          }
        }
        if (extractedData && typeof extractedData === 'object' && 'qualificacaoCompleta' in extractedData) {
          const qualText = extractedData.qualificacaoCompleta;
          if (typeof qualText === 'string') {
            console.log("- extractedData.qualificacaoCompleta:", 
              qualText.substring(0, 50) + "...");
          }
        }
        if ('qualificacao_do(a)(s)_herdeiro(a)(s)' in dataForReplacement) {
          const qualText = dataForReplacement['qualificacao_do(a)(s)_herdeiro(a)(s)'];
          if (typeof qualText === 'string') {
            console.log("- dataForReplacement['qualificacao_do(a)(s)_herdeiro(a)(s)']:", 
              qualText.substring(0, 50) + "...");
          }
        }
      }
    }
    
    // Count remaining placeholders
    const remainingPlaceholders = (processedText.match(/¿[^>]+>/g) || []).length;
    console.log(`usePlaceholderReplacement: Document still contains ${remainingPlaceholders} unreplaced placeholders`);
    
    let finalContent = processedText;
    
    // Handle any missing placeholders by filling them with "DADO NÃO ENCONTRADO"
    if (remainingPlaceholders > 0) {
      finalContent = processedText.replace(/¿[^>]+>/g, "DADO NÃO ENCONTRADO");
      setProcessedContent(finalContent);
      
      toast.warning(`${remainingPlaceholders} campos não foram encontrados e foram preenchidos com "DADO NÃO ENCONTRADO"`);
    } else {
      finalContent = processedText;
      toast.success("Todos os campos foram preenchidos com sucesso!");
    }
    
    setProcessedContent(finalContent);
  }, [draft.content, localData, extractedData, draft]);

  return { processedContent };
};
