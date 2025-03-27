
import React, { useState } from 'react';
import { Draft } from '@/types';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

interface DraftViewerProps {
  draft: Draft;
  extractedData?: Record<string, string>;
}

const DraftViewer: React.FC<DraftViewerProps> = ({ draft, extractedData }) => {
  const [showExtractedData, setShowExtractedData] = useState(false);

  const toggleExtractedData = () => {
    setShowExtractedData(!showExtractedData);
  };

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
              <h3 className="text-sm font-medium mb-3">Dados Extraídos do Documento:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(extractedData).map(([key, value]) => (
                  <div key={key} className="p-2 bg-background/70 rounded-md">
                    <span className="text-xs font-medium text-primary block">{key}:</span>
                    <span className="text-sm block mt-1">{value}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Nota: Estes são os dados que foram extraídos automaticamente dos documentos enviados.
                Alguns campos podem precisar de edição manual para melhor precisão.
              </p>
            </div>
          )}
        </div>
      )}
      
      <div className="legal-text prose prose-legal">
        {draft.content.split('\n').map((paragraph, index) => (
          <p key={index} className="mb-4 text-justify">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
};

export default DraftViewer;
