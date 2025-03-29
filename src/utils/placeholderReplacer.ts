
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

export const generateHeirQualification = (): string => {
  // This function now returns empty string as we don't want to generate 
  // qualification data from registration/protocol data
  return '';
};

export const generateQualificationFromLocalData = (localData: Record<string, string>): string => {
  // This function now returns empty string as we don't want to generate 
  // qualification data from registration data
  return '';
};

export const getPlaceholderMappings = (): Record<string, string> => {
  return {
    'nome_do_"de_cujus"': 'falecido',
    'nome_do_autor_da_heranca': 'falecido',
    'nome_do(a)_viuva(o)-meeira(o)': 'conjuge',
    'nome_do(a)_viuvo(a)': 'conjuge',
    'viuvo(a)-meeiro(a)': 'conjuge',
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
  
  console.log("replacePlaceholders: Content before replacement (first 100 chars):", content.substring(0, 100));
  
  const placeholderRegex = /¿([^>]+)>/g;
  const exactMappings = getPlaceholderMappings();
  
  let resultContent = content;
  
  // Handle current date for "Data_lav1" placeholder
  if (resultContent.includes('¿Data_lav1>')) {
    const currentDate = formatarData(new Date());
    resultContent = resultContent.replace('¿Data_lav1>', currentDate);
    console.log("replacePlaceholders: Replaced Data_lav1 with current date:", currentDate);
  }
  
  resultContent = resultContent.replace(placeholderRegex, (match, placeholder) => {
    const trimmedPlaceholder = placeholder.trim();
    console.log(`Substituindo ${trimmedPlaceholder}`);
    
    // Check direct match in local data
    if (localData[trimmedPlaceholder]) {
      console.log(`Match direto encontrado para ${trimmedPlaceholder}:`, localData[trimmedPlaceholder]);
      return localData[trimmedPlaceholder];
    }
    
    // Check exact mappings
    if (exactMappings[trimmedPlaceholder] && localData[exactMappings[trimmedPlaceholder]]) {
      console.log(`Match exato via mapeamento para ${trimmedPlaceholder}:`, localData[exactMappings[trimmedPlaceholder]]);
      return localData[exactMappings[trimmedPlaceholder]];
    }
    
    // Check for approximated matches
    for (const [key, value] of Object.entries(localData)) {
      const simplifiedPlaceholder = trimmedPlaceholder
        .replace(/[()]/g, '')
        .replace(/["']/g, '')
        .replace(/[-_]/g, '')
        .toLowerCase();
        
      const simplifiedKey = key.toLowerCase();
      
      if (simplifiedPlaceholder.includes(simplifiedKey) || 
          simplifiedKey.includes(simplifiedPlaceholder)) {
        console.log(`Match aproximado encontrado para ${trimmedPlaceholder} via ${key}:`, value);
        return value;
      }
    }
    
    // Special case for current date
    if (trimmedPlaceholder === 'Data_lav1') {
      const today = formatarData(new Date());
      console.log(`Usando data atual para ${trimmedPlaceholder}:`, today);
      return today;
    }
    
    console.log(`Nenhum match encontrado para ${trimmedPlaceholder}`);
    return match;
  });
  
  console.log("replacePlaceholders: Content after replacement (first 100 chars):", resultContent.substring(0, 100));
  
  return resultContent;
};

export const processLocalData = (extractedData?: Record<string, string>, draft?: Draft): Record<string, string> => {
  if (!extractedData) return {};
  
  const cleanedData = extractedData 
    ? Object.entries(extractedData).reduce((acc, [key, value]) => {
        if (value && typeof value === 'string') {
          acc[key] = value.trim();
        }
        return acc;
      }, {} as Record<string, string>)
    : {};
    
  return cleanedData;
};
