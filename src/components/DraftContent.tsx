
import React, { useEffect } from 'react';
import { ScrollArea } from './ui/scroll-area';

interface DraftContentProps {
  content: string;
  scrollAreaRef: React.RefObject<HTMLDivElement>;
}

const DraftContent: React.FC<DraftContentProps> = ({ content, scrollAreaRef }) => {
  // Log any placeholder that might still be present in the content
  useEffect(() => {
    const placeholderRegex = /¿([^>]+)>/g;
    const placeholders = [...(content || '').matchAll(placeholderRegex)].map(match => match[0]);
    
    if (placeholders.length > 0) {
      console.log(`DraftContent: Content still contains ${placeholders.length} placeholders:`, 
        placeholders.length > 10 ? `${placeholders.slice(0, 10).join(', ')}... and ${placeholders.length - 10} more` : placeholders.join(', '));
    } else {
      console.log("DraftContent: All placeholders were successfully replaced");
    }
  }, [content]);

  // Highlight unresolved placeholders in the text
  const highlightPlaceholders = (text: string) => {
    if (!text) return '';
    
    // Replace placeholders with highlighted spans
    return text.replace(
      /¿([^>]+)>/g, 
      '<span class="bg-yellow-200 text-black px-1 rounded">¿$1></span>'
    );
  };

  return (
    <div className="p-4">
      <ScrollArea className="h-[60vh] w-full" ref={scrollAreaRef}>
        <div 
          className="whitespace-pre-line p-4 draft-content"
          dangerouslySetInnerHTML={{ __html: highlightPlaceholders(content) }}
        />
      </ScrollArea>
    </div>
  );
};

export default DraftContent;
