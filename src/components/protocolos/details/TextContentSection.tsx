
import React from 'react';

interface TextContentSectionProps {
  title: string;
  content: string;
}

const TextContentSection: React.FC<TextContentSectionProps> = ({ 
  title, 
  content 
}) => {
  return (
    <div className="pt-4 border-t">
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <div className="bg-slate-50 p-4 rounded-md">
        <p className="text-sm whitespace-pre-line">{content}</p>
      </div>
    </div>
  );
};

export default TextContentSection;
