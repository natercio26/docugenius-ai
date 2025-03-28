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

export const formatarData = (data: Date | string) => {
  if (!data) return "";
  const dateObj = typeof data === 'string' ? new Date(data) : data;
  return format(dateObj, "dd/MM/yyyy");
};

export const generateHeirQualification = (protocoloInfo?: Draft['protocoloInfo']) => {
  if (!protocoloInfo?.numero) {
    console.log("Sem número de protocolo fornecido");
    return '';
  }
  
  const protocolo = getProtocoloByNumero(protocoloInfo.numero);
  if (!protocolo) {
    console.log(`Protocolo ${protocoloInfo.numero} não encontrado`);
    return '';
  }
  
  // Verificar primeiro se o protocolo tem um texto de qualificação pronto
  if (protocolo.textoQualificacao) {
    console.log("Usando texto de qualificação do protocolo:", protocolo.textoQualificacao);
    return protocolo.textoQualificacao;
  }
  
  if (!protocolo.registrationData) {
    console.log(`Protocolo ${protocoloInfo.numero} sem dados de registro`);
    return '';
  }
  
  const { personalInfo, spouseInfo, type } = protocolo.registrationData;
  
  // Se for casado e tiver informações do cônjuge, usar o formato específico
  if (type === 'casado' && spouseInfo && personalInfo.civilStatus === "Casado(a)") {
    let heirQualification = `${personalInfo.name}, ${personalInfo.nationality || "brasileiro"}, nascido na cidade de ${personalInfo.naturality}-${personalInfo.uf}, aos ${formatarData(personalInfo.birthDate)}, filho de ${personalInfo.filiation}, profissão ${personalInfo.profession}, portador da Cédula de Identidade nº ${personalInfo.rg}-${personalInfo.issuer} e inscrito no CPF/MF sob o nº ${personalInfo.cpf}, endereço eletrônico: ${personalInfo.email}, casado, desde ${formatarData(spouseInfo.marriageDate)}, sob o regime da ${spouseInfo.propertyRegime}, na vigência da Lei nº 6.515/77, com ${spouseInfo.name}, ${personalInfo.nationality || "brasileira"}, nascida na cidade de ${spouseInfo.naturality}-${spouseInfo.uf}, aos ${formatarData(spouseInfo.birthDate)}, filha de ${spouseInfo.filiation}, profissão ${spouseInfo.profession}, portadora da Cédula de Identidade nº ${spouseInfo.rg}-${spouseInfo.issuer} e inscrita no CPF/MF sob o nº ${spouseInfo.cpf}, endereço eletrônico: ${spouseInfo.email}, residentes e domiciliados na ${personalInfo.address};`;
    
    console.log("Generated married heir qualification from protocol:", heirQualification);
    return heirQualification;
  } else {
    // Para solteiro, usar o formato original
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
    
    console.log("Generated single heir qualification from protocol:", heirQualification);
    return heirQualification;
  }
};

