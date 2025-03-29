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
    console.log("DraftViewer: Component mounted");
    
    if (draft.content?.includes("¿qualificacao_do(a)(s)_herdeiro(a)(s)>")) {
      console.log("DraftViewer: Draft content contains qualification placeholder");
    }
    
    if (draft.extractedData) {
      console.log("DraftViewer: Draft contains extracted data with keys:", 
        Object.keys(draft.extractedData));
    } else {
      console.log("DraftViewer: Draft does NOT contain extracted data");
    }
    
    if (extractedData) {
      console.log("DraftViewer: Props contains extracted data with keys:", 
        Object.keys(extractedData));
    } else {
      console.log("DraftViewer: Props does NOT contain extracted data");
    }
  }, [draft, extractedData]);
  
  // Process extracted data into local data
  useEffect(() => {
    console.log("DraftViewer: Processing data for replacement");
    
    // Clear previous local data
    setLocalData({});
    
    // First, try to use extracted data directly from the draft
    if (draft.extractedData && Object.keys(draft.extractedData).length > 0) {
      console.log("DraftViewer: Using data extracted from draft:", draft.extractedData);
      
      const processedData = processLocalData(draft.extractedData, draft);
      setLocalData(processedData);
      
      // Check if any known important fields are missing
      if (!draft.extractedData.qualificacaoCompleta && !draft.extractedData.qualificacao_do_herdeiro) {
        console.warn("DraftViewer: No heir qualification data found in extracted data");
      }
    }
    // Otherwise, try to use extracted data from props
    else if (extractedData && Object.keys(extractedData).length > 0) {
      console.log("DraftViewer: Using extracted data from props:", extractedData);
      
      const processedData = processLocalData(extractedData, draft);
      setLocalData(processedData);
    }
    else {
      console.warn("DraftViewer: No extracted data available from any source");
      toast.warning("Não há dados extraídos disponíveis para preencher o documento");
      
      // Provide minimal fallback data
      setLocalData({
        dataLavratura: new Date().toLocaleDateString('pt-BR')
      });
    }
  }, [draft.extractedData, extractedData, draft]);

  // Process content with placeholders
  useEffect(() => {
    if (!draft.content) {
      console.warn("DraftViewer: No draft content available");
      setProcessedContent("");
      return;
    }
    
    console.log("DraftViewer: Replacing placeholders in content");
    
    // Combine all available data for replacement
    const dataForReplacement = { 
      ...localData,
      // Add any additional data that might be needed
      dataLavratura: new Date().toLocaleDateString('pt-BR'),
    };
    
    console.log("DraftViewer: Data for placeholder replacement:", dataForReplacement);
    
    // Start the replacement process
    const processedText = replacePlaceholders(
      draft.content, 
      dataForReplacement,
      draft,
      draft.extractedData || extractedData
    );
    
    // Log whether placeholder was replaced
    const placeholderWasReplaced = !processedText.includes("¿qualificacao_do(a)(s)_herdeiro(a)(s)>");
    console.log("DraftViewer: Qualification placeholder was replaced:", placeholderWasReplaced);
    
    // Count remaining placeholders
    const remainingPlaceholders = (processedText.match(/¿[^>]+>/g) || []).length;
    console.log(`DraftViewer: Document still contains ${remainingPlaceholders} unreplaced placeholders`);
    
    setProcessedContent(processedText);
    
    // Notify user about replacement status
    if (remainingPlaceholders > 0) {
      toast.warning(`${remainingPlaceholders} campos não foram preenchidos automaticamente`);
    } else {
      toast.success("Todos os campos foram preenchidos com sucesso!");
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
