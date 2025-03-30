
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Download } from 'lucide-react';
import { downloadBlob } from '@/services/apiService';

interface MinutaGeradaProps {
  textContent: string | null;
  pdfBlob: Blob | null;
  fileName: string;
}

const MinutaGerada: React.FC<MinutaGeradaProps> = ({ textContent, pdfBlob, fileName }) => {
  const handleDownload = () => {
    if (pdfBlob) {
      downloadBlob(pdfBlob, fileName);
    }
  };

  return (
    <div className="space-y-4 mt-6 p-4 border rounded-md bg-card">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Resultado da Minuta</h3>
        {pdfBlob && (
          <Button 
            onClick={handleDownload} 
            variant="outline" 
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Baixar PDF
          </Button>
        )}
      </div>

      {textContent ? (
        <div className="space-y-2">
          <Label htmlFor="minuta_gerada">Conteúdo da Minuta Gerada</Label>
          <Textarea
            id="minuta_gerada"
            value={textContent}
            readOnly
            className="min-h-[300px] font-mono text-sm"
          />
        </div>
      ) : pdfBlob ? (
        <div className="p-4 bg-muted rounded-md text-center">
          <p>Minuta gerada com sucesso! Clique no botão acima para baixar.</p>
        </div>
      ) : null}
    </div>
  );
};

export default MinutaGerada;
