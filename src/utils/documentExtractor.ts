
import { identifyPartiesAndRoles } from './partyIdentifier';
import { DraftType } from '@/types';

// Main function to extract data from uploaded files
export const extractDataFromFiles = async (files: File[]): Promise<Record<string, string> | undefined> => {
  try {
    console.log(`Beginning document extraction for ${files.length} files`);
    
    // Basic extraction data - this will be enhanced with information from documents
    const basicData: Record<string, string> = {
      dataLavratura: new Date().toLocaleDateString('pt-BR'),
    };
    
    // Identify parties (falecido, conjuge, herdeiros, etc.) from all documents
    const enhancedData = await identifyPartiesAndRoles(files, 'Inventário', basicData);
    
    // Process and consolidate the extracted data
    console.log("Document data extraction complete:", enhancedData);
    
    // Format extracted data for replacement in template
    const processedData: Record<string, string> = {
      ...enhancedData,
      // Ensure current date is always available for Data_lav1
      Data_lav1: new Date().toLocaleDateString('pt-BR'),
    };
    
    // Consolidate herdeiros information if available
    if (enhancedData.herdeiro1 || enhancedData.herdeiro2 || enhancedData.herdeiro3) {
      const herdeiros = [
        enhancedData.herdeiro1,
        enhancedData.herdeiro2,
        enhancedData.herdeiro3
      ].filter(Boolean);
      
      if (herdeiros.length > 0) {
        processedData.nomesFilhos = herdeiros.join(', ');
      }
      
      // Add specific qualificacao herdeiros if available
      const qualificacoes = [];
      if (enhancedData.qualificacaoHerdeiro1) qualificacoes.push(enhancedData.qualificacaoHerdeiro1);
      if (enhancedData.qualificacaoHerdeiro2) qualificacoes.push(enhancedData.qualificacaoHerdeiro2);
      if (enhancedData.qualificacaoHerdeiro3) qualificacoes.push(enhancedData.qualificacaoHerdeiro3);
      
      if (qualificacoes.length > 0) {
        processedData.qualificacaoCompleta = qualificacoes.join('\n');
      }
    }
    
    // Handle author of estate and spouse mapping
    if (enhancedData.falecido) {
      processedData['nome_do_"de_cujus"'] = enhancedData.falecido;
      processedData.nome_do_autor_da_heranca = enhancedData.falecido;
    }
    
    if (enhancedData.conjuge) {
      processedData['nome_do(a)_viuva(o)-meeira(o)'] = enhancedData.conjuge;
      processedData['nome_do(a)_viuvo(a)'] = enhancedData.conjuge;
      processedData['viuvo(a)-meeiro(a)'] = enhancedData.conjuge;
    }
    
    if (enhancedData.inventariante) {
      processedData.nome_do_inventariante = enhancedData.inventariante;
    }
    
    if (enhancedData.advogado) {
      processedData.nome_do_advogado = enhancedData.advogado;
    }
    
    // Format property information
    if (enhancedData.matriculaImovel) {
      processedData.MATRICULA_Nº = enhancedData.matriculaImovel;
      processedData['MATRICULA-'] = enhancedData.matriculaImovel;
    }
    
    // Map common document specific fields
    const fieldMappings = [
      ['regimeBens', 'regime'],
      ['dataCasamento', 'data_do_casamento'],
      ['dataFalecimento', 'data_do_falecimento'],
      ['hospitalFalecimento', 'nome_do_hospital'],
      ['cidadeFalecimento', 'cidade'],
      ['numeroFilhos', 'quantidade_de_filhos'],
      ['nomesFilhos', 'nome_dos_filhos'],
      ['valorTotalBens', 'monte_mor'],
      ['valorTotalMeacao', 'valor_da_meacao'],
      ['descricaoImovel', 'DESCRICAO_DO(S)_BEM(NS)'],
      ['cartorioImovel', 'nº_do_cartorio'],
      ['numeroITCMD', 'nº_da_guia'],
      ['valorITCMD', 'valor']
    ];
    
    // Apply mappings to the processed data
    fieldMappings.forEach(([source, target]) => {
      if (enhancedData[source]) {
        processedData[target] = enhancedData[source];
      }
    });
    
    return processedData;
  } catch (error) {
    console.error("Error extracting data from documents:", error);
    return undefined;
  }
};
