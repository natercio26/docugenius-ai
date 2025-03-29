
import { Draft } from '@/types';

export const loadDraftData = (isNew: boolean): Draft | null => {
  try {
    // Load from session storage for new drafts
    if (isNew) {
      const storedDraft = sessionStorage.getItem('generatedDraft');
      if (storedDraft) {
        const parsedDraft = JSON.parse(storedDraft);
        console.log("Draft loaded from session storage:", parsedDraft);
        
        // Check if content contains placeholder
        if (parsedDraft.content?.includes("¿qualificacao_do(a)(s)_herdeiro(a)(s)>")) {
          console.log("loadDraftData: Draft content contains qualification placeholder");
        } else {
          console.log("loadDraftData: Draft content does NOT contain qualification placeholder");
        }
        
        // Ensure extracted data is available
        if (!parsedDraft.extractedData) {
          console.warn("loadDraftData: No extracted data available in draft");
          parsedDraft.extractedData = {};
        } else {
          console.log("loadDraftData: Draft has extracted data with keys:", 
            Object.keys(parsedDraft.extractedData));
        }
        
        // Try to get qualification data from sessionStorage
        try {
          const qualificacaoTexto = sessionStorage.getItem('documentoGeradoTexto');
          if (qualificacaoTexto && !parsedDraft.extractedData.qualificacaoCompleta) {
            console.log("loadDraftData: Found qualification data in sessionStorage");
            parsedDraft.extractedData.qualificacaoCompleta = qualificacaoTexto;
            parsedDraft.extractedData['qualificacao_do(a)(s)_herdeiro(a)(s)'] = qualificacaoTexto;
          }
        } catch (e) {
          console.warn("Could not access sessionStorage for qualification data", e);
        }
        
        return parsedDraft;
      }
    }
    
    // In the future, load from database or other storage for existing drafts
    return null;
  } catch (error) {
    console.error('Error loading draft:', error);
    return null;
  }
};

export const prepareDraftData = (draft: Draft): Record<string, string> | undefined => {
  try {
    // Only use data extracted from documents
    if (draft.extractedData && Object.keys(draft.extractedData).length > 0) {
      console.log("prepareDraftData: Using data extracted from documents:", draft.extractedData);
      
      // Enhanced data preparation
      // Create a complete mapping for common placeholders
      const enhancedData: Record<string, string> = {
        ...draft.extractedData,
        dataLavratura: new Date().toLocaleDateString('pt-BR')
      };
      
      // Direct placeholder mapping - key/value pairs that match template placeholders
      const directPlaceholders: Record<string, string> = {};
      
      // Loop through extracted data and create direct placeholder mappings
      Object.entries(draft.extractedData).forEach(([key, value]) => {
        if (typeof value === 'string' && value.trim()) {
          // Convert key to a potential placeholder format
          const placeholderKey = `¿${key}>`;
          directPlaceholders[key] = value;
          
          // Log for debugging
          console.log(`Mapped placeholder ${key} to "${value.substring(0, 30)}${value.length > 30 ? '...' : ''}"`);
        }
      });
      
      // Map specific extracted data to common placeholder patterns
      if (draft.extractedData.falecido) {
        enhancedData['nome_do_"de_cujus"'] = draft.extractedData.falecido;
        enhancedData.nome_do_autor_da_heranca = draft.extractedData.falecido;
        enhancedData.qualificacao_do_autor_da_heranca = draft.extractedData.qualificacaoFalecido || '';
      }
      
      if (draft.extractedData.conjuge) {
        enhancedData['nome_do(a)_viuva(o)-meeira(o)'] = draft.extractedData.conjuge;
        enhancedData['nome_do(a)_viuvo(a)'] = draft.extractedData.conjuge;
        enhancedData['viuvo(a)-meeiro(a)'] = draft.extractedData.conjuge;
        enhancedData.qualificacao_do_viuvo = draft.extractedData.qualificacaoConjuge || '';
        enhancedData['qualificacao_do(a)_viuvo(a)'] = draft.extractedData.qualificacaoConjuge || '';
      }
      
      // Handle heir information more completely
      if (draft.extractedData.qualificacaoCompleta) {
        enhancedData['qualificacao_do(a)(s)_herdeiro(a)(s)'] = draft.extractedData.qualificacaoCompleta;
        console.log("prepareDraftData: Using complete qualification data");
      } else if (draft.extractedData['qualificacao_do(a)(s)_herdeiro(a)(s)']) {
        enhancedData['qualificacao_do(a)(s)_herdeiro(a)(s)'] = draft.extractedData['qualificacao_do(a)(s)_herdeiro(a)(s)'];
        console.log("prepareDraftData: Using direct qualification data");
      } else if (draft.extractedData.qualificacaoHerdeiro1) {
        // Consolidate multiple heirs' qualifications if available
        const heirQualifications = [];
        if (draft.extractedData.qualificacaoHerdeiro1) heirQualifications.push(draft.extractedData.qualificacaoHerdeiro1);
        if (draft.extractedData.qualificacaoHerdeiro2) heirQualifications.push(draft.extractedData.qualificacaoHerdeiro2);
        if (draft.extractedData.qualificacaoHerdeiro3) heirQualifications.push(draft.extractedData.qualificacaoHerdeiro3);
        
        if (heirQualifications.length > 0) {
          enhancedData['qualificacao_do(a)(s)_herdeiro(a)(s)'] = heirQualifications.join(';\n');
          console.log("prepareDraftData: Created consolidated heir qualifications");
        }
      }
      
      // Try to get qualification data from sessionStorage
      try {
        const qualificacaoTexto = sessionStorage.getItem('documentoGeradoTexto');
        if (qualificacaoTexto && !enhancedData['qualificacao_do(a)(s)_herdeiro(a)(s)']) {
          console.log("prepareDraftData: Found qualification data in sessionStorage");
          enhancedData['qualificacao_do(a)(s)_herdeiro(a)(s)'] = qualificacaoTexto;
        }
      } catch (e) {
        console.warn("Could not access sessionStorage for qualification data", e);
      }
      
      // Log the prepared data
      console.log("prepareDraftData: Final enhanced data with keys:", Object.keys(enhancedData));
      return enhancedData;
    }
    
    console.log("prepareDraftData: No extracted data available");
    return undefined;
  } catch (error) {
    console.error("Erro ao preparar dados do draft:", error);
    return undefined;
  }
};

export const saveDraft = (draft: Draft, title: string): Draft => {
  const updatedDraft = {
    ...draft,
    title: title,
    updatedAt: new Date(),
  };
  
  return updatedDraft;
};