export const generateQualificationFromLocalData = (localData: Record<string, string>) => {
  if (Object.keys(localData).length === 0) return '';
  
  // Verificar se temos dados de cônjuge para determinar o formato
  const isCasado = localData.estadoCivil === "Casado(a)" || 
                  localData.civilStatus === "Casado(a)" || 
                  (localData.nomeConjuge && localData.nomeConjuge.trim() !== '');
  
  if (isCasado) {
    // Formato para pessoas casadas
    let heirQualification = `${localData.nome || localData.name}, ${localData.nacionalidade || localData.nationality || "brasileiro"}, nascido na cidade de ${localData.naturalidade || localData.naturality}-${localData.uf}, aos ${localData.dataNascimento ? formatarData(localData.dataNascimento) : (localData.birthDate ? formatarData(localData.birthDate) : "")}, filho de ${localData.filiacao || localData.filiation}, profissão ${localData.profissao || localData.profession}, portador da Cédula de Identidade nº ${localData.rg}-${localData.orgaoExpedidor || localData.issuer} e inscrito no CPF/MF sob o nº ${localData.cpf}, endereço eletrônico: ${localData.email}, casado, desde ${localData.dataCasamento ? formatarData(localData.dataCasamento) : (localData.marriageDate ? formatarData(localData.marriageDate) : "")}, sob o regime da ${localData.regimeBens || localData.propertyRegime || "comunhão parcial de bens"}, na vigência da Lei nº 6.515/77, com ${localData.nomeConjuge || localData.spouseName}, ${localData.nacionalidadeConjuge || localData.spouseNationality || "brasileira"}, nascida na cidade de ${localData.naturalidadeConjuge || localData.spouseNaturality}-${localData.ufConjuge || localData.spouseUf}, aos ${localData.dataNascimentoConjuge ? formatarData(localData.dataNascimentoConjuge) : (localData.spouseBirthDate ? formatarData(localData.spouseBirthDate) : "")}, filha de ${localData.filiacaoConjuge || localData.spouseFiliation}, profissão ${localData.profissaoConjuge || localData.spouseProfession}, portadora da Cédula de Identidade nº ${localData.rgConjuge || localData.spouseRg}-${localData.orgaoExpedidorConjuge || localData.spouseIssuer} e inscrita no CPF/MF sob o nº ${localData.cpfConjuge || localData.spouseCpf}, endereço eletrônico: ${localData.emailConjuge || localData.spouseEmail}, residentes e domiciliados na ${localData.endereco || localData.address};`;
    
    console.log("Generated married heir qualification from local data:", heirQualification);
    return heirQualification;
  } else {
    // Formato para solteiros
    let heirQualification = '';
    
    if (localData.nome || localData.name) {
      heirQualification += `${localData.nome || localData.name}`;
    }
    
    if (localData.nacionalidade || localData.nationality) {
      heirQualification += `, ${localData.nacionalidade || localData.nationality}`;
    } else if (localData.naturality) {
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
    
    console.log("Generated single heir qualification from local data:", heirQualification);
    return heirQualification;
  }
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
  
  if (content.includes('¿qualificacao_do(a)(s)_herdeiro(a)(s)>')) {
    console.log("replacePlaceholders: Found qualificacao placeholder in content");
  }
  
  const placeholderRegex = /¿([^>]+)>/g;
  const exactMappings = getPlaceholderMappings();
  
  let resultContent = content;
  
  const qualificacaoPlaceholder = '¿qualificacao_do(a)(s)_herdeiro(a)(s)';
  
  if (resultContent.includes(qualificacaoPlaceholder)) {
    console.log("Tentando substituir diretamente o placeholder de qualificação");
    
    let qualificacaoTexto = '';
    
    if (localData['qualificacao_do(a)(s)_herdeiro(a)(s)']) {
      qualificacaoTexto = localData['qualificacao_do(a)(s)_herdeiro(a)(s)'];
      console.log("Usando a qualificação diretamente do localData:", qualificacaoTexto);
    }
    else if (localData.qualificacaoCompleta) {
      qualificacaoTexto = localData.qualificacaoCompleta;
      console.log("Usando qualificação completa dos dados locais:", qualificacaoTexto);
    }
    else if (draft.protocoloInfo?.numero) {
      const protocolo = getProtocoloByNumero(draft.protocoloInfo.numero);
      if (protocolo && protocolo.textoQualificacao) {
        qualificacaoTexto = protocolo.textoQualificacao;
        console.log("Usando qualificação diretamente do protocolo:", qualificacaoTexto);
      }
    }
    else if (extractedData && extractedData.qualificacaoCompleta) {
      qualificacaoTexto = extractedData.qualificacaoCompleta;
      console.log("Usando qualificação completa dos dados extraídos:", qualificacaoTexto);
    }
    else {
      const storedQualification = sessionStorage.getItem('documentoGeradoTexto');
      if (storedQualification && storedQualification.trim() !== '') {
        qualificacaoTexto = storedQualification;
        console.log("Usando qualificação do sessionStorage:", qualificacaoTexto);
      }
    }
    
    if (qualificacaoTexto) {
      resultContent = resultContent.replace(qualificacaoPlaceholder, qualificacaoTexto);
      console.log("replacePlaceholders: Substituted qualificacao placeholder with text directly");
    } else {
      console.log("replacePlaceholders: No qualification text found to substitute");
    }
  }
  
  resultContent = resultContent.replace(placeholderRegex, (match, placeholder) => {
    const trimmedPlaceholder = placeholder.trim();
    console.log(`Substituindo ${trimmedPlaceholder}`);
    
    if (trimmedPlaceholder === 'qualificacao_do(a)(s)_herdeiro(a)(s)') {
      let qualificacaoTexto = '';
      
      if (localData['qualificacao_do(a)(s)_herdeiro(a)(s)']) {
        qualificacaoTexto = localData['qualificacao_do(a)(s)_herdeiro(a)(s)'];
        console.log("Usando a qualificação diretamente do localData:", qualificacaoTexto);
      }
      else if (localData.qualificacaoCompleta) {
        qualificacaoTexto = localData.qualificacaoCompleta;
        console.log("Usando qualificação completa dos dados locais:", qualificacaoTexto);
      }
      else if (draft.protocoloInfo?.numero) {
        const protocolo = getProtocoloByNumero(draft.protocoloInfo.numero);
        if (protocolo && protocolo.textoQualificacao) {
          qualificacaoTexto = protocolo.textoQualificacao;
          console.log("Usando qualificação diretamente do protocolo:", qualificacaoTexto);
        }
      }
      else if (extractedData && extractedData.qualificacaoCompleta) {
        qualificacaoTexto = extractedData.qualificacaoCompleta;
        console.log("Usando qualificação completa dos dados extraídos:", qualificacaoTexto);
      }
      else {
        const storedQualification = sessionStorage.getItem('documentoGeradoTexto');
        if (storedQualification && storedQualification.trim() !== '') {
          qualificacaoTexto = storedQualification;
          console.log("Usando qualificação do sessionStorage:", qualificacaoTexto);
        }
      }
      
      if (qualificacaoTexto) {
        return qualificacaoTexto;
      } else {
        console.log("Não foi possível gerar a qualificação - mantendo placeholder original");
        return match;
      }
    }
    
    if (localData[trimmedPlaceholder]) {
      console.log(`Match direto encontrado para ${trimmedPlaceholder}:`, localData[trimmedPlaceholder]);
      return localData[trimmedPlaceholder];
    }
    
    if (exactMappings[trimmedPlaceholder] && localData[exactMappings[trimmedPlaceholder]]) {
      console.log(`Match exato via mapeamento para ${trimmedPlaceholder}:`, localData[exactMappings[trimmedPlaceholder]]);
      return localData[exactMappings[trimmedPlaceholder]];
    }
    
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
    
    console.log(`Nenhum match encontrado para ${trimmedPlaceholder}`);
    return match;
  });
  
  console.log("replacePlaceholders: Content after replacement (first 100 chars):", resultContent.substring(0, 100));
  
  return resultContent;
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
