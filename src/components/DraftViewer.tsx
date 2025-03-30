
import React, { useRef } from 'react';
import { Draft } from '@/types';
import { useLocation } from 'react-router-dom';
import DraftContent from './DraftContent';
import { useQualificationData } from '@/hooks/useQualificationData';
import { usePlaceholderReplacement } from '@/hooks/usePlaceholderReplacement';

interface DraftViewerProps {
  draft: Draft;
  extractedData?: Record<string, string>;
}

const DraftViewer: React.FC<DraftViewerProps> = ({ draft, extractedData }) => {
  const location = useLocation();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isNewDraft = location.pathname.includes('/view/new');
  
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
