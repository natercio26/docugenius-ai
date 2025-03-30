
import React, { useRef, useEffect } from 'react';
import { Draft } from '@/types';
import { useLocation } from 'react-router-dom';
import DraftContent from './DraftContent';
import { useQualificationData } from '@/hooks/useQualificationData';
import { usePlaceholderReplacement } from '@/hooks/usePlaceholderReplacement';
import { toast } from 'sonner';

interface DraftViewerProps {
  draft: Draft;
  extractedData?: Record<string, string>;
}

const DraftViewer: React.FC<DraftViewerProps> = ({ draft, extractedData }) => {
  const location = useLocation();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isNewDraft = location.pathname.includes('/view/new');
  
  // Check for data in sessionStorage on component mount
  useEffect(() => {
    try {
      // Check if we have document data in sessionStorage
      const documentData = sessionStorage.getItem('documentExtractedData');
      if (documentData) {
        console.log("Found document data in sessionStorage");
        const parsedData = JSON.parse(documentData);
        
        // Apply this data to the draft
        if (draft.extractedData) {
          Object.assign(draft.extractedData, parsedData);
          console.log("Applied document data from sessionStorage to draft");
        } else {
          draft.extractedData = parsedData;
          console.log("Created new extractedData in draft from sessionStorage");
        }
        
        // Toast to inform user
        toast.success("Dados dos documentos carregados com sucesso!");
      } else {
        console.warn("No document data found in sessionStorage");
        toast.warning("Não foi possível encontrar dados extraídos dos documentos. Verifique se os PDFs foram processados corretamente.");
      }
    } catch (e) {
      console.error("Error loading document data from sessionStorage:", e);
    }
  }, [draft]);
  
  // Load and manage qualification data
  useQualificationData(draft);
  
  // Process placeholders in content
  const { processedContent } = usePlaceholderReplacement(draft, extractedData);
  
  return (
    <div className="bg-white border rounded-md shadow-sm overflow-hidden">
      <DraftContent 
        content={processedContent} 
        scrollAreaRef={scrollAreaRef} 
      />
    </div>
  );
};

export default DraftViewer;
