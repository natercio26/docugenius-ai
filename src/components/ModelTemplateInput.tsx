
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ModelTemplateInputProps {
  onChange: (template: string) => void;
  value: string;
}

const ModelTemplateInput: React.FC<ModelTemplateInputProps> = ({ onChange, value }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="modelTemplate" className="font-medium">
        Modelo da Minuta (com variáveis)
      </Label>
      <Textarea
        id="modelTemplate"
        placeholder="Cole aqui o modelo da minuta com as variáveis no formato ¿nome_variavel>"
        className="min-h-[200px] font-mono text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className="text-xs text-muted-foreground">
        Use o formato ¿nome_variavel> para especificar onde os dados extraídos serão inseridos.
      </p>
    </div>
  );
};

export default ModelTemplateInput;
