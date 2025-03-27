
import React from 'react';

interface FieldEditorProps {
  field: { name: string; type: string; required: boolean };
  onUpdate: (field: { name: string; type: string; required: boolean }) => void;
  onRemove: () => void;
}

const FieldEditor: React.FC<FieldEditorProps> = ({ field, onUpdate, onRemove }) => {
  return (
    <div className="grid grid-cols-12 gap-4 items-center">
      <div className="col-span-5">
        <input
          type="text"
          value={field.name}
          onChange={(e) => {
            onUpdate({ ...field, name: e.target.value });
          }}
          className="input-field"
          placeholder="Nome do campo"
        />
      </div>
      <div className="col-span-3">
        <select
          value={field.type}
          onChange={(e) => {
            onUpdate({ ...field, type: e.target.value });
          }}
          className="input-field"
        >
          <option value="text">Texto</option>
          <option value="date">Data</option>
          <option value="select">Seleção</option>
          <option value="checkbox">Checkbox</option>
        </select>
      </div>
      <div className="col-span-3">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={field.required}
            onChange={(e) => {
              onUpdate({ ...field, required: e.target.checked });
            }}
            className="rounded border-input h-4 w-4 text-accent focus:ring-accent"
          />
          <span className="text-sm">Obrigatório</span>
        </label>
      </div>
      <div className="col-span-1">
        <button
          onClick={onRemove}
          className="text-destructive hover:text-destructive/80"
          aria-label="Remover campo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"></path>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default FieldEditor;
