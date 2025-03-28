import { Draft } from '@/types';

export const loadDraftData = (isNew: boolean): Draft | null => {
  try {
    // Load from session storage for new drafts
    if (isNew) {
      const storedDraft = sessionStorage.getItem('generatedDraft');
      if (storedDraft) {
        const parsedDraft = JSON.parse(storedDraft);
        console.log("Draft loaded from session storage:", parsedDraft);
        
        // Verificar se o protocolo existe e buscar dados adicionais se necessário
        if (parsedDraft.protocoloInfo?.numero) {
          console.log("Protocolo encontrado no draft:", parsedDraft.protocoloInfo.numero);
          // Os dados completos do protocolo já devem estar no extractedData
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
  // Se já temos dados extraídos no draft, retorná-los
  if (draft.extractedData) {
    console.log("Usando dados extraídos do draft:", draft.extractedData);
    return draft.extractedData;
  }
  
  // Se temos informações de protocolo, buscar dados
  if (draft.protocoloInfo?.numero) {
    console.log("Buscando dados do protocolo:", draft.protocoloInfo.numero);
    // Outros dados específicos do protocolo já devem estar no draft.extractedData
  }
  
  return undefined;
};
export const saveDraft = (draft: Draft, title: string): Draft => {
  const updatedDraft = {
    ...draft,
    title: title,
    updatedAt: new Date(),
  };
  
  return updatedDraft;
};
