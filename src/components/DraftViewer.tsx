
import React, { useState } from 'react';
import { Draft } from '@/types';
import { Info, ChevronDown, ChevronUp, FileText } from 'lucide-react';

interface DraftViewerProps {
  draft: Draft;
  extractedData?: Record<string, string>;
}

const DraftViewer: React.FC<DraftViewerProps> = ({ draft, extractedData }) => {
  const [showExtractedData, setShowExtractedData] = useState(true); // Default to showing data
  
  const toggleExtractedData = () => {
    setShowExtractedData(!showExtractedData);
  };

  // Group extracted data by categories for better organization
  const groupExtractedData = () => {
    if (!extractedData) return {};
    
    const groups: Record<string, Record<string, string>> = {
      "Informações Principais": {},
      "Falecido": {},
      "Herdeiros": {},
      "Imóvel": {},
      "Documentos": {},
      "Veículo": {},
      "Contas Bancárias": {},
      "Outros": {}
    };
    
    // Sort data into groups
    Object.entries(extractedData).forEach(([key, value]) => {
      if (value === "Não identificado" || value === "Não identificada" || value === "" || value === "=====" || value === "N/A") {
        return; // Skip empty values
      }
      
      if (key === 'falecido' || key === 'dataFalecimento' || key === 'cidadeFalecimento' || 
          key === 'hospitalFalecimento' || key === 'matriculaObito' || key === 'cartorioObito') {
        groups["Falecido"][key] = value;
      } else if (key.includes('herdeiro') || key === 'numeroFilhos' || key === 'nomesFilhos') {
        groups["Herdeiros"][key] = value;
      } else if (key.includes('imovel') || key.includes('Imovel') || key.includes('apartamento') || 
                key.includes('Apartamento') || key.includes('GDF') || key.includes('matricula') ||
                key.includes('quadra')) {
        groups["Imóvel"][key] = value;
      } else if (key.includes('Certidao') || key.includes('certidao') || key.includes('ITCMD') || 
                key.includes('hash') || key.includes('registro')) {
        groups["Documentos"][key] = value;
      } else if (key.includes('veiculo') || key.includes('Veiculo')) {
        groups["Veículo"][key] = value;
      } else if (key.includes('conta') || key.includes('Conta') || key.includes('banco') || 
                key.includes('Banco') || key.includes('saldo') || key.includes('Saldo')) {
        groups["Contas Bancárias"][key] = value;
      } else if (key === 'inventariante' || key === 'conjuge' || key === 'advogado' || 
                key === 'regimeBens' || key === 'dataCasamento' || key === 'valorTotalBens' ||
                key === 'valorTotalMeacao' || key === 'percentualHerdeiros' || key === 'valorUnitarioHerdeiros') {
        groups["Informações Principais"][key] = value;
      } else {
        groups["Outros"][key] = value;
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
      'estadoCivil': 'Estado Civil',
      'profissao': 'Profissão',
      'nacionalidade': 'Nacionalidade',
      'endereco': 'Endereço',
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
      'saldoConta': 'Saldo em Conta'
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
            }).format(draft.createdAt)}
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
              <div className="flex items-center space-x-2 text-sm font-medium mb-3">
                <FileText className="h-4 w-4 text-primary" />
                <h3>Dados Extraídos dos Documentos:</h3>
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
                padrão não são exibidos.
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
