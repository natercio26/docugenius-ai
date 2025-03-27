
import React from 'react';
import { useToast } from "@/hooks/use-toast";
import { Plus, Save } from 'lucide-react';

interface ActionButtonsProps {
  onAddField: () => void;
  onSave: () => void;
  fieldsCount: number;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onAddField, onSave, fieldsCount }) => {
  const { toast } = useToast();

  const handleAddField = () => {
    if (fieldsCount >= 100) {
      toast({
        title: "Limite atingido",
        description: "Você atingiu o limite máximo de 100 campos.",
        variant: "destructive"
      });
      return;
    }
    
    onAddField();
    
    toast({
      title: "Campo adicionado",
      description: "Um novo campo foi adicionado ao documento.",
    });
  };

  const handleSave = () => {
    onSave();
    
    toast({
      title: "Configurações salvas",
      description: "As configurações do documento foram salvas com sucesso.",
    });
  };

  return (
    <div className="flex items-center justify-between mt-8">
      <button
        onClick={handleAddField}
        className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md transition-colors"
      >
        <Plus size={16} />
        <span>Adicionar Campo</span>
        <span className="ml-2 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
          {fieldsCount}/100
        </span>
      </button>
      <button
        onClick={handleSave}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors"
      >
        <Save size={16} />
        <span>Salvar Configurações</span>
      </button>
    </div>
  );
};

export default ActionButtons;
