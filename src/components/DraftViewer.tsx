import React, { useState, useEffect, useRef } from 'react';
import { Draft } from '@/types';
import { Info, ChevronDown, ChevronUp, FileText, AlertTriangle, Edit, Eye, Trash2, Save } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'react-router-dom';
import { ScrollArea } from './ui/scroll-area';

interface DraftViewerProps {
  draft: Draft;
  extractedData?: Record<string, string>;
}

const DraftViewer: React.FC<DraftViewerProps> = ({ draft, extractedData }) => {
  const [showExtractedData, setShowExtractedData] = useState(true);
  const [isDataComplete, setIsDataComplete] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [localData, setLocalData] = useState<Record<string, string>>({});
  const [processedContent, setProcessedContent] = useState(draft.content);
  const { toast } = useToast();
  const location = useLocation();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isNewDraft = location.pathname.includes('/view/new');
  
  useEffect(() => {
    const preventScroll = (e: Event) => {
      if (!e.isTrusted) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('scroll', preventScroll, { passive: false });
    
    return () => {
      document.removeEventListener('scroll', preventScroll);
    };
  }, []);
  
  useEffect(() => {
    if (isNewDraft && !draft.protocoloInfo) {
      setLocalData({});
    } else if (extractedData) {
      const cleanedData = Object.entries(extractedData).reduce((acc, [key, value]) => {
        const cleanValue = cleanupDataValue(value);
        if (cleanValue && !isInvalidData(cleanValue)) {
          acc[key] = cleanValue;
        }
        return acc;
      }, {} as Record<string, string>);
      
      setLocalData(cleanedData);
    }
  }, [extractedData, draft.protocoloInfo, isNewDraft]);

  useEffect(() => {
    if (draft.content) {
      let content = draft.content;
      
      const placeholderRegex = /¿([^>]+)>/g;
      
      content = content.replace(placeholderRegex, (match, placeholder) => {
        if (placeholder.trim() === 'qualificacao_do(a)(s)_herdeiro(a)(s)') {
          if (draft.protocoloInfo && Object.keys(localData).length > 0) {
            let heirQualification = '';
            
            if (localData.nome) {
              heirQualification += `${localData.nome}`;
            }
            
            if (localData.nacionalidade) {
              heirQualification += `, ${localData.nacionalidade}`;
            }
            
            if (localData.naturalidade && localData.uf) {
              heirQualification += `, natural de ${localData.naturalidade}-${localData.uf}`;
            }
            
            if (localData.dataNascimento) {
              heirQualification += `, nascido(a) aos ${localData.dataNascimento}`;
            }
            
            if (localData.filiacao) {
              heirQualification += `, filho(a) de ${localData.filiacao}`;
            }
            
            if (localData.profissao) {
              heirQualification += `, profissão ${localData.profissao}`;
            }
            
            if (localData.estadoCivil) {
              heirQualification += `, estado civil ${localData.estadoCivil}`;
            }
            
            if (localData.rg && localData.orgaoExpedidor) {
              heirQualification += `, portador(a) da Cédula de Identidade nº ${localData.rg}-${localData.orgaoExpedidor}`;
            }
            
            if (localData.cpf) {
              heirQualification += ` e inscrito(a) no CPF/MF sob o nº ${localData.cpf}`;
            }
            
            if (localData.email) {
              heirQualification += `, endereço eletrônico: ${localData.email}`;
            }
            
            if (localData.endereco) {
              heirQualification += `, residente e domiciliado(a) na ${localData.endereco}`;
            }
            
            if (!heirQualification.endsWith(';') && !heirQualification.endsWith('.')) {
              heirQualification += ';';
            }
            
            console.log("Qualificação completa do herdeiro gerada:", heirQualification);
            return heirQualification;
          }
          
          return match;
        }
        
        const exactMappings: Record<string, string> = {
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
        
        if (exactMappings[placeholder.trim()] && localData[exactMappings[placeholder.trim()]]) {
          return localData[exactMappings[placeholder.trim()]];
        }
        
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
      
      setProcessedContent(content);
    } else {
      setProcessedContent('');
    }
  }, [draft.content, draft.protocoloInfo, localData, isNewDraft]);

  const toggleExtractedData = () => {
    setShowExtractedData(!showExtractedData);
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
    
    if (!editMode) {
      toast({
        title: "Modo de edição ativado",
        description: "Agora você pode editar os dados extraídos manualmente."
      });
    }
  };
  
  const saveChanges = () => {
    setEditMode(false);
    toast({
      title: "Alterações salvas",
      description: "As modificações nos dados foram salvas com sucesso."
    });
  };

  const handleDataChange = (key: string, value: string) => {
    setLocalData(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const removeField = (key: string) => {
    setLocalData(prev => {
      const newData = {...prev};
      delete newData[key];
      return newData;
    });
    
    toast({
      title: "Campo removido",
      description: `O campo "${getFieldLabel(key)}" foi removido dos dados extraídos.`
    });
  };
  
  const addNewField = () => {
    const newFieldKey = prompt("Digite o nome do campo (ex: nomeHerdeiro, dataObito):");
    if (newFieldKey) {
      const newFieldValue = prompt("Digite o valor para este campo:") || "";
      setLocalData(prev => ({
        ...prev,
        [newFieldKey]: newFieldValue
      }));
      
      toast({
        title: "Campo adicionado",
        description: `O campo "${newFieldKey}" foi adicionado aos dados extraídos.`
      });
    }
  };

  useEffect(() => {
    if (draft.type === 'Inventário' && extractedData) {
      const requiredFields = [
        'falecido', 'conjuge', 'dataFalecimento', 'herdeiro1', 
        'inventariante', 'regimeBens'
      ];
      
      const hasMissingFields = requiredFields.some(field => 
        !localData[field] || 
        localData[field] === 'Não identificado' || 
        localData[field] === 'N/A'
      );
      
      setIsDataComplete(!hasMissingFields);
    }
  }, [draft.type, localData]);

  const isInvalidData = (value: string): boolean => {
    if (!value) return true;
    
    const invalidPatterns = [
      /^de\s+(março|janeiro|fevereiro|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)(\s+do|\s+de)?$/i,
      /^\d{1,2}\s+(?:de|do)\s+(?:janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)$/i,
      /^(?:janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)$/i,
      /^(e|com|de|do|dos|da|das|o|os|a|as)$/i,
      /^([a-z]{1,3})$/i,
      /^odos\s+os/i,
      /^va\s/i,
      /^ão\s/i,
      /^[.,;:"'`´]\s*/i,
      /assinatura/i,
      /emissor/i,
      /^aos\s+/i,
      /^dia\s+/i,
      /^n[aã]o\s+/i,
      /^fica\s+/i,
      /poder judiciário/i,
      /tribunal/i,
      /^consulta/i,
      /^validar/i,
      /^código/i,
      /^recuperação/i,
      /^judicial/i,
      /^ião/i,
      /^estado civil$/i,
      /^nome completo$/i,
      /^profissão$/i,
      /^idade$/i,
      /^que /i,
      /^como /i,
      /^para /i,
    ];
    
    return invalidPatterns.some(pattern => pattern.test(value));
  };

  const cleanupDataValue = (value: string): string => {
    if (!value) return '';
    
    let cleanedValue = value
      .replace(/\s+/g, ' ')
      .replace(/^\s+|\s+$/g, '')
      .replace(/[^\w\s.,;:?!@#$%&*()[\]{}/<>+=\-\\|'"°ºª¹²³áàâãéèêíìîóòôõúùûçÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ]/g, '')
      .replace(/^[.,;:?!@#$%&*()[\]{}/<>+=\-\\|'"°ºª]+/, '')
      .replace(/[.,;:?!@#$%&*()[\]{}/<>+=\-\\|'"°ºª]+$/, '');
    
    if (cleanedValue.length < 3 && !/\d/.test(cleanedValue)) {
      return '';
    }
    
    const systemTextPatterns = [
      /poder judiciário/i, /certidão/i, /consulta/i, /validar/i, 
      /código/i, /tribunal/i, /recuperação/i, /judicial/i,
      /^ião/i, /^estado civil$/i, /^nome completo$/i, /^profissão$/i,
      /endereço\s+SH[IN]/i, /declarante/i, /^(S|N)$/i, /assinatura/i,
      /^aos\s+/i, /^\s*dias?\s*$/i, /^mês\s+de\s+/i, /^ano\s+/i
    ];
    
    if (systemTextPatterns.some(pattern => pattern.test(cleanedValue))) {
      return '';
    }
    
    return cleanedValue;
  };

  const getFieldLabel = (key: string): string => {
    const fieldLabels: Record<string, string> = {
      'falecido': 'Falecido(a)',
      'inventariante': 'Inventariante',
      'dataFalecimento': 'Data do Falecimento',
      'herdeiro1': 'Herdeiro 1',
      'herdeiro2': 'Herdeiro 2',
      'herdeiro3': 'Herdeiro 3',
      'herdeiro4': 'Herdeiro 4',
      'herdeiro5': 'Herdeiro 5',
      'conjuge': 'Cônjuge',
      'dataCasamento': 'Data do Casamento',
      'regimeBens': 'Regime de Bens',
      'advogado': 'Advogado(a)',
      'oabAdvogado': 'OAB',
      'numeroApartamento': 'Número do Apartamento',
      'blocoApartamento': 'Bloco',
      'quadraApartamento': 'Quadra/Endereço',
      'matriculaImovel': 'Matrícula do Imóvel',
      'inscricaoGDF': 'Inscrição GDF',
      'valorPartilhaImovel': 'Valor do Imóvel',
      'valorTotalBens': 'Valor Total dos Bens',
      'valorTotalMeacao': 'Valor Total da Meação',
      'numeroFilhos': 'Número de Filhos',
      'nomesFilhos': 'Nomes dos Filhos',
      'valorUnitarioHerdeiros': 'Valor por Herdeiro',
      'valorPorHerdeiro': 'Valor por Herdeiro',
      'percentualHerdeiros': 'Percentual por Herdeiro',
      'percentualHerdeiro': 'Percentual por Herdeiro',
      'numeroITCMD': 'Número ITCMD',
      'valorITCMD': 'Valor ITCMD',
      'hospitalFalecimento': 'Hospital do Falecimento',
      'cidadeFalecimento': 'Cidade do Falecimento',
      'matriculaObito': 'Matrícula do Óbito',
      'cartorioObito': 'Cartório do Óbito',
      'cartorioCompetente': 'Cartório Competente',
      'nome': 'Nome',
      'rg': 'RG',
      'cpf': 'CPF',
      'cpfConjuge': 'CPF do Cônjuge',
      'cpfFalecido': 'CPF do Falecido',
      'estadoCivil': 'Estado Civil',
      'profissao': 'Profissão',
      'nacionalidade': 'Nacionalidade',
      'endereco': 'Endereço',
      'enderecoConjuge': 'Endereço do Cônjuge',
      'hashCNIB': 'Hash CNIB',
      'veiculoMarca': 'Marca do Veículo',
      'veiculoModelo': 'Modelo do Veículo',
      'veiculoAno': 'Ano do Veículo',
      'veiculoPlaca': 'Placa do Veículo',
      'veiculoCor': 'Cor do Veículo',
      'veiculoChassi': 'Chassi do Veículo',
      'veiculoRenavam': 'Renavam do Veículo',
      'veiculoValor': 'Valor do Veículo',
      'bancoConta': 'Banco',
      'agenciaConta': 'Agência',
      'numeroConta': 'Número da Conta',
      'saldoConta': 'Saldo em Conta',
      'certidaoReceita': 'Certidão da Receita Federal',
      'certidaoGDF': 'Certidão do GDF',
      'certidaoIPTU': 'Certidão IPTU do Imóvel',
      'dataCertidaoCasamento': 'Data da Certidão de Casamento',
      'dataExpedicaoCertidaoObito': 'Data de Expedição da Certidão de Óbito',
      'descricaoAdicionalImovel': 'Descrição Adicional do Imóvel',
      'cartorioImovel': 'Cartório do Imóvel',
      'cartorioCasamento': 'Cartório do Casamento',
      'viuvo': 'Viúvo(a)',
      'viuva': 'Viúva',
      'rgFalecido': 'RG do Falecido',
      'rgConjuge': 'RG do Cônjuge',
      'bloco': 'Bloco',
      'quadra': 'Quadra',
      'data': 'Data',
    };
    
    return fieldLabels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  const groupExtractedData = () => {
    if (!localData || Object.keys(localData).length === 0) return {};
    
    const groups: Record<string, Record<string, string>> = {
      "Falecido": {},
      "Qualificações do Falecido": {},
      "Viúvo(a)": {},
      "Do Casamento": {},
      "Do Falecimento": {},
      "Cônjuge/Meeiro": {},
      "Dos Herdeiros": {},
      "Filhos": {},
      "Nomeação do Inventariante": {},
      "Advogado": {},
      "Bens": {},
      "Partilha": {},
      "Certidões": {},
      "Imposto": {},
      "Outros": {}
    };
    
    Object.entries(localData).forEach(([key, value]) => {
      if (!value || 
          value === "Não identificado" || 
          value === "Não identificada" || 
          value === "" || 
          value === "=====" || 
          value === "N/A" ||
          isInvalidData(value)) {
        return; 
      }
      
      if (key === 'falecido' || key === 'autor da herança' || key === 'de cujus') {
        groups["Falecido"][key] = value;
      } else if (key.includes('rg falecido') || key.includes('cpf falecido') || 
                key.includes('nacionalidade') || key.includes('profissao') || 
                key === 'rg' || key === 'cpf' || key === 'estadoCivil') {
        groups["Qualificações do Falecido"][key] = value;
      } else if (key.includes('viuv') || key.includes('viúv') || key === 'viuvo' || key === 'viuva') {
        groups["Viúvo(a)"][key] = value;
      } else if (key === 'dataCasamento' || key === 'regimeBens' || key.includes('certidaoCasamento') || 
                key === 'cartorioCasamento') {
        groups["Do Casamento"][key] = value;
      } else if (key === 'dataFalecimento' || key.includes('obito') || key.includes('óbito') || 
                key.includes('falecimento') || key === 'cidadeFalecimento' || key === 'hospitalFalecimento' ||
                key === 'cartorioObito' || key === 'matriculaObito') {
        groups["Do Falecimento"][key] = value;
      } else if (key === 'conjuge' || key === 'cônjuge' || key === 'meeiro' || key === 'meeira' ||
                key === 'cpfConjuge' || key === 'rgConjuge' || key.includes('enderecoConjuge')) {
        groups["Cônjuge/Meeiro"][key] = value;
      } else if (key.includes('herdeiro') && !key.includes('valor')) {
        groups["Dos Herdeiros"][key] = value;
      } else if (key.includes('filho') || key === 'numeroFilhos' || key === 'nomesFilhos') {
        groups["Filhos"][key] = value;
      } else if (key === 'inventariante' || key.includes('representante')) {
        groups["Nomeação do Inventariante"][key] = value;
      } else if (key === 'advogado' || key.includes('oab') || key.includes('OAB')) {
        groups["Advogado"][key] = value;
      } else if (key.includes('imovel') || key.includes('Imovel') || key.includes('apartamento') || 
                key.includes('Apartamento') || key.includes('veículo') || key.includes('veiculo') ||
                key.includes('blocoApartamento') || key.includes('quadra') || key.includes('bloco') ||
                key.includes('matriculaImovel') || key.includes('cartorioImovel') ||
                key.includes('descricaoAdicional')) {
        groups["Bens"][key] = value;
      } else if (key.includes('partilha') || key.includes('quinhao') || key.includes('quinhão') ||
                key === 'valorTotalBens' || key === 'valorTotalMeacao' || key.includes('percentual') ||
                key === 'valorUnitarioHerdeiros' || key.includes('valorPorHerdeiro') ||
                key.includes('percentualHerdeiro')) {
        groups["Partilha"][key] = value;
      } else if (key.includes('Certidao') || key.includes('certidao') || key.includes('receita') || 
                key.includes('GDF') || key.includes('gdf') || key.includes('iptu') || key.includes('IPTU')) {
        groups["Certidões"][key] = value;
      } else if (key.includes('ITCMD') || key.includes('itcmd') || key.includes('imposto') || 
                key.includes('tributo') || key.includes('valorITCMD')) {
        groups["Imposto"][key] = value;
      } else {
        groups["Outros"][key] = value;
      }
    });
    
    Object.keys(groups).forEach(key => {
      if (Object.keys(groups[key]).length === 0) {
        delete groups[key];
      }
    });
    
    return groups;
  };

  const groupedData = groupExtractedData();
  const containsHtml = processedContent.includes('<h1>') || processedContent.includes('<p>');

  const shouldShowDataSection = !isNewDraft || (draft.protocoloInfo && Object.keys(localData).length > 0);

  return (
    <div className="glass rounded-lg shadow-md p-8 max-w-4xl mx-auto">
      <header className="mb-6 pb-4 border-b">
        <h1 className="font-serif text-2xl font-bold mb-2">{draft.title}</h1>
        <div className="flex justify-between items-center">
          <span className="inline-block bg-muted px-2 py-0.5 rounded-full text-xs font-medium">
            {draft.type}
          </span>
          <time className="text-sm text-muted-foreground">
            {new Intl.DateTimeFormat('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            }).format(new Date(draft.createdAt))}
          </time>
        </div>
      </header>
      
      {shouldShowDataSection && localData && Object.keys(localData).length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <button 
              onClick={toggleExtractedData} 
              className="flex items-center space-x-2 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              <Info className="h-4 w-4" />
              <span>Dados Extraídos</span>
              {showExtractedData ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            
            <div className="flex space-x-2">
              {editMode && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={addNewField}
                  className="flex items-center gap-1"
                >
                  <span>Adicionar Campo</span>
                </Button>
              )}
              
              <Button 
                variant={editMode ? "default" : "outline"}
                size="sm" 
                onClick={editMode ? saveChanges : toggleEditMode}
                className="flex items-center gap-1"
              >
                {editMode ? <Save className="h-3.5 w-3.5" /> : <Edit className="h-3.5 w-3.5" />}
                <span>{editMode ? "Salvar" : "Editar Dados"}</span>
              </Button>
            </div>
          </div>
          
          {showExtractedData && (
            <div className="mt-4 p-4 bg-muted/30 rounded-md border border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2 text-sm font-medium">
                  <FileText className="h-4 w-4 text-primary" />
                  <h3>Dados Extraídos dos Documentos:</h3>
                </div>
                
                {!isDataComplete && (
                  <div className="flex items-center space-x-2 text-xs text-amber-500">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Dados incompletos</span>
                  </div>
                )}
              </div>
              
              {Object.keys(groupedData).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(groupedData).map(([group, fields]) => (
                    <div key={group} className="border-t pt-3 first:border-t-0 first:pt-0">
                      <h4 className="font-medium text-sm mb-2 text-primary">{group}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(fields).map(([key, value]) => (
                          <div key={key} className="p-2 bg-background/70 rounded-md">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium text-muted-foreground">{getFieldLabel(key)}:</span>
                              {editMode && (
                                <button
                                  onClick={() => removeField(key)}
                                  className="text-destructive/70 hover:text-destructive"
                                  title="Remover campo"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                            {editMode ? (
                              <input
                                type="text"
                                value={localData[key] || ''}
                                onChange={(e) => handleDataChange(key, e.target.value)}
                                className="text-sm block mt-1 w-full px-2 py-1 border border-border rounded"
                              />
                            ) : (
                              <span className="text-sm block mt-1">{value}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Não foi possível extrair dados relevantes dos documentos anexados ou todos os dados extraídos foram filtrados por serem inválidos.</p>
              )}
              
              <p className="text-xs text-muted-foreground mt-4 p-2 bg-primary/5 rounded border border-primary/10">
                <strong>Nota:</strong> {editMode ? 
                  "Você está editando os dados extraídos. Utilize esta funcionalidade para corrigir informações incorretas ou adicionar dados faltantes." :
                  "Estes são os dados que foram extraídos automaticamente dos documentos enviados. A extração automática pode não ser perfeita e alguns dados podem precisar de correção manual."}
              </p>
            </div>
          )}
        </div>
      )}
      
      <ScrollArea className="legal-text prose prose-legal h-[50vh]" ref={scrollAreaRef}>
        {containsHtml ? (
          <div dangerouslySetInnerHTML={{ __html: processedContent }} />
        ) : (
          processedContent.split('\n').map((paragraph, index) => (
            <p key={index} className="mb-4 text-justify">
              {paragraph}
            </p>
          ))
        )}
      </ScrollArea>
    </div>
  );
};

export default DraftViewer;
