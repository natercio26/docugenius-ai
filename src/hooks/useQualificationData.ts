
import { useEffect } from 'react';
import { Draft } from '@/types';

/**
 * Custom hook to handle loading and managing qualification data
 */
export const useQualificationData = (draft: Draft) => {
  useEffect(() => {
    console.log("useQualificationData: Component mounted");
    
    if (draft.content?.includes("¿qualificacao_do(a)(s)_herdeiro(a)(s)>")) {
      console.log("useQualificationData: Draft content contains qualification placeholder");
    }
    
    if (draft.extractedData) {
      console.log("useQualificationData: Draft contains extracted data with keys:", 
        Object.keys(draft.extractedData));
      
      // Detailed logging of qualification data if available
      if (draft.extractedData.qualificacaoCompleta) {
        console.log("useQualificationData: Draft contains complete qualification data:", 
          draft.extractedData.qualificacaoCompleta.substring(0, 100) + "...");
      } else if (draft.extractedData.qualificacaoFalecido || 
                draft.extractedData.qualificacaoConjuge || 
                draft.extractedData.qualificacaoHerdeiro1) {
        console.log("useQualificationData: Draft contains individual qualification data for:",
          [
            draft.extractedData.qualificacaoFalecido ? "falecido" : "",
            draft.extractedData.qualificacaoConjuge ? "conjuge" : "",
            draft.extractedData.qualificacaoHerdeiro1 ? "herdeiro1" : ""
          ].filter(Boolean).join(", "));
      } else {
        console.log("useQualificationData: Draft does NOT contain qualification data");
      }
    } else {
      console.log("useQualificationData: Draft does NOT contain extracted data");
    }
    
    // Try to get qualification data from sessionStorage
    try {
      const qualificacaoTexto = sessionStorage.getItem('documentoGeradoTexto');
      if (qualificacaoTexto) {
        console.log("useQualificationData: Found qualification text in sessionStorage");
        
        // CRITICAL: This was missing type safety
        if (draft.extractedData) {
          draft.extractedData.qualificacaoCompleta = qualificacaoTexto;
          draft.extractedData['qualificacao_do(a)(s)_herdeiro(a)(s)'] = qualificacaoTexto;
        }
      }
    } catch (e) {
      console.warn("Could not access sessionStorage for qualification data", e);
    }
  }, [draft]);
};
