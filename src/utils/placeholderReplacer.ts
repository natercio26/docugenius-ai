
import { Draft } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getProtocoloByNumero } from './protocoloStorage';

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

export const generateHeirQualification = (protocoloInfo?: Draft['protocoloInfo']) => {
  if (!protocoloInfo?.numero) return '';
  
  const protocolo = getProtocoloByNumero(protocoloInfo.numero);
  if (!protocolo || !protocolo.registrationData) return '';
  
  const { personalInfo } = protocolo.registrationData;
  let heirQualification = '';
  
  if (personalInfo.name) {
    heirQualification += `${personalInfo.name}`;
  }
  
  if (personalInfo.nationality) {
    heirQualification += `, ${personalInfo.nationality}`;
  } else {
    heirQualification += `, brasileiro(a)`;
  }
  
  if (personalInfo.naturality && personalInfo.uf) {
    heirQualification += `, natural de ${personalInfo.naturality}-${personalInfo.uf}`;
  }
  
  if (personalInfo.birthDate) {
    try {
      const birthDate = new Date(personalInfo.birthDate);
      heirQualification += `, nascido(a) aos ${formatarDataPorExtenso(birthDate)}`;
    } catch (error) {
      console.error('Error parsing birth date:', error);
    }
  }
  
  if (personalInfo.filiation) {
    heirQualification += `, filho(a) de ${personalInfo.filiation}`;
  }
  
  if (personalInfo.profession) {
    heirQualification += `, profissão ${personalInfo.profession}`;
  }
  
  if (personalInfo.civilStatus) {
    heirQualification += `, estado civil ${personalInfo.civilStatus}`;
  }
  
  if (personalInfo.rg) {
    const issuer = personalInfo.issuer || 'SSP';
    heirQualification += `, portador(a) da Cédula de Identidade nº ${personalInfo.rg}-${issuer}`;
  }
  
  if (personalInfo.cpf) {
    heirQualification += ` e inscrito(a) no CPF/MF sob o nº ${personalInfo.cpf}`;
  }
  
  if (personalInfo.email) {
    heirQualification += `, endereço eletrônico: ${personalInfo.email}`;
  }
  
  if (personalInfo.address) {
    heirQualification += `, residente e domiciliado(a) na ${personalInfo.address}`;
  }
  
  if (!heirQualification.endsWith(';') && !heirQualification.endsWith('.')) {
    heirQualification += ';';
  }
  
  console.log("Generated heir qualification from protocol:", heirQualification);
  return heirQualification;
};

export const generateQualificationFromLocalData = (localData: Record<string, string>) => {
  if (Object.keys(localData).length === 0) return '';
  
  let heirQualification = '';
  
  if (localData.nome) {
    heirQualification += `${localData.nome}`;
  }
  
  if (localData.nacionalidade) {
    heirQualification += `, ${localData.nacionalidade}`;
  } else if (localData.naturality) {
    heirQualification += `, ${localData.naturality}`;
  } else {
    heirQualification += `, brasileiro(a)`;
  }
  
  if (localData.naturalidade && localData.uf) {
    heirQualification += `, natural de ${localData.naturalidade}-${localData.uf}`;
  } else if (localData.naturality && localData.uf) {
    heirQualification += `, natural de ${localData.naturality}-${localData.uf}`;
  }
  
  if (localData.dataNascimento) {
    heirQualification += `, nascido(a) aos ${localData.dataNascimento}`;
  } else if (localData.birthDate) {
    try {
      const birthDate = new Date(localData.birthDate);
      heirQualification += `, nascido(a) aos ${formatarDataPorExtenso(birthDate)}`;
    } catch (error) {
      console.error('Error parsing birth date:', error);
    }
  }
  
  if (localData.filiacao) {
    heirQualification += `, filho(a) de ${localData.filiacao}`;
  } else if (localData.filiation) {
    heirQualification += `, filho(a) de ${localData.filiation}`;
  }
  
  if (localData.profissao) {
    heirQualification += `, profissão ${localData.profissao}`;
  } else if (localData.profession) {
    heirQualification += `, profissão ${localData.profession}`;
  }
  
  if (localData.estadoCivil) {
    heirQualification += `, estado civil ${localData.estadoCivil}`;
  } else if (localData.civilStatus) {
    heirQualification += `, estado civil ${localData.civilStatus}`;
  }
  
  if (localData.rg && localData.orgaoExpedidor) {
    heirQualification += `, portador(a) da Cédula de Identidade nº ${localData.rg}-${localData.orgaoExpedidor}`;
  } else if (localData.rg && localData.issuer) {
    heirQualification += `, portador(a) da Cédula de Identidade nº ${localData.rg}-${localData.issuer}`;
  }
  
  if (localData.cpf) {
    heirQualification += ` e inscrito(a) no CPF/MF sob o nº ${localData.cpf}`;
  }
  
  if (localData.email) {
    heirQualification += `, endereço eletrônico: ${localData.email}`;
  }
  
  if (localData.endereco) {
    heirQualification += `, residente e domiciliado(a) na ${localData.endereco}`;
  } else if (localData.address) {
    heirQualification += `, residente e domiciliado(a) na ${localData.address}`;
  }
  
  if (!heirQualification.endsWith(';') && !heirQualification.endsWith('.')) {
    heirQualification += ';';
  }
  
  console.log("Generated heir qualification from local data:", heirQualification);
  return heirQualification;
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
  };
};

