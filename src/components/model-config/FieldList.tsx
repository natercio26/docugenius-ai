
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

  // Organize fields based on document type with enhanced categorization
  const organizeFields = () => {
    // For inventory documents, we need specific ordering with expanded categories
    if (documentType === "Inventário") {
      // Define the correct order of categories as specified
      const orderedCategories = [
        "qualificação do falecido",
        "dados do falecido",
        "viúvo/viúva",
        "qualificação do cônjuge",
        "dados do casamento",
        "regime de bens",
        "dados do falecimento",
        "certidão de óbito",
        "herdeiros",
        "qualificação dos herdeiros",
        "filhos",
        "inventariante",
        "advogado",
        "bens imóveis",
        "bens móveis",
        "veículos",
        "contas bancárias",
        "partilha",
        "monte mor",
        "meação",
        "quinhão dos herdeiros",
        "certidões e documentos",
        "certidão da receita federal",
        "certidão de IPTU",
        "certidões negativas",
        "guias e impostos",
        "ITCMD",
        "inscrições rurais",
        "CCIR",
        "NIRF",
        "códigos e identificadores",
        "assinaturas e procurações"
      ];
      
      // Categorize fields by type
      const categorizedFields: Record<string, { name: string; type: string; required: boolean }[]> = {};
      
      fields.forEach(field => {
        // Determine which category this field belongs to
        let category = "outros";
        const fieldNameLower = field.name.toLowerCase();
        
        // Enhanced categorization for falecido/de cujus
        if (fieldNameLower.includes("falecido") || fieldNameLower.includes("de cujus") || 
            fieldNameLower.includes("autor da herança") || fieldNameLower.includes("autor da heranca")) {
          category = "qualificação do falecido";
          
          if (fieldNameLower.includes("cpf") || fieldNameLower.includes("rg") || 
              fieldNameLower.includes("identidade") || fieldNameLower.includes("profissão") ||
              fieldNameLower.includes("nacionalidade") || fieldNameLower.includes("estado civil")) {
            category = "dados do falecido";
          }
        } 
        // Enhanced categorization for viúvo/cônjuge
        else if (fieldNameLower.includes("viúvo") || fieldNameLower.includes("viuva") || 
                fieldNameLower.includes("viuvo") || fieldNameLower.includes("meeiro") || 
                fieldNameLower.includes("meeira")) {
          category = "viúvo/viúva";
        }
        else if (fieldNameLower.includes("cônjuge") || fieldNameLower.includes("conjuge") || 
                fieldNameLower.includes("esposo") || fieldNameLower.includes("esposa")) {
          category = "qualificação do cônjuge";
        } 
        // Enhanced categorization for casamento
        else if (fieldNameLower.includes("casamento") || fieldNameLower.includes("matrimônio") || 
                fieldNameLower.includes("matrimonio")) {
          category = "dados do casamento";
        }
        else if (fieldNameLower.includes("regime") || fieldNameLower.includes("comunhão") || 
                fieldNameLower.includes("comunhao") || fieldNameLower.includes("separação") || 
                fieldNameLower.includes("separacao") || fieldNameLower.includes("aquestos")) {
          category = "regime de bens";
        } 
        // Enhanced categorization for filhos/herdeiros
        else if (fieldNameLower.includes("filho") || fieldNameLower.includes("criança") || 
                fieldNameLower.includes("crianca")) {
          category = "filhos";
        }
        else if (fieldNameLower.includes("herdeiro") || fieldNameLower.includes("sucessor")) {
          category = "herdeiros";
          
          if (fieldNameLower.includes("qualificação") || fieldNameLower.includes("qualificacao") || 
              fieldNameLower.includes("cpf") || fieldNameLower.includes("rg")) {
            category = "qualificação dos herdeiros";
          }
        } 
        // Enhanced categorization for advogado
        else if (fieldNameLower.includes("advogad") || fieldNameLower.includes("oab")) {
          category = "advogado";
        } 
        // Enhanced categorization for inventariante
        else if (fieldNameLower.includes("inventariante") || fieldNameLower.includes("nomeação") || 
                fieldNameLower.includes("nomeacao")) {
          category = "inventariante";
        } 
        // Enhanced categorization for falecimento
        else if (fieldNameLower.includes("falecimento") || fieldNameLower.includes("óbito") || 
                fieldNameLower.includes("obito") || fieldNameLower.includes("hospital") || 
                fieldNameLower.includes("cidade falecimento") || fieldNameLower.includes("local falecimento")) {
          category = "dados do falecimento";
        }
        else if (fieldNameLower.includes("certidão") && fieldNameLower.includes("óbito") || 
                fieldNameLower.includes("certidao") && fieldNameLower.includes("obito")) {
          category = "certidão de óbito";
        } 
        // Enhanced categorization for bens
        else if (fieldNameLower.includes("bem") || fieldNameLower.includes("bens")) {
          category = "bens móveis";
          
          if (fieldNameLower.includes("imóvel") || fieldNameLower.includes("imovel") || 
              fieldNameLower.includes("apartamento") || fieldNameLower.includes("casa") || 
              fieldNameLower.includes("terreno") || fieldNameLower.includes("lote") || 
              fieldNameLower.includes("bloco") || fieldNameLower.includes("quadra")) {
            category = "bens imóveis";
          }
        } 
        // Enhanced categorization for veículos
        else if (fieldNameLower.includes("veículo") || fieldNameLower.includes("veiculo") || 
                fieldNameLower.includes("carro") || fieldNameLower.includes("automóvel") || 
                fieldNameLower.includes("automovel") || fieldNameLower.includes("placa") || 
                fieldNameLower.includes("chassi") || fieldNameLower.includes("renavam")) {
          category = "veículos";
        } 
        // Enhanced categorization for contas bancárias
        else if (fieldNameLower.includes("conta") || fieldNameLower.includes("banco") || 
                fieldNameLower.includes("agência") || fieldNameLower.includes("agencia") || 
                fieldNameLower.includes("poupança") || fieldNameLower.includes("poupanca") || 
                fieldNameLower.includes("corrente")) {
          category = "contas bancárias";
        } 
        // Enhanced categorization for partilha/monte-mor
        else if (fieldNameLower.includes("partilha") || fieldNameLower.includes("quinhão") || 
                fieldNameLower.includes("quinhao") || fieldNameLower.includes("percentual") || 
                fieldNameLower.includes("valor herdeiro")) {
          category = "partilha";
        }
        else if (fieldNameLower.includes("monte") || fieldNameLower.includes("mor") || 
                fieldNameLower.includes("total")) {
          category = "monte mor";
        }
        else if (fieldNameLower.includes("meação") || fieldNameLower.includes("meacao") || 
                fieldNameLower.includes("metade")) {
          category = "meação";
        }
        else if (fieldNameLower.includes("quinhão") || fieldNameLower.includes("quinhao") || 
                fieldNameLower.includes("percentual") || fieldNameLower.includes("porcentagem")) {
          category = "quinhão dos herdeiros";
        } 
        // Enhanced categorization for certidões
        else if ((fieldNameLower.includes("certidão") || fieldNameLower.includes("certidao")) && 
                (fieldNameLower.includes("receita") || fieldNameLower.includes("federal") || 
                 fieldNameLower.includes("cpf") || fieldNameLower.includes("cnpj"))) {
          category = "certidão da receita federal";
        }
        else if ((fieldNameLower.includes("certidão") || fieldNameLower.includes("certidao")) && 
                (fieldNameLower.includes("iptu") || fieldNameLower.includes("predial"))) {
          category = "certidão de IPTU";
        }
        else if (fieldNameLower.includes("certidão") || fieldNameLower.includes("certidao") || 
                fieldNameLower.includes("gdf") || fieldNameLower.includes("cnd")) {
          category = "certidões e documentos";
        } 
        // Enhanced categorization for impostos
        else if (fieldNameLower.includes("imposto") || fieldNameLower.includes("tributo") || 
                fieldNameLower.includes("guia")) {
          category = "guias e impostos";
        }
        else if (fieldNameLower.includes("itcmd") || fieldNameLower.includes("itcd") || 
                fieldNameLower.includes("causa mortis")) {
          category = "ITCMD";
        } 
        // Enhanced categorization for rural properties
        else if (fieldNameLower.includes("rural") || fieldNameLower.includes("fazenda") || 
                fieldNameLower.includes("sítio") || fieldNameLower.includes("sitio") || 
                fieldNameLower.includes("chácara") || fieldNameLower.includes("chacara")) {
          category = "inscrições rurais";
        }
        else if (fieldNameLower.includes("ccir")) {
          category = "CCIR";
        }
        else if (fieldNameLower.includes("nirf")) {
          category = "NIRF";
        } 
        // Enhanced categorization for identifier codes
        else if (fieldNameLower.includes("código") || fieldNameLower.includes("codigo") || 
                fieldNameLower.includes("hash") || fieldNameLower.includes("identificador")) {
          category = "códigos e identificadores";
        } 
        // Enhanced categorization for signatures and procurations
        else if (fieldNameLower.includes("assinatura") || fieldNameLower.includes("procuração") || 
                fieldNameLower.includes("procuracao") || fieldNameLower.includes("representação") || 
                fieldNameLower.includes("representacao")) {
          category = "assinaturas e procurações";
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
    if (documentType === "Inventário" && fields.length > 5) {
      toast({
        title: `Campos organizados para ${documentType}`,
        description: `${fields.length} campos organizados em categorias específicas para Inventário.`,
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
