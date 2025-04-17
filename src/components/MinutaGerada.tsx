
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Download, Edit } from 'lucide-react';
import { downloadBlob } from '@/services/apiService';

interface MinutaGeradaProps {
  textContent: string | null;
  pdfBlob?: Blob | null;
  fileName: string;
}

const MinutaGerada: React.FC<MinutaGeradaProps> = ({ textContent, pdfBlob, fileName }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(textContent);

  const handleDownload = () => {
    if (pdfBlob) {
      downloadBlob(pdfBlob, fileName);
    } else if (editedContent) {
      const textBlob = new Blob([editedContent], { type: 'text/plain' });
      downloadBlob(textBlob, fileName);
    }
  };

  const handleEdit = () => {
    if (isEditing) {
      // Save changes
      setIsEditing(false);
    } else {
      // Enter edit mode
      setIsEditing(true);
    }
  };

  return (
    <div className="space-y-4 mt-6 p-4 border rounded-md bg-card">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Resultado da Minuta</h3>
        <div className="flex gap-2">
          {(pdfBlob || editedContent) && (
            <Button 
              onClick={handleDownload} 
              variant="outline" 
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Baixar {pdfBlob ? 'PDF' : 'Texto'}
            </Button>
          )}
          {textContent && (
            <Button 
              onClick={handleEdit} 
              variant="outline" 
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              {isEditing ? 'Salvar' : 'Editar'}
            </Button>
          )}
        </div>
      </div>

      {textContent ? (
        <div className="space-y-2">
          <Label htmlFor="minuta_gerada">Conteúdo da Minuta Gerada</Label>
          <Textarea
            id="minuta_gerada"
            value={isEditing ? editedContent : textContent}
            onChange={(e) => setEditedContent(e.target.value)}
            readOnly={!isEditing}
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