export const replacePlaceholders = (content: string, localData: Record<string, string>, draft: Draft, extractedData?: Record<string, string>): string => {
  if (!content) return '';
  
  const placeholderRegex = /¿([^>]+)>/g;
  const exactMappings = getPlaceholderMappings();
  
  return content.replace(placeholderRegex, (match, placeholder) => {
    if (placeholder.trim() === 'qualificacao_do(a)(s)_herdeiro(a)(s)') {
      console.log("Substituindo qualificacao_do(a)(s)_herdeiro(a)(s)");
      
      // Priorizar o texto de qualificação do sessionStorage
      const storedQualification = sessionStorage.getItem('documentoGeradoTexto');
      if (storedQualification) {
        console.log("Usando qualificação completa do sessionStorage:", storedQualification);
        return storedQualification;
      }
      
      // Verificar nos dados extraídos
      if (extractedData && extractedData.qualificacaoCompleta) {
        console.log("Usando qualificação completa dos dados extraídos:", extractedData.qualificacaoCompleta);
        return extractedData.qualificacaoCompleta;
      }
      
      // Gerar a partir do protocolo
      if (draft.protocoloInfo && draft.protocoloInfo.numero) {
        const heirQualification = generateHeirQualification(draft.protocoloInfo);
        if (heirQualification) {
          console.log("Usando qualificação do protocolo:", heirQualification);
          return heirQualification;
        }
      }
      
      // Gerar a partir dos dados locais
      if (Object.keys(localData).length > 0) {
        const heirQualification = generateQualificationFromLocalData(localData);
        if (heirQualification) {
          return heirQualification;
        }
      }
      
      console.log("Não foi possível gerar a qualificação - mantendo placeholder original");
      return match;
    }
    
    // Verificar correspondências exatas nos dados
    if (exactMappings[placeholder.trim()] && localData[exactMappings[placeholder.trim()]]) {
      return localData[exactMappings[placeholder.trim()]];
    }
    
    // Verificar correspondências aproximadas
    for (const [key, value] of Object.entries(localData)) {
      const simplifiedPlaceholder = placeholder
        .replace(/[()]/g, '')
        .replace(/["']/g, '')
        .replace(/[-_]/g, '')
        .toLowerCase();
        
      const simplifiedKey = key.toLowerCase();
      
      if (simplifiedPlaceholder.includes(simplifiedKey) || 
          simplifiedKey.includes(simplifiedPlaceholder)) {
        return value;
      }
    }
    
    return match;
  });
};

export const processLocalData = (extractedData?: Record<string, string>, draft?: Draft): Record<string, string> => {
  if (!extractedData && (!draft || !draft.protocoloInfo)) return {};
  
  const cleanedData = extractedData 
    ? Object.entries(extractedData).reduce((acc, [key, value]) => {
        const cleanValue = cleanupDataValue(value);
        if (cleanValue && !isInvalidData(cleanValue)) {
          acc[key] = cleanValue;
        }
        return acc;
      }, {} as Record<string, string>)
    : {};
    
  return cleanedData;
};
