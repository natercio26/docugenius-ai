
import React from 'react';
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface FieldEditorProps {
  field: { name: string; type: string; required: boolean };
  onUpdate: (field: { name: string; type: string; required: boolean }) => void;
  onRemove: () => void;
}

const FieldEditor: React.FC<FieldEditorProps> = ({ field, onUpdate, onRemove }) => {
  const { toast } = useToast();
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.trim() === '') {
      toast({
        title: "Campo obrigatório",
        description: "O nome do campo não pode estar vazio.",
        variant: "destructive"
      });
      return;
    }
    onUpdate({ ...field, name: e.target.value });
  };

  // Define field types for different document info types with enhanced categorization
  const suggestedTypes = () => {
    const nameLower = field.name.toLowerCase();
    
    // Enhanced date pattern detection
    if (nameLower.includes('data') || 
        nameLower.includes('nascimento') || 
        nameLower.includes('falecimento') || 
        nameLower.includes('casamento') ||
        nameLower.includes('expedicao') ||
        nameLower.includes('emissao') ||
        nameLower.includes('pagamento') ||
        nameLower.includes('validade')) {
      return 'date';
    }
    
    // Enhanced number/value detection
    if (nameLower.includes('valor') || 
        nameLower.includes('percentual') || 
        nameLower.includes('número') ||
        nameLower.includes('nº') || 
        nameLower.includes('qtd') ||
        nameLower.includes('quantidade') ||
        nameLower.includes('código') ||
        nameLower.includes('codigo') ||
        nameLower.includes('matricula') ||
        nameLower.includes('registro') ||
        nameLower.includes('nirf') ||
        nameLower.includes('monte') ||
        nameLower.includes('guia') ||
        nameLower.includes('iptu') ||
        nameLower.includes('área') ||
        nameLower.includes('area') ||
        nameLower.includes('cep') ||
        nameLower.includes('inscricao') ||
        nameLower.includes('hash') ||
        nameLower.includes('chassi') ||
        nameLower.includes('placa') ||
        nameLower.includes('renavam')) {
      return 'number';
    }
    
    // Enhanced long text detection
    if (nameLower.includes('descrição') || 
        nameLower.includes('observação') || 
        nameLower.includes('detalhes') ||
        nameLower.includes('qualificacao') ||
        nameLower.includes('especificacao') ||
        nameLower.includes('endereço') ||
        nameLower.includes('endereco')) {
      return 'textarea';
    }
    
    // Enhanced selection detection
    if (nameLower.includes('regime') || 
        nameLower.includes('estado civil') ||
        nameLower.includes('tipo') ||
        nameLower.includes('categoria') ||
        nameLower.includes('cor') ||
        nameLower.includes('combustível') ||
        nameLower.includes('combustivel') ||
        nameLower.includes('alcool/gasolina') ||
        nameLower.includes('banco') ||
        nameLower.includes('cidade') ||
        nameLower.includes('cartorio') ||
        nameLower.includes('oficio')) {
      return 'select';
    }
    
    // Enhanced boolean detection
    if (nameLower.includes('confirmação') || 
        nameLower.includes('aceite') || 
        nameLower.includes('concorda') ||
        nameLower.includes('incluir')) {
      return 'checkbox';
    }
    
    // Enhanced file detection
    if (nameLower.includes('documento') || 
        nameLower.includes('certidão') || 
        nameLower.includes('certidao') || 
        nameLower.includes('anexo') ||
        nameLower.includes('comprovante')) {
      return 'file';
    }
    
    // Name detection - particularly important for inventário
    if (nameLower.includes('nome') || 
        nameLower.includes('autor') || 
        nameLower.includes('falecido') ||
        nameLower.includes('cujus') ||
        nameLower.includes('herdeiro') ||
        nameLower.includes('inventariante') ||
        nameLower.includes('viuvo') ||
        nameLower.includes('viuva') ||
        nameLower.includes('conjuge') ||
        nameLower.includes('meeiro') ||
        nameLower.includes('meeira') ||
        nameLower.includes('advogado') ||
        nameLower.includes('hospital') ||
        nameLower.includes('fazenda')) {
      return 'text';
    }
    
    return field.type || 'text';
  };

  // Suggest if the field should be required based on its name - enhanced for more critical fields
  const suggestRequired = () => {
    const nameLower = field.name.toLowerCase();
    
    // Critical fields that should always be required for inventory
    const criticalFields = [
      'falecido', 'cujus', 'conjuge', 'inventariante', 'regime', 'cpf', 
      'data falecimento', 'herdeiro', 'advogado', 'viuvo', 'viuva',
      'meeiro', 'meeira', 'matricula', 'qualificacao', 'obito',
      'especificacao', 'nome', 'autor', 'heranca', 'valor', 'monte',
      'casamento', 'falecimento', 'cartorio', 'cidade', 'registro',
      'bem', 'bens', 'certidao', 'descricao', 'data', 'nascimento'
    ];
    
    return criticalFields.some(criticalField => nameLower.includes(criticalField)) || field.required;
  };

  return (
    <div className="grid grid-cols-12 gap-4 items-center p-3 border rounded-md bg-background shadow-sm hover:shadow transition-all">
      <div className="col-span-5">
        <input
          type="text"
          value={field.name}
          onChange={handleNameChange}
          className="w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Nome do campo"
        />
      </div>
      <div className="col-span-3">
        <select
          value={field.type}
          onChange={(e) => {
            onUpdate({ ...field, type: e.target.value });
          }}
          className="w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="text">Texto</option>
          <option value="date">Data</option>
          <option value="select">Seleção</option>
          <option value="checkbox">Checkbox</option>
          <option value="number">Número</option>
          <option value="textarea">Área de Texto</option>
          <option value="file">Arquivo</option>
        </select>
      </div>
      <div className="col-span-3">
        <label className="flex items-center space-x-2">
          <Switch 
            checked={suggestRequired()}
            onCheckedChange={(checked) => {
              onUpdate({ ...field, required: checked });
            }}
          />
          <span className="text-sm">Obrigatório</span>
        </label>
      </div>
      <div className="col-span-1 flex justify-center">
        <button
          onClick={onRemove}
          className="text-destructive hover:text-destructive/80 transition-colors p-1.5 rounded-full hover:bg-destructive/10"
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
