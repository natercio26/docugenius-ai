
import { DraftType } from '@/types';

interface ExtractedData {
  [key: string]: any;
}

// Regular expressions for identifying different types of entities
const personNamePattern = /(?:[A-Z][a-zÀ-ÿ]+\s)+(?:[A-Z][a-zÀ-ÿ]+)/g;
const documentNumberPattern = /(?:\d{3}\.){2}\d{3}-\d{2}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g;
const addressPattern = /(?:Rua|Avenida|Av\.|R\.|Alameda|Al\.|Travessa|Trav\.|Praça|Pç\.)\s.*?(?:,|\s-|\sn[º°]|\snº|\sn°|\sn)\s.*?(?:\d{5}-\d{3}|\d{8}|\d{2}\.\d{3}-\d{3}|$)/g;

// Specific role identifiers
const roleIdentifiers: Record<DraftType, Record<string, RegExp[]>> = {
  'Inventário': {
    falecido: [
      /falecido/i, /de cujus/i, /autor da herança/i, /inventariado/i, /espólio de/i
    ],
    herdeiro: [
      /herdeiro/i, /herdeira/i, /filho/i, /filha/i, /descendente/i, /neto/i, /neta/i
    ],
    cônjuge: [
      /cônjuge/i, /esposa/i, /esposo/i, /viúvo/i, /viúva/i, /casado com/i, /casada com/i
    ],
    inventariante: [
      /inventariante/i, /representante do espólio/i, /administrador do espólio/i
    ]
  },
  'Escritura de Compra e Venda': {
    vendedor: [
      /vendedor/i, /outorgante vendedor/i, /primeiro outorgante/i, /alienante/i
    ],
    comprador: [
      /comprador/i, /outorgado comprador/i, /segundo outorgante/i, /adquirente/i
    ]
  },
  'Doação': {
    doador: [
      /doador/i, /outorgante doador/i, /primeiro outorgante/i
    ],
    donatário: [
      /donatário/i, /outorgado donatário/i, /segundo outorgante/i, /beneficiário/i
    ]
  },
  'União Estável': {
    companheiro1: [
      /primeiro companheiro/i, /primeiro convivente/i, /primeiro declarante/i
    ],
    companheiro2: [
      /segundo companheiro/i, /segundo convivente/i, /segundo declarante/i
    ]
  },
  'Procuração': {
    outorgante: [
      /outorgante/i, /mandante/i, /constituinte/i, /poderdante/i
    ],
    outorgado: [
      /outorgado/i, /mandatário/i, /procurador/i, /constituído/i
    ]
  },
  'Testamento': {
    testador: [
      /testador/i, /testante/i, /autor do testamento/i
    ],
    herdeiro: [
      /herdeiro/i, /herdeira/i, /legatário/i, /legatária/i, /beneficiário/i
    ],
    testemunha: [
      /testemunha/i
    ]
  },
  'Contrato de Aluguel': {
    locador: [
      /locador/i, /proprietário/i, /senhorio/i
    ],
    locatário: [
      /locatário/i, /inquilino/i, /arrendatário/i
    ]
  },
  'Contrato Social': {
    empresa: [
      /razão social/i, /denominação social/i, /nome empresarial/i
    ],
    sócio: [
      /sócio/i, /sócia/i, /quotista/i
    ]
  },
  'Outro': {
    parte1: [
      /primeira parte/i, /primeiro interessado/i, /requerente/i
    ],
    parte2: [
      /segunda parte/i, /segundo interessado/i, /requerido/i
    ]
  }
};

// Helper to find names near role patterns
function findNamesInContext(content: string, rolePatterns: RegExp[], windowSize: number = 100): string[] {
  const foundNames: string[] = [];
  
  rolePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const matchIndex = match.index;
      const startContext = Math.max(0, matchIndex - windowSize);
      const endContext = Math.min(content.length, matchIndex + match[0].length + windowSize);
      
      const context = content.substring(startContext, endContext);
      const nameMatches = [...context.matchAll(personNamePattern)];
      
      nameMatches.forEach(nameMatch => {
        // Avoid detecting the role mention as a name
        if (nameMatch.index !== undefined && 
            (nameMatch.index < windowSize || nameMatch.index > windowSize + match[0].length)) {
          foundNames.push(nameMatch[0]);
        }
      });
    }
  });
  
  return [...new Set(foundNames)]; // Remove duplicates
}

// Main function to identify parties and their roles in the document
export async function identifyPartiesAndRoles(
  files: File[], 
  documentType: DraftType, 
  basicData: ExtractedData
): Promise<ExtractedData> {
  const enhancedData = { ...basicData };
  
  // Loop through each file to process content
  for (const file of files) {
    try {
      // Read file content as text (this is a simplified example)
      const fileContent = await readFileAsText(file);
      
      // Get role identifiers for the current document type
      const relevantRoles = roleIdentifiers[documentType] || {};
      
      // Process each role
      for (const [role, patterns] of Object.entries(relevantRoles)) {
        // Ensure patterns is an array of RegExp
        if (Array.isArray(patterns)) {
          const namesForRole = findNamesInContext(fileContent, patterns);
          
          if (namesForRole.length > 0) {
            // Assign found names to the appropriate field
            if (!enhancedData[role]) {
              enhancedData[role] = namesForRole.join(', ');
            } else if (!enhancedData[role].includes(namesForRole[0])) {
              // Append if not already included
              enhancedData[role] += ', ' + namesForRole.join(', ');
            }
          }
        }
      }
      
      // Additional specific processing based on document type
      switch (documentType) {
        case 'Inventário':
          // Look for heirs specifically
          if (!enhancedData['herdeiros'] && enhancedData['herdeiro']) {
            enhancedData['herdeiros'] = enhancedData['herdeiro'];
            delete enhancedData['herdeiro'];
          }
          break;
        
        case 'Escritura de Compra e Venda':
          // Ensure both parties are identified
          if (!enhancedData['Vendedor'] && enhancedData['vendedor']) {
            enhancedData['Vendedor'] = enhancedData['vendedor'];
          }
          if (!enhancedData['Comprador'] && enhancedData['comprador']) {
            enhancedData['Comprador'] = enhancedData['comprador'];
          }
          break;
          
        // Add specific processing for other document types as needed
      }
      
      // Find and add any additional entities not covered by roles
      const allNames = [...fileContent.matchAll(personNamePattern)].map(m => m[0]);
      const uniqueNames = [...new Set(allNames)];
      
      if (uniqueNames.length > 0 && !enhancedData['pessoas_identificadas']) {
        enhancedData['pessoas_identificadas'] = uniqueNames.join(', ');
      }
      
      // Add document numbers if found and not already present
      const documentNumbers = [...fileContent.matchAll(documentNumberPattern)].map(m => m[0]);
      if (documentNumbers.length > 0 && !enhancedData['documentos']) {
        enhancedData['documentos'] = documentNumbers.join(', ');
      }
      
      // Add addresses if found and not already present
      const addresses = [...fileContent.matchAll(addressPattern)].map(m => m[0]);
      if (addresses.length > 0 && !enhancedData['endereços']) {
        enhancedData['endereços'] = addresses.join('; ');
      }
      
    } catch (error) {
      console.error(`Erro ao processar o arquivo ${file.name}:`, error);
    }
  }
  
  return enhancedData;
}

// Helper function to read file content
async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
