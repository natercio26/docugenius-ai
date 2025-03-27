
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';
import { DraftType } from '@/types';
import TypeSelector from '@/components/model-config/TypeSelector';
import FieldList from '@/components/model-config/FieldList';
import ActionButtons from '@/components/model-config/ActionButtons';

const defaultDraftTypes: DraftType[] = [
  'Inventário',
  'Escritura de Compra e Venda',
  'Doação',
  'União Estável',
  'Procuração',
  'Testamento',
  'Outro'
];

// Default fields for different document types
const defaultFieldsByType: Record<DraftType, { name: string, type: string, required: boolean }[]> = {
  'Inventário': [
    { name: 'Nome do Autor da Herança', type: 'text', required: true },
    { name: 'Data do Falecimento', type: 'date', required: true },
    { name: 'Existência de Testamento', type: 'checkbox', required: true },
    { name: 'Regime de Bens', type: 'select', required: true },
  ],
  'Escritura de Compra e Venda': [
    { name: 'Vendedor', type: 'text', required: true },
    { name: 'Comprador', type: 'text', required: true },
    { name: 'Valor do Imóvel', type: 'text', required: true },
    { name: 'Descrição do Imóvel', type: 'text', required: true },
  ],
  'Doação': [
    { name: 'Doador', type: 'text', required: true },
    { name: 'Donatário', type: 'text', required: true },
    { name: 'Bem Doado', type: 'text', required: true },
    { name: 'Valor do Bem', type: 'text', required: false },
  ],
  'União Estável': [
    { name: 'Nome do Primeiro Companheiro', type: 'text', required: true },
    { name: 'Nome do Segundo Companheiro', type: 'text', required: true },
    { name: 'Data de Início da União', type: 'date', required: true },
    { name: 'Regime de Bens', type: 'select', required: true },
  ],
  'Procuração': [
    { name: 'Outorgante', type: 'text', required: true },
    { name: 'Outorgado', type: 'text', required: true },
    { name: 'Poderes', type: 'text', required: true },
    { name: 'Prazo de Validade', type: 'date', required: false },
  ],
  'Testamento': [
    { name: 'Testador', type: 'text', required: true },
    { name: 'Herdeiros', type: 'text', required: true },
    { name: 'Legados', type: 'text', required: false },
    { name: 'Testemunhas', type: 'text', required: true },
  ],
  'Outro': [
    { name: 'Título do Documento', type: 'text', required: true },
    { name: 'Partes Envolvidas', type: 'text', required: true },
    { name: 'Objeto', type: 'text', required: true },
  ],
};

const STORAGE_KEY = 'modelConfigFields';

const ModelConfig: React.FC = () => {
  const [selectedType, setSelectedType] = useState<DraftType>('Escritura de Compra e Venda');
  const [configFields, setConfigFields] = useState<Record<DraftType, { name: string, type: string, required: boolean }[]>>(defaultFieldsByType);
  const [draftTypes, setDraftTypes] = useState<DraftType[]>(defaultDraftTypes);
  const { toast } = useToast();
  
  // Load saved configurations from localStorage when component mounts
  useEffect(() => {
    const savedConfig = localStorage.getItem(STORAGE_KEY);
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfigFields(parsedConfig);
      } catch (error) {
        console.error("Error parsing saved configuration:", error);
        // Use default if there's an error parsing saved config
        setConfigFields(defaultFieldsByType);
      }
    }
  }, []);

  // Get the current fields for the selected type
  const currentFields = configFields[selectedType];

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as DraftType;
    setSelectedType(type);
  };

  const updateField = (index: number, field: { name: string, type: string, required: boolean }) => {
    const newConfigFields = { ...configFields };
    newConfigFields[selectedType][index] = field;
    setConfigFields(newConfigFields);
  };

  const addField = () => {
    const newConfigFields = { ...configFields };
    newConfigFields[selectedType] = [...newConfigFields[selectedType], { name: 'Novo Campo', type: 'text', required: false }];
    setConfigFields(newConfigFields);
  };

  const removeField = (index: number) => {
    const newConfigFields = { ...configFields };
    newConfigFields[selectedType] = newConfigFields[selectedType].filter((_, i) => i !== index);
    setConfigFields(newConfigFields);
  };

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configFields));
    
    // Show success toast
    toast({
      title: "Configurações salvas",
      description: `As configurações do modelo ${selectedType} foram salvas com sucesso.`
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="page-container">
        <div className="max-w-3xl mx-auto mb-12 animate-slide-in">
          <h1 className="heading-1 mb-4">Configuração de Modelo</h1>
          <p className="text-muted-foreground">
            Personalize os modelos de minutas de acordo com suas necessidades.
          </p>
        </div>
        
        <div className="glass rounded-lg p-8 max-w-3xl mx-auto animate-scale-in" style={{ animationDelay: '100ms' }}>
          <TypeSelector 
            selectedType={selectedType} 
            onTypeChange={handleTypeChange}
            draftTypes={draftTypes}
          />
          
          <FieldList 
            fields={currentFields}
            documentType={selectedType}
            onFieldUpdate={updateField}
            onFieldRemove={removeField}
          />
          
          <ActionButtons 
            onAddField={addField}
            onSave={handleSave}
          />
        </div>
      </main>
    </div>
  );
};

export default ModelConfig;
