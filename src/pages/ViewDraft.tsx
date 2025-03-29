
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
        console.log("ViewDraft: Successfully loaded draft data");
        
        // Diagnostic logging
        if (loadedDraft.content?.includes("¿qualificacao_do(a)(s)_herdeiro(a)(s)>")) {
          console.log("ViewDraft: Draft content contains qualification placeholder");
          
          // Try to get qualification data from sessionStorage
          try {
            const qualificacaoTexto = sessionStorage.getItem('documentoGeradoTexto');
            if (qualificacaoTexto && loadedDraft.extractedData) {
              console.log("ViewDraft: Found qualification data in sessionStorage");
              loadedDraft.extractedData.qualificacaoCompleta = qualificacaoTexto;
              loadedDraft.extractedData['qualificacao_do(a)(s)_herdeiro(a)(s)'] = qualificacaoTexto;
            }
          } catch (e) {
            console.warn("Could not access sessionStorage for qualification data", e);
          }
        }
        
        if (loadedDraft.extractedData) {
          console.log("ViewDraft: Draft has extracted data with keys:", 
            Object.keys(loadedDraft.extractedData));
            
          // Check if qualificacaoCompleta exists in extracted data
          if (loadedDraft.extractedData.qualificacaoCompleta) {
            console.log("ViewDraft: Found qualification data:", 
              loadedDraft.extractedData.qualificacaoCompleta.substring(0, 50) + "...");
          } else {
            console.warn("ViewDraft: No qualification data found in extracted data");
          }
        } else {
          console.warn("ViewDraft: Draft does not have any extracted data");
          
          // Create a basic extracted data structure if it doesn't exist
          loadedDraft.extractedData = {
            dataLavratura: new Date().toLocaleDateString('pt-BR')
          };
        }
        
        // Create direct mappings from placeholders to values
        if (loadedDraft.extractedData && loadedDraft.content) {
          const placeholderRegex = /¿([^>]+)>/g;
          const matches = [...loadedDraft.content.matchAll(placeholderRegex)];
          
          console.log(`ViewDraft: Found ${matches.length} placeholders in content`);
          
          // Map any missing placeholders directly
          matches.forEach(match => {
            const placeholder = match[1];
            if (!loadedDraft.extractedData![placeholder] && loadedDraft.extractedData![placeholder.toLowerCase()]) {
              // Copy lowercase version to exact case version
              loadedDraft.extractedData![placeholder] = loadedDraft.extractedData![placeholder.toLowerCase()];
              console.log(`ViewDraft: Mapped lowercase data to placeholder: ${placeholder}`);
            }
          });
        }
        
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
      toast.success("Rascunho salvo com sucesso!");
    }
  };

  // Show loading state if draft is not yet loaded
  if (!draft) {
    return <LoadingDraft />;
  }

  // Prepare data for the draft viewer
  const extractedDataToPass = prepareDraftData(draft);
  console.log("ViewDraft: Prepared extracted data for draft viewer:", 
    extractedDataToPass ? Object.keys(extractedDataToPass) : "No data prepared");

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
            extractedData={extractedDataToPass} 
          />
        </div>
      </main>
    </div>
  );
};

export default ViewDraft;
