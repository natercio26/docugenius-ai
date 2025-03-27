
import React from 'react';
import { Draft } from '@/types';

interface DraftViewerProps {
  draft: Draft;
}

const DraftViewer: React.FC<DraftViewerProps> = ({ draft }) => {
  return (
    <div className="glass rounded-lg shadow-md p-8 max-w-4xl mx-auto">
      <header className="mb-6 pb-4 border-b">
        <h1 className="font-serif text-2xl font-bold mb-2">{draft.title}</h1>
        <div className="flex justify-between items-center">
          <span className="inline-block bg-muted px-2 py-0.5 rounded-full text-xs font-medium">
            {draft.type}
          </span>
          <time className="text-sm text-muted-foreground">
            {new Intl.DateTimeFormat('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            }).format(draft.createdAt)}
          </time>
        </div>
      </header>
      
      <div className="legal-text prose-legal">
        {draft.content.split('\n').map((paragraph, index) => (
          <p key={index} className="mb-4 text-justify">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
};

export default DraftViewer;
