
import React, { useState, useEffect } from 'react';
import { Draft } from '@/types';
import { Info, ChevronDown, ChevronUp, FileText, AlertTriangle } from 'lucide-react';

interface DraftViewerProps {
  draft: Draft;
  extractedData?: Record<string, string>;
}

const DraftViewer: React.FC<DraftViewerProps> = ({ draft, extractedData }) => {
  const [showExtractedData, setShowExtractedData] = useState(true); // Default to showing data
  const [isDataComplete, setIsDataComplete] = useState(true);
  
  const toggleExtractedData = () => {
    setShowExtractedData(!showExtractedData);
  };

  // Check for missing important data
  useEffect(() => {
    if (draft.type === 'Inventário' && extractedData) {
      const requiredFields = [
        'falecido', 'conjuge', 'dataFalecimento', 'herdeiro1', 
        'inventariante', 'regimeBens'
      ];
      
      const hasMissingFields = requiredFields.some(field => 
        !extractedData[field] || 
        extractedData[field] === 'Não identificado' || 
        extractedData[field] === 'N/A'
      );
      
      setIsDataComplete(!hasMissingFields);
    }
  }, [draft.type, extractedData]);

  // Clean up and filter out invalid values
  const cleanupDataValue = (value: string): string => {
    if (!value) return '';
    
    // Check for system text and placeholders
    const systemTextPatterns = [
      /poder judiciário/i, /certidão/i, /consulta/i, /validar/i, 
      /código/i, /tribunal/i, /recuperação/i, /judicial/i,
      /^ião/i, /^estado civil$/i, /^nome completo$/i, /^profissão$/i,
      /endereço\s+SH[IN]/i, /declarante/i
    ];
    
    if (systemTextPatterns.some(pattern => pattern.test(value))) {
      return '';
    }
    
    return value;
  };

  // Group extracted data by categories according to the specified order
  const groupExtractedData = () => {
    if (!extractedData) return {};
    
    // Define groups according to the specified order
    const groups: Record<string, Record<string, string>> = {
      "Viúvo(a)": {},
      "Herdeiros/Cônjuge/Casamento": {},
      "Filhos": {},
      "Advogado": {},
      "Falecido": {},
      "Qualificações do Falecido": {},
      "Do Casamento": {},
      "Do Falecimento": {},
      "Dos Herdeiros": {},
      "Nomeação do Inventariante": {},
      "Bens": {},
      "Partilha": {},
      "Certidões": {},
      "Imposto": {},
      "Outros": {}
    };
    
    // Sort data into groups
    Object.entries(extractedData).forEach(([key, value]) => {
      // Skip empty, placeholder, or system text values
      const cleanValue = cleanupDataValue(value);
      if (!cleanValue || 
          cleanValue === "Não identificado" || 
          cleanValue === "Não identificada" || 
          cleanValue === "" || 
          cleanValue === "=====" || 
          cleanValue === "N/A") {
        return; 
      }
      
      // Categorize fields according to the specified order
      if (key.includes('viuv') || key.includes('viúv')) {
        groups["Viúvo(a)"][key] = cleanValue;
      } else if (key === 'conjuge' || key === 'cônjuge' || key === 'meeiro' || key === 'meeira') {
        groups["Herdeiros/Cônjuge/Casamento"][key] = cleanValue;
      } else if (key.includes('filho') || key === 'numeroFilhos' || key === 'nomesFilhos') {
        groups["Filhos"][key] = cleanValue;
      } else if (key === 'advogado' || key.includes('oab') || key.includes('OAB')) {
        groups["Advogado"][key] = cleanValue;
      } else if (key === 'falecido' || key === 'autor da herança' || key === 'de cujus') {
        groups["Falecido"][key] = cleanValue;
      } else if (key.includes('rg falecido') || key.includes('cpf falecido') || 
                key.includes('nacionalidade') || key.includes('profissao')) {
        groups["Qualificações do Falecido"][key] = cleanValue;
      } else if (key === 'dataCasamento' || key === 'regimeBens' || key.includes('certidaoCasamento')) {
        groups["Do Casamento"][key] = cleanValue;
      } else if (key === 'dataFalecimento' || key.includes('obito') || key.includes('óbito') || 
                key.includes('falecimento') || key === 'cidadeFalecimento' || key === 'hospitalFalecimento') {
        groups["Do Falecimento"][key] = cleanValue;
      } else if (key.includes('herdeiro') && !key.includes('valor')) {
        groups["Dos Herdeiros"][key] = cleanValue;
      } else if (key === 'inventariante' || key.includes('representante')) {
        groups["Nomeação do Inventariante"][key] = cleanValue;
      } else if (key.includes('imovel') || key.includes('Imovel') || key.includes('apartamento') || 
                key.includes('Apartamento') || key.includes('veículo') || key.includes('veiculo') ||
                key.includes('blocoApartamento') || key.includes('quadra')) {
        groups["Bens"][key] = cleanValue;
      } else if (key.includes('partilha') || key.includes('quinhao') || key.includes('quinhão') ||
                key === 'valorTotalBens' || key === 'valorTotalMeacao' || key.includes('percentual') ||
                key === 'valorUnitarioHerdeiros') {
        groups["Partilha"][key] = cleanValue;
      } else if (key.includes('Certidao') || key.includes('certidao') || key.includes('receita') || 
                key.includes('GDF') || key.includes('gdf') || key.includes('iptu') || key.includes('IPTU')) {
        groups["Certidões"][key] = cleanValue;
      } else if (key.includes('ITCMD') || key.includes('itcmd') || key.includes('imposto') || 
                key.includes('tributo') || key.includes('valorITCMD')) {
        groups["Imposto"][key] = cleanValue;
      } else {
        groups["Outros"][key] = cleanValue;
      }
    });
    
    // Remove empty categories
    Object.keys(groups).forEach(key => {
      if (Object.keys(groups[key]).length === 0) {
        delete groups[key];
      }
    });
    
    return groups;
  };

  // Get human-readable field names
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
      'percentualHerdeiros': 'Percentual por Herdeiro',
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
      'viuva': 'Viúva'
    };
    
    return fieldLabels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  const groupedData = groupExtractedData();

  // Check if content contains HTML markup
  const containsHtml = draft.content.includes('<h1>') || draft.content.includes('<p>');

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
      
      {extractedData && Object.keys(extractedData).length > 0 && (
        <div className="mb-6">
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
                            <span className="text-xs font-medium text-muted-foreground block">{getFieldLabel(key)}:</span>
                            <span className="text-sm block mt-1">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Não foi possível extrair dados relevantes dos documentos anexados.</p>
              )}
              
              <p className="text-xs text-muted-foreground mt-4 p-2 bg-primary/5 rounded border border-primary/10">
                <strong>Nota:</strong> Estes são os dados que foram extraídos automaticamente dos documentos enviados.
                Alguns campos podem precisar de edição manual para melhor precisão. Campos não preenchidos ou com valores
                padrão não são exibidos. A ordem segue a estrutura padrão para o documento de {draft.type}.
              </p>
            </div>
          )}
        </div>
      )}
      
      <div className="legal-text prose prose-legal">
        {containsHtml ? (
          <div dangerouslySetInnerHTML={{ __html: draft.content }} />
        ) : (
          draft.content.split('\n').map((paragraph, index) => (
            <p key={index} className="mb-4 text-justify">
              {paragraph}
            </p>
          ))
        )}
      </div>
    </div>
  );
};

export default DraftViewer;
