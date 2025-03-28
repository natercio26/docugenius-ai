
import { Draft } from '@/types';
import { getProtocoloByNumero } from './protocoloStorage';

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
          
          // Verificar se existe texto de qualificação no protocolo
          const protocolo = getProtocoloByNumero(parsedDraft.protocoloInfo.numero);
          if (protocolo) {
            console.log("Dados do protocolo carregados para o draft:", protocolo.numero);
            
            // Verificar se há texto gerado no protocolo
            if (protocolo.textoQualificacao) {
              console.log("Texto de qualificação encontrado no protocolo:", protocolo.textoQualificacao);
              
              // Adicionar o texto de qualificação ao extractedData se não existir
              if (!parsedDraft.extractedData) {
                parsedDraft.extractedData = {};
              }
              
              parsedDraft.extractedData.qualificacaoCompleta = protocolo.textoQualificacao;
              
              // Atualizar o draft no sessionStorage com os dados atualizados
              sessionStorage.setItem('generatedDraft', JSON.stringify(parsedDraft));
            }
          }
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
    // Se já temos dados extraídos no draft, retorná-los
    if (draft.extractedData) {
      console.log("Usando dados extraídos do draft:", draft.extractedData);
      
      // Se temos o protocolo, verificar se há texto de qualificação
      if (draft.protocoloInfo?.numero) {
        const protocolo = getProtocoloByNumero(draft.protocoloInfo.numero);
        if (protocolo && protocolo.textoQualificacao) {
          console.log("Texto de qualificação encontrado no protocolo:", protocolo.textoQualificacao);
          
          // Adicionar/atualizar o texto de qualificação nos dados extraídos
          draft.extractedData.qualificacaoCompleta = protocolo.textoQualificacao;
        }
      }
      
      return draft.extractedData;
    }
    
    // Se temos informações de protocolo, buscar dados
    if (draft.protocoloInfo?.numero) {
      console.log("Buscando dados do protocolo:", draft.protocoloInfo.numero);
      
      const protocolo = getProtocoloByNumero(draft.protocoloInfo.numero);
      if (protocolo) {
        console.log("Dados do protocolo carregados com sucesso:", protocolo.numero);
        
        // Verificar se há texto gerado no protocolo
        if (protocolo.textoQualificacao) {
          console.log("Texto de qualificação encontrado no protocolo:", protocolo.textoQualificacao);
          
          // Criar extractedData com a qualificação
          const extractedData: Record<string, string> = {
            qualificacaoCompleta: protocolo.textoQualificacao
          };
          
          return extractedData;
        }
      }
    }
    
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
