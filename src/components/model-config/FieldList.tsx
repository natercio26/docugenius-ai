
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
        const fieldNameLower = field.name.toLowerCase();
        
        if (fieldNameLower.includes("viúv") || fieldNameLower.includes("viuv")) {
          category = "viúvo/viúva";
        } else if (fieldNameLower.includes("cônjuge") || fieldNameLower.includes("conjuge") || 
                  fieldNameLower.includes("casamento")) {
          category = "herdeiros/cônjuge/casamento";
        } else if (fieldNameLower.includes("filho") || fieldNameLower.includes("criança")) {
          category = "filhos";
        } else if (fieldNameLower.includes("advogad") || fieldNameLower.includes("oab")) {
          category = "advogado";
        } else if (fieldNameLower.includes("falecido") || fieldNameLower.includes("de cujus") || 
                  fieldNameLower.includes("autor da herança")) {
          category = "falecido";
        } else if (fieldNameLower.includes("qualificação") || fieldNameLower.includes("rg falecido") || 
                  fieldNameLower.includes("cpf falecido") || fieldNameLower.includes("profissão") ||
                  fieldNameLower.includes("nacionalidade")) {
          category = "qualificações do falecido";
        } else if (fieldNameLower.includes("regime de bens") || fieldNameLower.includes("data casamento")) {
          category = "do casamento";
        } else if (fieldNameLower.includes("data falecimento") || fieldNameLower.includes("certidão óbito") ||
                  fieldNameLower.includes("hospital") || fieldNameLower.includes("cidade falecimento")) {
          category = "do falecimento";
        } else if (fieldNameLower.includes("herdeiro") || fieldNameLower.includes("sucessor")) {
          category = "dos herdeiros";
        } else if (fieldNameLower.includes("inventariante") || fieldNameLower.includes("nomeação")) {
          category = "nomeação do inventariante";
        } else if (fieldNameLower.includes("imóvel") || fieldNameLower.includes("bem") || 
                  fieldNameLower.includes("apartamento") || fieldNameLower.includes("veículo") ||
                  fieldNameLower.includes("bloco") || fieldNameLower.includes("quadra")) {
          category = "bens";
        } else if (fieldNameLower.includes("partilha") || fieldNameLower.includes("quinhão") || 
                  fieldNameLower.includes("percentual") || fieldNameLower.includes("valor")) {
          category = "partilha";
        } else if (fieldNameLower.includes("certidão") || fieldNameLower.includes("receita") || 
                  fieldNameLower.includes("gdf") || fieldNameLower.includes("iptu")) {
          category = "certidões";
        } else if (fieldNameLower.includes("imposto") || fieldNameLower.includes("itcmd") || 
                  fieldNameLower.includes("tributo")) {
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
