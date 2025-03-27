
import React from 'react';
import FieldEditor from './FieldEditor';

interface FieldListProps {
  fields: { name: string; type: string; required: boolean }[];
  documentType: string;
  onFieldUpdate: (index: number, field: { name: string; type: string; required: boolean }) => void;
  onFieldRemove: (index: number) => void;
}

const FieldList: React.FC<FieldListProps> = ({ 
  fields, 
  documentType, 
  onFieldUpdate, 
  onFieldRemove 
}) => {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium mb-4">Campos Personalizáveis para {documentType}</h3>
      <div className="space-y-4">
        {fields.map((field, index) => (
          <FieldEditor
            key={index}
            field={field}
            onUpdate={(updatedField) => onFieldUpdate(index, updatedField)}
            onRemove={() => onFieldRemove(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default FieldList;
