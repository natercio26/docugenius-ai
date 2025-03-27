
import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';
import { DraftType } from '@/types';

const draftTypes: DraftType[] = [
  'Inventário',
  'Escritura de Compra e Venda',
  'Doação',
  'União Estável',
  'Procuração',
  'Testamento',
  'Outro'
];

// Mock fields for different document types
const fieldsByType: Record<DraftType, { name: string, type: string, required: boolean }[]> = {
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

const ModelConfig: React.FC = () => {
  const [selectedType, setSelectedType] = useState<DraftType>('Escritura de Compra e Venda');
  const [configFields, setConfigFields] = useState<Record<DraftType, { name: string, type: string, required: boolean }[]>>(fieldsByType);
  const { toast } = useToast();

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
    // Here you would typically save the configuration to a database
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
          <div className="mb-6">
            <label htmlFor="documentType" className="block text-sm font-medium mb-2">
              Tipo de Documento
            </label>
            <select
              id="documentType"
              value={selectedType}
              onChange={handleTypeChange}
              className="input-field"
            >
              {draftTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">Campos Personalizáveis para {selectedType}</h3>
            <div className="space-y-4">
              {currentFields.map((field, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-5">
                    <input
                      type="text"
                      value={field.name}
                      onChange={(e) => {
                        updateField(index, { ...field, name: e.target.value });
                      }}
                      className="input-field"
                      placeholder="Nome do campo"
                    />
                  </div>
                  <div className="col-span-3">
                    <select
                      value={field.type}
                      onChange={(e) => {
                        updateField(index, { ...field, type: e.target.value });
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
                          updateField(index, { ...field, required: e.target.checked });
                        }}
                        className="rounded border-input h-4 w-4 text-accent focus:ring-accent"
                      />
                      <span className="text-sm">Obrigatório</span>
                    </label>
                  </div>
                  <div className="col-span-1">
                    <button
                      onClick={() => removeField(index)}
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
              ))}
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={addField}
              className="button-outline"
            >
              Adicionar Campo
            </button>
            <button
              onClick={handleSave}
              className="button-primary"
            >
              Salvar Configurações
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ModelConfig;
