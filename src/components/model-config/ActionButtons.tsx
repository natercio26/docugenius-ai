
import React from 'react';

interface ActionButtonsProps {
  onAddField: () => void;
  onSave: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onAddField, onSave }) => {
  return (
    <div className="flex items-center justify-between mt-8">
      <button
        onClick={onAddField}
        className="button-outline"
      >
        Adicionar Campo
      </button>
      <button
        onClick={onSave}
        className="button-primary"
      >
        Salvar Configurações
      </button>
    </div>
  );
};

export default ActionButtons;
