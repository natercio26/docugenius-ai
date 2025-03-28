
import React from 'react';
import { ScrollArea } from './ui/scroll-area';

interface DraftContentProps {
  content: string;
  scrollAreaRef: React.RefObject<HTMLDivElement>;
}

const DraftContent: React.FC<DraftContentProps> = ({ content, scrollAreaRef }) => {
  return (
    <div className="p-4">
      <ScrollArea className="h-[60vh] w-full" ref={scrollAreaRef}>
        <div className="whitespace-pre-line p-4">
          {content}
        </div>
      </ScrollArea>
    </div>
  );
};

export default DraftContent;
