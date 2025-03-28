
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, FileDown, File } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Draft } from '@/types';

interface DraftHeaderProps {
  draft: Draft;
  onSave: (title: string) => void;
}

const DraftHeader: React.FC<DraftHeaderProps> = ({ draft, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(draft.title);
  const navigate = useNavigate();

  const handleSave = () => {
    onSave(editedTitle);
    setIsEditing(false);
    toast.success('Minuta salva com sucesso');
  };

  const handleExport = () => {
    // Lógica para exportar o rascunho
    toast.success('Exportação concluída');
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="max-w-sm"
            />
            <Button size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </div>
        ) : (
          <h1 className="text-2xl font-serif">
            {draft.title}
          </h1>
        )}
      </div>
      
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleExport}>
          <FileDown className="h-4 w-4 mr-2" />
          Exportar
        </Button>
        <Button onClick={() => setIsEditing(!isEditing)}>
          <File className="h-4 w-4 mr-2" />
          {isEditing ? 'Cancelar' : 'Editar Título'}
        </Button>
      </div>
    </div>
  );
};

export default DraftHeader;
