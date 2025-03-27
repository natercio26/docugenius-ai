
import React from 'react';
import { DraftType } from '@/types';

interface TypeSelectorProps {
  selectedType: DraftType;
  onTypeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  draftTypes: DraftType[];
}

const TypeSelector: React.FC<TypeSelectorProps> = ({ 
  selectedType, 
  onTypeChange,
  draftTypes
}) => {
  return (
    <div className="mb-6">
      <label htmlFor="documentType" className="block text-sm font-medium mb-2">
        Tipo de Documento
      </label>
      <select
        id="documentType"
        value={selectedType}
        onChange={onTypeChange}
        className="input-field"
      >
        {draftTypes.map(type => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select>
    </div>
  );
};

export default TypeSelector;
