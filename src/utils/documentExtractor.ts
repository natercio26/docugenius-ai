
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
        console.log("Created consolidated heir qualification data:", 
          processedData.qualificacaoCompleta.substring(0, 100) + "...");
      }
    }
    
    // Build complete qualification for falecido if we have components
    if (enhancedData.falecido) {
      let qualificacaoFalecido = `${enhancedData.falecido}`;
      if (enhancedData.nacionalidadeFalecido) qualificacaoFalecido += `, ${enhancedData.nacionalidadeFalecido}`;
      if (enhancedData.estadoCivilFalecido) qualificacaoFalecido += `, ${enhancedData.estadoCivilFalecido}`;
      if (enhancedData.profissaoFalecido) qualificacaoFalecido += `, ${enhancedData.profissaoFalecido}`;
      if (enhancedData.rgFalecido) qualificacaoFalecido += `, RG nº ${enhancedData.rgFalecido}`;
      if (enhancedData.cpfFalecido) qualificacaoFalecido += `, CPF nº ${enhancedData.cpfFalecido}`;
      if (enhancedData.enderecoFalecido) qualificacaoFalecido += `, residente e domiciliado à ${enhancedData.enderecoFalecido}`;
      
      processedData.qualificacaoFalecido = qualificacaoFalecido;
      console.log("Created complete qualification for falecido:", qualificacaoFalecido);
    }
    
    // Build complete qualification for cônjuge if we have components
    if (enhancedData.conjuge) {
      let qualificacaoConjuge = `${enhancedData.conjuge}`;
      if (enhancedData.nacionalidadeConjuge) qualificacaoConjuge += `, ${enhancedData.nacionalidadeConjuge}`;
      if (enhancedData.estadoCivilConjuge) qualificacaoConjuge += `, ${enhancedData.estadoCivilConjuge}`;
      if (enhancedData.profissaoConjuge) qualificacaoConjuge += `, ${enhancedData.profissaoConjuge}`;
      if (enhancedData.rgConjuge) qualificacaoConjuge += `, RG nº ${enhancedData.rgConjuge}`;
      if (enhancedData.cpfConjuge) qualificacaoConjuge += `, CPF nº ${enhancedData.cpfConjuge}`;
      if (enhancedData.enderecoConjuge) qualificacaoConjuge += `, residente e domiciliado à ${enhancedData.enderecoConjuge}`;
      
      processedData.qualificacaoConjuge = qualificacaoConjuge;
      console.log("Created complete qualification for cônjuge:", qualificacaoConjuge);
    }
    
    // Handle author of estate and spouse mapping
    if (enhancedData.falecido) {
      processedData['nome_do_"de_cujus"'] = enhancedData.falecido;
      processedData.nome_do_autor_da_heranca = enhancedData.falecido;
      processedData.qualificacao_do_autor_da_heranca = processedData.qualificacaoFalecido || '';
    }
    
    if (enhancedData.conjuge) {
      processedData['nome_do(a)_viuva(o)-meeira(o)'] = enhancedData.conjuge;
      processedData['nome_do(a)_viuvo(a)'] = enhancedData.conjuge;
      processedData['viuvo(a)-meeiro(a)'] = enhancedData.conjuge;
      processedData['qualificacao_do(a)_viuvo(a)'] = processedData.qualificacaoConjuge || '';
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
    
    console.log("Final processed document data:", processedData);
    return processedData;
  } catch (error) {
    console.error("Error extracting data from documents:", error);
    return undefined;
  }
};
