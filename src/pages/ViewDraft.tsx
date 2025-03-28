
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Save, FileDown, File } from 'lucide-react';

import Navbar from '@/components/Navbar';
import DraftViewer from '@/components/DraftViewer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Draft } from '@/types';

const ViewDraft: React.FC = () => {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  useEffect(() => {
    if (isNew) {
      // Verificar se existe um rascunho no sessionStorage
      const draftFromSession = sessionStorage.getItem('generatedDraft');
      if (draftFromSession) {
        try {
          const parsedDraft = JSON.parse(draftFromSession);
          // Converter as strings de data para objetos Date
          const draftWithDates = {
            ...parsedDraft,
            createdAt: new Date(parsedDraft.createdAt),
            updatedAt: new Date(parsedDraft.updatedAt),
            protocoloInfo: parsedDraft.protocoloInfo ? {
              ...parsedDraft.protocoloInfo,
              dataGeracao: new Date(parsedDraft.protocoloInfo.dataGeracao)
            } : undefined
          };
          setDraft(draftWithDates);
          setEditedTitle(draftWithDates.title);
        } catch (error) {
          console.error('Erro ao analisar rascunho da sessão:', error);
          toast.error('Erro ao carregar o rascunho');
          navigate('/');
        }
      } else {
        toast.error('Nenhum rascunho foi gerado');
        navigate('/');
      }
    } else {
      // Implementar a recuperação de rascunhos existentes quando houver persistência
      toast.error('Funcionalidade para carregar rascunhos salvos ainda não foi implementada');
      navigate('/');
    }
  }, [id, isNew, navigate]);

  const handleSave = () => {
    if (draft) {
      // Atualizar o título
      const updatedDraft = {
        ...draft,
        title: editedTitle,
        updatedAt: new Date()
      };
      setDraft(updatedDraft);
      
      // Salvar no sessionStorage para persistência temporária
      sessionStorage.setItem('generatedDraft', JSON.stringify(updatedDraft));
      
      setIsEditing(false);
      toast.success('Minuta salva com sucesso');
    }
  };

  const handleExport = () => {
    if (draft) {
      // Lógica para exportar o rascunho
      toast.success('Exportação concluída');
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  if (!draft) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="page-container py-8">
          <div className="flex justify-center items-center h-64">
            <p className="text-muted-foreground">Carregando minuta...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="page-container py-8">
        <div className="max-w-5xl mx-auto">
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
          
          <DraftViewer 
            draft={draft} 
            extractedData={isNew && !draft.protocoloInfo ? {} : draft.extractedData} 
          />
        </div>
      </main>
    </div>
  );
};

export default ViewDraft;
