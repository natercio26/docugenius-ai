
import React from 'react';
import { ScrollArea } from './ui/scroll-area';

interface DraftContentProps {
  content: string;
  scrollAreaRef: React.RefObject<HTMLDivElement>;
}

const DraftContent: React.FC<DraftContentProps> = ({ content, scrollAreaRef }) => {
  // Log any placeholder that might still be present in the content
  React.useEffect(() => {
    const placeholderRegex = /¿([^>]+)>/g;
    const placeholders = [...content.matchAll(placeholderRegex)].map(match => match[0]);
    
    if (placeholders.length > 0) {
      console.log("DraftContent: Content still contains placeholders:", placeholders);
    } else {
      console.log("DraftContent: All placeholders were successfully replaced");
    }
  }, [content]);

  return (
    <div className="p-4">
      <ScrollArea className="h-[60vh] w-full" ref={scrollAreaRef}>
        <div className="whitespace-pre-line p-4 draft-content">
          {content}
        </div>
      </ScrollArea>
    </div>
  );
};

export default DraftContent;
