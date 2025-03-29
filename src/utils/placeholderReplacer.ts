
import { Draft } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const cleanupDataValue = (value: string): string => {
  if (!value) return '';
  return value.trim();
};

const isInvalidData = (value: string): boolean => {
  const invalidValues = ['N/A', 'NA', 'undefined', 'null', '-'];
  return invalidValues.includes(value) || value === '';
};

export const formatarDataPorExtenso = (data: Date) => {
  return format(data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
};

export const formatarData = (data: Date | string) => {
  if (!data) return "";
  const dateObj = typeof data === 'string' ? new Date(data) : data;
  return format(dateObj, "dd/MM/yyyy");
};

const formatPropertyRegime = (regime: string): string => {
  if (!regime) return "comunhão parcial de bens";
  
  const regimeMap: Record<string, string> = {
    "comunhao_parcial": "comunhão parcial de bens",
    "comunhao_universal": "comunhão universal de bens",
    "separacao_total": "separação total de bens",
    "separacao_obrigatoria": "separação obrigatória de bens",
    "participacao_final_aquestos": "participação final nos aquestos",
  };
  
  if (regime.includes(" ")) {
    return regime.toLowerCase();
  }
  
  return regimeMap[regime] || regime.replace("_", " ").toLowerCase();
};

export const getPlaceholderMappings = (): Record<string, string> => {
  return {
    'nome_do_"de_cujus"': 'falecido',
    'nome_do_autor_da_heranca': 'falecido',
    'qualificacao_do_autor_da_heranca': 'qualificacaoFalecido',
    'nome_do(a)_viuva(o)-meeira(o)': 'conjuge',
    'nome_do(a)_viuvo(a)': 'conjuge',
    'viuvo(a)-meeiro(a)': 'conjuge',
    'qualificacao_do(a)_viuvo(a)': 'qualificacaoConjuge',
    'regime': 'regimeBens',
    'data_do_casamento': 'dataCasamento',
    'data_do_falecimento': 'dataFalecimento',
    'nome_do_hospital': 'hospitalFalecimento',
    'cidade': 'cidadeFalecimento',
    'quantidade_de_filhos': 'numeroFilhos',
    'nome_dos_filhos': 'nomesFilhos',
    'nome_do_inventariante': 'inventariante',
    'nome_do_advogado': 'advogado',
    'DESCRICAO_DO(S)_BEM(NS)': 'descricaoAdicionalImovel',
    'MATRICULA_Nº': 'matriculaImovel',
    'nº_do_cartorio': 'cartorioImovel',
    'monte_mor': 'valorTotalBens',
    'valor_da_meacao': 'valorTotalMeacao',
    'incluir_o_nome_dos_herdeiros': 'nomesFilhos',
    'incluir_o_percentual': 'percentualHerdeiro',
    'incluir_valor_que_pertence_a_cada_herdeiro': 'valorPorHerdeiro',
    'nº_da_guia': 'numeroITCMD',
    'valor': 'valorITCMD',
    'nº_da_matricula_da_cert._obito': 'matriculaObito',
    'oficio_do_cartorio': 'cartorioObito',
    'nº_do_termo': 'numeroTermoObito',
    'livro': 'livroObito',
    'fls': 'folhasObito',
    'cartorio': 'cartorioObito',
    'data_de_expedicao': 'dataExpedicaoCertidao',
    'data_de_expedicao_obito': 'dataExpedicaoObito',
    'data_de_expedicao_casamento': 'dataExpedicaoCasamento',
    'nº__da_certidao': 'numeroCertidao',
    'nº__da_certidao_receita_federal': 'numeroCertidaoReceita',
    'data_da_emissao': 'dataEmissaoCertidao',
    'incluir_hora_de_emissao': 'horaEmissaoCertidao',
    'validade': 'validadeCertidao',
    'cnd_de_iptu': 'numeroCertidaoIPTU',
    'inscricao_do_GDF': 'inscricaoGDF',
    'item_do_imovel': 'itemImovel',
    'data_de_pagamento': 'dataPagamentoITCMD',
    'valor_tributavel': 'valorTributavelITCMD',
    'codigo_hash': 'hashCNIB',
    'resultado': 'resultadoCNIB',
    'Data_lav1': 'dataLavratura',
    'modo_de_aquisicao': 'modoAquisicaoImovel',
    'REGISTRO_Nº': 'numeroRegistroImovel',
    'VALOR_R$': 'valorImovel',
    'MATRICULA-': 'matriculaImovel',
    'marca': 'veiculoMarca',
    'cor': 'veiculoCor',
    'categoria': 'veiculoCategoria',
    'alcool/gasolina': 'veiculoCombustivel',
    'placa': 'veiculoPlaca',
    'chassi': 'veiculoChassi',
    'ano': 'veiculoAno',
    'modelo': 'veiculoModelo',
    'renavam': 'veiculoRenavam',
    'corrente_ou_poupanca': 'tipoConta',
    'numero': 'numeroConta',
    'agencia': 'agenciaConta',
    'nome_do_banco': 'bancoConta',
    'numero_rural': 'numeroRural',
    'codigo_rural': 'codigoRural',
    'numero_do_exercicio': 'numeroExercicio',
    'area_total': 'areaTotal',
    'nome_da_fazenda': 'nomeFazenda',
    'fracao_minima': 'fracaoMinima',
    'area_registrada': 'areaRegistrada',
    'nirf': 'numeroNIRF',
    'citar_demais_orgaos': 'demaissOrgaos',
    'quando_feito_por_procuracao': 'infoProcuracao',
    'hora_da_emissao': 'horaEmissao',
    'nº': 'numeroModuloFiscal',
    'cidade]': 'cidade',
    'qualificacao_do(a)(s)_herdeiro(a)(s)': 'qualificacaoCompleta'
  };
};

export const replacePlaceholders = (content: string, localData: Record<string, string>, draft: Draft, extractedData?: Record<string, string>): string => {
  if (!content) return '';
  
  console.log("replacePlaceholders: Starting replacement process");
  console.log("replacePlaceholders: Available extracted data keys:", extractedData ? Object.keys(extractedData) : "No extracted data");
  
  const placeholderRegex = /¿([^>]+)>/g;
  const exactMappings = getPlaceholderMappings();
  
  let resultContent = content;
  
  // Handle current date for "Data_lav1" placeholder
  if (resultContent.includes('¿Data_lav1>')) {
    const currentDate = formatarData(new Date());
    resultContent = resultContent.replace(/¿Data_lav1>/g, currentDate);
    console.log("replacePlaceholders: Replaced Data_lav1 with current date:", currentDate);
  }
  
  // Find all placeholders in the text first for logging
  const allPlaceholders = [...content.matchAll(placeholderRegex)].map(match => match[1].trim());
  console.log("replacePlaceholders: Found placeholders:", allPlaceholders);
  
  // Special cases: Check if these specific important placeholders exist
  const specialPlaceholders = [
    'qualificacao_do(a)(s)_herdeiro(a)(s)',
    'nome_do(a)_viuvo(a)',
    'nome_do(a)_viuva(o)-meeira(o)',
    'qualificacao_do_autor_da_heranca',
    'nome_do_"de_cujus"'
  ];
  
  // Try to load qualification data from sessionStorage first (highest priority)
  try {
    const qualificacaoTexto = sessionStorage.getItem('documentoGeradoTexto');
    if (qualificacaoTexto && resultContent.includes('¿qualificacao_do(a)(s)_herdeiro(a)(s)>')) {
      console.log("replacePlaceholders: Using qualification data from sessionStorage");
      resultContent = resultContent.replace(/¿qualificacao_do\(a\)\(s\)_herdeiro\(a\)\(s\)>/g, qualificacaoTexto);
    }
  } catch (e) {
    console.warn("Could not access sessionStorage", e);
  }
  
  // Special handling for important placeholders
  for (const specialPlaceholder of specialPlaceholders) {
    if (resultContent.includes(`¿${specialPlaceholder}>`)) {
      // Try to find value in various sources
      let value = '';
      
      // Check in local data first (highest priority)
      if (localData?.[specialPlaceholder]) {
        value = localData[specialPlaceholder];
      }
      // Then check in extracted data
      else if (extractedData?.[specialPlaceholder]) {
        value = extractedData[specialPlaceholder];
      }
      // Then check in the draft's extracted data
      else if (draft.extractedData?.[specialPlaceholder]) {
        value = draft.extractedData[specialPlaceholder];
      }
      // Try the mapping
      else if (exactMappings[specialPlaceholder]) {
        const mappedKey = exactMappings[specialPlaceholder];
        if (localData?.[mappedKey]) {
          value = localData[mappedKey];
        } else if (extractedData?.[mappedKey]) {
          value = extractedData[mappedKey];
        } else if (draft.extractedData?.[mappedKey]) {
          value = draft.extractedData[mappedKey];
        }
      }
      
      // Replace the placeholder if value was found
      if (value) {
        console.log(`Special replacement for ${specialPlaceholder}:`, value.substring(0, 30) + (value.length > 30 ? '...' : ''));
        resultContent = resultContent.replace(new RegExp(`¿${specialPlaceholder}>`, 'g'), value);
      }
    }
  }
  
  // General placeholder replacement
  resultContent = resultContent.replace(placeholderRegex, (match, placeholder) => {
    const trimmedPlaceholder = placeholder.trim();
    console.log(`Tentando substituir ${trimmedPlaceholder}`);
    
    // Check directly in local data first (highest priority)
    if (localData && trimmedPlaceholder in localData) {
      console.log(`Match direto nos dados locais para ${trimmedPlaceholder}:`, localData[trimmedPlaceholder]);
      return localData[trimmedPlaceholder];
    }
    
    // Check directly in extracted data
    if (extractedData && trimmedPlaceholder in extractedData) {
      console.log(`Match direto nos dados extraídos para ${trimmedPlaceholder}:`, extractedData[trimmedPlaceholder]);
      return extractedData[trimmedPlaceholder];
    }
    
    // Check directly in draft extracted data
    if (draft.extractedData && trimmedPlaceholder in draft.extractedData) {
      console.log(`Match direto nos dados do draft para ${trimmedPlaceholder}:`, draft.extractedData[trimmedPlaceholder]);
      return draft.extractedData[trimmedPlaceholder];
    }
    
    // Check for exact placeholder through mappings
    const mappedKey = exactMappings[trimmedPlaceholder];
    if (mappedKey) {
      // Check in local data first
      if (localData && mappedKey in localData) {
        console.log(`Match via mapeamento em dados locais para ${trimmedPlaceholder} -> ${mappedKey}:`, localData[mappedKey]);
        return localData[mappedKey];
      }
      
      // Then check in extracted data
      if (extractedData && mappedKey in extractedData) {
        console.log(`Match via mapeamento em dados extraídos para ${trimmedPlaceholder} -> ${mappedKey}:`, extractedData[mappedKey]);
        return extractedData[mappedKey];
      }
      
      // Then check in draft extracted data
      if (draft.extractedData && mappedKey in draft.extractedData) {
        console.log(`Match via mapeamento em dados do draft para ${trimmedPlaceholder} -> ${mappedKey}:`, draft.extractedData[mappedKey]);
        return draft.extractedData[mappedKey];
      }
    }
    
    // Handle common special cases
    if (trimmedPlaceholder === 'qualificacao_do(a)(s)_herdeiro(a)(s)') {
      // Try to build qualification from individual heir components
      const heirQualifications = [];
      
      // Check in various sources
      const sources = [localData, extractedData, draft.extractedData].filter(Boolean);
      
      for (const source of sources) {
        if (!source) continue;
        
        if (source.qualificacaoCompleta) {
          console.log(`Usando qualificação completa para ${trimmedPlaceholder}:`, 
            source.qualificacaoCompleta.substring(0, 50) + "...");
          return source.qualificacaoCompleta;
        }
        
        if (source.qualificacaoHerdeiro1) heirQualifications.push(source.qualificacaoHerdeiro1);
        if (source.qualificacaoHerdeiro2) heirQualifications.push(source.qualificacaoHerdeiro2);
        if (source.qualificacaoHerdeiro3) heirQualifications.push(source.qualificacaoHerdeiro3);
      }
      
      if (heirQualifications.length > 0) {
        const qualification = heirQualifications.join(';\n');
        console.log(`Construindo qualificação de herdeiros para ${trimmedPlaceholder}:`, qualification.substring(0, 50) + "...");
        return qualification;
      }
      
      // Try to get qualification data from sessionStorage
      try {
        const qualificacaoTexto = sessionStorage.getItem('documentoGeradoTexto');
        if (qualificacaoTexto) {
          console.log(`Usando qualificação do sessionStorage para ${trimmedPlaceholder}:`, 
            qualificacaoTexto.substring(0, 50) + "...");
          return qualificacaoTexto;
        }
      } catch (e) {
        console.warn("Could not access sessionStorage for qualification data", e);
      }
    }
    
    // Try fuzzy matching for all data sources
    const sources = [localData, extractedData, draft.extractedData].filter(Boolean);
    
    for (const source of sources) {
      if (!source) continue;
      
      for (const [key, value] of Object.entries(source)) {
        if (!value) continue;
        
        const simplifiedPlaceholder = trimmedPlaceholder
          .replace(/[()]/g, '')
          .replace(/["']/g, '')
          .replace(/[-_]/g, '')
          .toLowerCase();
          
        const simplifiedKey = key.toLowerCase();
        
        if (simplifiedPlaceholder.includes(simplifiedKey) || 
            simplifiedKey.includes(simplifiedPlaceholder)) {
          console.log(`Match aproximado para ${trimmedPlaceholder} via ${key}:`, value);
          return value;
        }
      }
    }
    
    // Special case for current date
    if (trimmedPlaceholder === 'Data_lav1') {
      const today = formatarData(new Date());
      console.log(`Usando data atual para ${trimmedPlaceholder}:`, today);
      return today;
    }
    
    console.log(`Nenhum match encontrado para ${trimmedPlaceholder}, deixando o placeholder intacto`);
    return match;
  });
  
  // Log how many placeholders remain after replacement
  const remainingPlaceholders = [...resultContent.matchAll(placeholderRegex)].map(match => match[1].trim());
  console.log(`replacePlaceholders: ${allPlaceholders.length - remainingPlaceholders.length} placeholders replaced, ${remainingPlaceholders.length} remaining`);
  if (remainingPlaceholders.length > 0) {
    console.log("replacePlaceholders: Remaining placeholders:", remainingPlaceholders);
  }
  
  return resultContent;
};

export const processLocalData = (extractedData?: Record<string, string>, draft?: Draft): Record<string, string> => {
  if (!extractedData) return {};
  
  console.log("processLocalData: Processing extracted data:", Object.keys(extractedData));
  
  const cleanedData = extractedData 
    ? Object.entries(extractedData).reduce((acc, [key, value]) => {
        if (value && typeof value === 'string') {
          acc[key] = value.trim();
          
          // Also store the exact key format that might appear in placeholders
          if (key !== key.toLowerCase()) {
            acc[key.toLowerCase()] = value.trim();
          }
        }
        return acc;
      }, {} as Record<string, string>)
    : {};
    
  // Add special processing for qualification data
  if (draft?.extractedData?.qualificacaoCompleta) {
    cleanedData.qualificacao_do_autor_da_heranca = draft.extractedData.qualificacaoFalecido || '';
    cleanedData['qualificacao_do(a)_viuvo(a)'] = draft.extractedData.qualificacaoConjuge || '';
    cleanedData['qualificacao_do(a)(s)_herdeiro(a)(s)'] = draft.extractedData.qualificacaoCompleta;
  }
  
  // Try to load qualification data from sessionStorage
  try {
    const qualificacaoTexto = sessionStorage.getItem('documentoGeradoTexto');
    if (qualificacaoTexto) {
      console.log("processLocalData: Adding qualification from sessionStorage");
      cleanedData.qualificacaoCompleta = qualificacaoTexto;
      cleanedData['qualificacao_do(a)(s)_herdeiro(a)(s)'] = qualificacaoTexto;
    }
  } catch (e) {
    console.warn("Could not access sessionStorage for qualification data", e);
  }
  
  // Add direct placeholder mappings for exact matches
  const placeholderMappings = getPlaceholderMappings();
  
  for (const [placeholder, sourceKey] of Object.entries(placeholderMappings)) {
    if (extractedData[sourceKey] && !cleanedData[placeholder]) {
      cleanedData[placeholder] = extractedData[sourceKey];
    }
  }
    
  return cleanedData;
};
