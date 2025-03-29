
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
    // Use only data extracted from documents
    if (draft.extractedData && Object.keys(draft.extractedData).length > 0) {
      console.log("Using data extracted from documents:", draft.extractedData);
      return draft.extractedData;
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
