
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import Navbar from '@/components/Navbar';
import DraftViewer from '@/components/DraftViewer';
import DraftHeader from '@/components/DraftHeader';
import LoadingDraft from '@/components/LoadingDraft';
import usePreventAutoScroll from '@/hooks/usePreventAutoScroll';
import { Draft } from '@/types';
import { 
  loadDraftData, 
  prepareDraftData,
  saveDraft
} from '@/utils/draftLoader';

const ViewDraft: React.FC = () => {
  const [draft, setDraft] = useState<Draft | null>(null);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';
  
  // Prevent automatic scrolling
  usePreventAutoScroll();

  // Load draft data
  useEffect(() => {
    try {
      // Force reload any draft data from sessionStorage
      sessionStorage.removeItem('loadedDraft');
      
      const loadedDraft = loadDraftData(isNew);
      
      if (loadedDraft) {
        console.log("ViewDraft: Loaded draft with protocol info:", loadedDraft.protocoloInfo);
        console.log("ViewDraft: Draft contains extracted data:", loadedDraft.extractedData);
        console.log("ViewDraft: Draft content contains qualificacao placeholder:", 
          loadedDraft.content?.includes("¿qualificacao_do(a)(s)_herdeiro(a)(s)>"));
        
        setDraft(loadedDraft);
      } else if (isNew) {
        toast.error('Nenhum rascunho foi gerado');
        navigate('/');
      } else {
        toast.error('Funcionalidade para carregar rascunhos salvos ainda não foi implementada');
        navigate('/');
      }
    } catch (error) {
      console.error("Error loading draft:", error);
      toast.error('Erro ao carregar o rascunho');
      navigate('/');
    }
  }, [id, isNew, navigate]);

  // Handler for saving draft changes
  const handleSaveDraft = (title: string) => {
    if (draft) {
      const updatedDraft = saveDraft(draft, title);
      setDraft(updatedDraft);
    }
  };

  // Show loading state if draft is not yet loaded
  if (!draft) {
    return <LoadingDraft />;
  }

  // Prepare data for the draft viewer
  const extractedDataToPass = prepareDraftData(draft);
  console.log("ViewDraft: Prepared data for draft viewer:", extractedDataToPass);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="page-container py-8">
        <div className="max-w-5xl mx-auto">
          <DraftHeader
            draft={draft}
            onSave={handleSaveDraft}
          />
          
          <DraftViewer 
            draft={draft} 
            extractedData={draft.extractedData || extractedDataToPass} 
          />
        </div>
      </main>
    </div>
  );
};

export default ViewDraft;
