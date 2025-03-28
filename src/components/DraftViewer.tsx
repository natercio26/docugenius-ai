
import React, { useState, useEffect, useRef } from 'react';
import { Draft } from '@/types';
import { useLocation } from 'react-router-dom';
import DraftContent from './DraftContent';
import { 
  processLocalData, 
  replacePlaceholders 
} from '@/utils/placeholderReplacer';

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
  
  useEffect(() => {
    const preventScroll = (e: Event) => {
      if (!e.isTrusted) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('scroll', preventScroll, { passive: false });
    
    return () => {
      document.removeEventListener('scroll', preventScroll);
    };
  }, []);
  
  // Process extracted data into local data
  useEffect(() => {
    if (isNewDraft && !draft.protocoloInfo) {
      setLocalData({});
    } else if (extractedData) {
      const cleanedData = processLocalData(extractedData, draft);
      setLocalData(cleanedData);
    }
  }, [extractedData, draft.protocoloInfo, isNewDraft, draft]);

  // Process content with placeholders
  useEffect(() => {
    if (draft.content) {
      const processedText = replacePlaceholders(draft.content, localData, draft, extractedData);
      setProcessedContent(processedText);
    } else {
      setProcessedContent('');
    }
  }, [draft.content, draft.protocoloInfo, localData, isNewDraft, extractedData, draft]);

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
