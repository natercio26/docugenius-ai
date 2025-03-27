import React, { useEffect } from 'react';
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
    // For inventory documents, we need specific ordering
    if (documentType === "Inventário") {
      // Define the correct order of categories as specified
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
      
      // Group fields by categories
      const categorizedFields: Record<string, { name: string; type: string; required: boolean }[]> = {};
      
      fields.forEach(field => {
        // Determine which category this field belongs to
        let category = "outros";
        
        if (field.name.toLowerCase().includes("viúv") || field.name.toLowerCase().includes("viuv")) {
          category = "viúvo/viúva";
        } else if (field.name.toLowerCase().includes("cônjuge") || field.name.toLowerCase().includes("conjuge") || 
                  field.name.toLowerCase().includes("casamento")) {
          category = "herdeiros/cônjuge/casamento";
        } else if (field.name.toLowerCase().includes("filho") || field.name.toLowerCase().includes("criança")) {
          category = "filhos";
        } else if (field.name.toLowerCase().includes("advogad") || field.name.toLowerCase().includes("oab")) {
          category = "advogado";
        } else if (field.name.toLowerCase().includes("falecido") || field.name.toLowerCase().includes("de cujus") || 
                  field.name.toLowerCase().includes("autor da herança")) {
          category = "falecido";
        } else if (field.name.toLowerCase().includes("qualificação") || field.name.toLowerCase().includes("rg falecido") || 
                  field.name.toLowerCase().includes("cpf falecido")) {
          category = "qualificações do falecido";
        } else if (field.name.toLowerCase().includes("regime de bens") || field.name.toLowerCase().includes("data casamento")) {
          category = "do casamento";
        } else if (field.name.toLowerCase().includes("data falecimento") || field.name.toLowerCase().includes("certidão óbito")) {
          category = "do falecimento";
        } else if (field.name.toLowerCase().includes("herdeiro") || field.name.toLowerCase().includes("sucessor")) {
          category = "dos herdeiros";
        } else if (field.name.toLowerCase().includes("inventariante") || field.name.toLowerCase().includes("nomeação")) {
          category = "nomeação do inventariante";
        } else if (field.name.toLowerCase().includes("imóvel") || field.name.toLowerCase().includes("bem") || 
                  field.name.toLowerCase().includes("apartamento") || field.name.toLowerCase().includes("veículo")) {
          category = "bens";
        } else if (field.name.toLowerCase().includes("partilha") || field.name.toLowerCase().includes("quinhão") || 
                  field.name.toLowerCase().includes("percentual")) {
          category = "partilha";
        } else if (field.name.toLowerCase().includes("certidão") || field.name.toLowerCase().includes("receita") || 
                  field.name.toLowerCase().includes("gdf") || field.name.toLowerCase().includes("iptu")) {
          category = "certidões";
        } else if (field.name.toLowerCase().includes("imposto") || field.name.toLowerCase().includes("itcmd") || 
                  field.name.toLowerCase().includes("tributo")) {
          category = "imposto";
        }
        
        if (!categorizedFields[category]) {
          categorizedFields[category] = [];
        }
        
        categorizedFields[category].push(field);
      });
      
      // Recreate the field array in the correct order
      const orderedFields: { name: string; type: string; required: boolean }[] = [];
      
      orderedCategories.forEach(category => {
        if (categorizedFields[category]) {
          orderedFields.push(...categorizedFields[category]);
        }
      });
      
      // Add any remaining fields at the end
      Object.keys(categorizedFields).forEach(category => {
        if (!orderedCategories.includes(category)) {
          orderedFields.push(...categorizedFields[category]);
        }
      });
      
      return orderedFields;
    }
    
    // For other document types, keep original order
    return fields;
  };

  const displayedFields = organizeFields();

  useEffect(() => {
    // Provide feedback to user about field organization
    if (documentType === "Inventário" && fields.length > 0) {
      toast({
        title: `Campos organizados para ${documentType}`,
        description: `${fields.length} campos organizados na ordem especificada.`,
        duration: 3000,
      });
    }
  }, [documentType, fields.length, toast]);

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
