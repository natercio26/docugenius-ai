
import React from 'react';

interface TextContentSectionProps {
  title: string;
  content: string;
  maxHeight?: string;
}

const TextContentSection: React.FC<TextContentSectionProps> = ({ 
  title, 
  content,
  maxHeight
}) => {
  return (
    <div className="pt-4 border-t">
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <div className="bg-slate-50 p-4 rounded-md">
        <div 
          className={`text-sm whitespace-pre-line ${maxHeight ? 'overflow-y-auto' : ''}`}
          style={{ maxHeight: maxHeight || 'auto' }}
        >
          {content}
        </div>
      </div>
    </div>
  );
};

export default TextContentSection;
