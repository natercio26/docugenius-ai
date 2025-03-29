
import React, { useState, useEffect, useRef } from 'react';
import { Draft } from '@/types';
import { useLocation } from 'react-router-dom';
import DraftContent from './DraftContent';
import { 
  processLocalData, 
  replacePlaceholders
} from '@/utils/placeholderReplacer';
import { toast } from 'sonner';

interface DraftViewerProps {
  draft: Draft;
  extractedData?: Record<string, string>;
}

const DraftViewer: React.FC<DraftViewerProps> = ({ draft, extractedData }) => {
  const [processedContent, setProcessedContent] = useState(draft.content);
  const [localData, setLocalData] = useState<Record<string, string>>({});
  const location = useLocation();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isNewDraft = location.pathname.includes('/view/new');
  
  // Log draft data when component mounts
  useEffect(() => {
    console.log("DraftViewer: Draft content contains qualificacao placeholder:", 
      draft.content?.includes("¿qualificacao_do(a)(s)_herdeiro(a)(s)>"));
    
    if (draft.extractedData) {
      console.log("DraftViewer: Draft contains extracted data:", draft.extractedData);
    }
    
    if (extractedData) {
      console.log("DraftViewer: Props contains extracted data:", extractedData);
    }
  }, [draft.content, draft.extractedData, extractedData]);
  
  // Process extracted data into local data
  useEffect(() => {
    console.log("DraftViewer: Initializing with extracted data");
    
    // Clear previous local data
    setLocalData({});
    
    // Only use data extracted directly from uploaded documents
    if (draft.extractedData && Object.keys(draft.extractedData).length > 0) {
      console.log("DraftViewer: Using data extracted from documents:", draft.extractedData);
      setLocalData(draft.extractedData);
    } 
    // If we have extracted data from props, process it
    else if (extractedData && Object.keys(extractedData).length > 0) {
      const cleanedData = processLocalData(extractedData, draft);
      console.log("DraftViewer: Setting processed local data from props:", cleanedData);
      setLocalData(cleanedData);
    } else {
      console.log("DraftViewer: No extracted data available");
      setLocalData({});
    }
  }, [draft.extractedData, extractedData, draft]);

  // Process content with placeholders
  useEffect(() => {
    if (draft.content) {
      // Combine document extracted data with additional local data
      const dataForReplacement = { 
        ...localData,
        ...(draft.extractedData || {}),
        // Always provide current date
        Data_lav1: new Date().toLocaleDateString('pt-BR'),
      };
      
      console.log("DraftViewer: Data for placeholder replacement:", dataForReplacement);
      
      const processedText = replacePlaceholders(
        draft.content, 
        dataForReplacement, 
        draft, 
        draft.extractedData || extractedData
      );
      
      console.log("DraftViewer: Content after replacement (preview):", 
        processedText.substring(0, 100) + "..." + 
        (processedText.includes("¿qualificacao_do(a)(s)_herdeiro(a)(s)>") ? 
          " (placeholder still present!)" : " (placeholder replaced)"));
      
      setProcessedContent(processedText);
    } else {
      setProcessedContent('');
    }
  }, [draft.content, localData, extractedData, draft]);

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
