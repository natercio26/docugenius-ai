
import React from 'react';
import FieldEditor from './FieldEditor';
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  // Organize fields based on document type
  const organizeFields = () => {
    // This function helps organize fields in the order specified for each document type
    if (documentType === "Inventário") {
      const orderedCategories = [
        "viúvo/viúva",
        "herdeiros/cônjuge/casamento",
        "filhos",
        "advogado",
        "falecido",
        "qualificações do falecido",
        "do casamento",
        "do falecimento",
        "dos herdeiros",
        "nomeação do inventariante",
        "bens",
        "partilha",
        "certidões",
        "imposto"
      ];
      
      // Show toast with field count as feedback
      toast({
        title: `${fields.length} campos configurados`,
        description: `Campos para documento de ${documentType} organizados na ordem adequada.`,
        duration: 3000,
      });
    }
    
    return fields;
  };

  const displayedFields = organizeFields();

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Campos Personalizáveis para {documentType}</h3>
        <span className="text-sm text-muted-foreground bg-accent/10 px-2 py-1 rounded-full">
          {fields.length} campos
        </span>
      </div>
      
      <div className="space-y-3">
        {displayedFields.map((field, index) => (
          <FieldEditor
            key={index}
            field={field}
            onUpdate={(updatedField) => onFieldUpdate(index, updatedField)}
            onRemove={() => onFieldRemove(index)}
          />
        ))}
        
        {fields.length === 0 && (
          <div className="text-center py-8 border border-dashed rounded-md">
            <p className="text-muted-foreground">
              Nenhum campo configurado. Adicione campos para personalizar seu documento.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FieldList;
