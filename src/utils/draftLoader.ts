
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
              parsedDraft.extractedData['qualificacao_do(a)(s)_herdeiro(a)(s)'] = protocolo.textoQualificacao;
              
              // Atualizar o draft no sessionStorage com os dados atualizados
              sessionStorage.setItem('generatedDraft', JSON.stringify(parsedDraft));
              
              // Store the qualification text separately too for additional backup
              sessionStorage.setItem('documentoGeradoTexto', protocolo.textoQualificacao);
            }
          }
        }
        
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
    // Create a base object to collect all data
    const allData: Record<string, string> = {};
    
    // Se já temos dados extraídos no draft, adicioná-los ao objeto base
    if (draft.extractedData) {
      console.log("Usando dados extraídos do draft:", draft.extractedData);
      Object.assign(allData, draft.extractedData);
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
          
          // Adicionar qualificação às duas chaves que podem ser usadas
          allData.qualificacaoCompleta = protocolo.textoQualificacao;
          allData['qualificacao_do(a)(s)_herdeiro(a)(s)'] = protocolo.textoQualificacao;
        }
      }
    }
    
    // Verificar qualificação no sessionStorage como backup
    const qualificacaoTexto = sessionStorage.getItem('documentoGeradoTexto');
    if (qualificacaoTexto && !allData.qualificacaoCompleta) {
      console.log("Texto de qualificação encontrado no sessionStorage:", qualificacaoTexto);
      allData.qualificacaoCompleta = qualificacaoTexto;
      allData['qualificacao_do(a)(s)_herdeiro(a)(s)'] = qualificacaoTexto;
    }
    
    // Se temos dados, retorná-los
    if (Object.keys(allData).length > 0) {
      console.log("prepareDraftData: Returning combined data with keys:", Object.keys(allData));
      return allData;
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
