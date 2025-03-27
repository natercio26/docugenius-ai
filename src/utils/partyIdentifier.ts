
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
  if (!content || typeof content !== 'string') {
    return [];
  }
  
  const foundNames: string[] = [];
  
  rolePatterns.forEach(pattern => {
    try {
      let match;
      pattern.lastIndex = 0; // Reset the regex lastIndex
      while ((match = pattern.exec(content)) !== null) {
        const matchIndex = match.index;
        const startContext = Math.max(0, matchIndex - windowSize);
        const endContext = Math.min(content.length, matchIndex + match[0].length + windowSize);
        
        const context = content.substring(startContext, endContext);
        
        try {
          // Create a new regex for each iteration to avoid lastIndex issues
          const nameRegex = new RegExp(personNamePattern);
          const nameMatches = [...context.matchAll(nameRegex)];
          
          nameMatches.forEach(nameMatch => {
            // Avoid detecting the role mention as a name
            if (nameMatch.index !== undefined && 
                (nameMatch.index < windowSize || nameMatch.index > windowSize + match[0].length)) {
              foundNames.push(nameMatch[0]);
            }
          });
        } catch (regexError) {
          console.error("Error matching names in context:", regexError);
        }
      }
    } catch (patternError) {
      console.error("Error with role pattern:", patternError);
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
  const enhancedData: ExtractedData = { ...basicData };
  
  // Validate inputs
  if (!files || !Array.isArray(files) || files.length === 0) {
    console.warn("No files provided for party identification");
    return enhancedData;
  }
  
  if (!documentType) {
    console.warn("No document type provided for party identification");
    return enhancedData;
  }
  
  try {
    // Loop through each file to process content
    for (const file of files) {
      try {
        if (!file) {
          console.warn("Invalid file found in array");
          continue;
        }
        
        // Read file content as text
        const fileContent = await readFileAsText(file);
        
        if (!fileContent) {
          console.warn(`No content extracted from file: ${file.name}`);
          continue;
        }
        
        // Get role identifiers for the current document type
        const relevantRoles = roleIdentifiers[documentType] || {};
        
        // Process each role
        for (const [role, patterns] of Object.entries(relevantRoles)) {
          // Ensure patterns is an array of RegExp
          if (Array.isArray(patterns)) {
            try {
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
            } catch (roleError) {
              console.error(`Error processing role ${role}:`, roleError);
            }
          }
        }
        
        // Additional specific processing based on document type
        try {
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
        } catch (docTypeError) {
          console.error("Error in document type specific processing:", docTypeError);
        }
        
        // Find and add any additional entities not covered by roles
        try {
          const nameRegex = new RegExp(personNamePattern, 'g');
          const allNames = [...fileContent.matchAll(nameRegex)].map(m => m[0]);
          const uniqueNames = [...new Set(allNames)];
          
          if (uniqueNames.length > 0 && !enhancedData['pessoas_identificadas']) {
            enhancedData['pessoas_identificadas'] = uniqueNames.join(', ');
          }
        } catch (namesError) {
          console.error("Error extracting names:", namesError);
        }
        
        // Add document numbers if found and not already present
        try {
          const docRegex = new RegExp(documentNumberPattern, 'g');
          const documentNumbers = [...fileContent.matchAll(docRegex)].map(m => m[0]);
          if (documentNumbers.length > 0 && !enhancedData['documentos']) {
            enhancedData['documentos'] = documentNumbers.join(', ');
          }
        } catch (docsError) {
          console.error("Error extracting document numbers:", docsError);
        }
        
        // Add addresses if found and not already present
        try {
          const addrRegex = new RegExp(addressPattern, 'g');
          const addresses = [...fileContent.matchAll(addrRegex)].map(m => m[0]);
          if (addresses.length > 0 && !enhancedData['endereços']) {
            enhancedData['endereços'] = addresses.join('; ');
          }
        } catch (addrError) {
          console.error("Error extracting addresses:", addrError);
        }
        
      } catch (fileError) {
        console.error(`Erro ao processar o arquivo ${file.name}:`, fileError);
      }
    }
  } catch (error) {
    console.error("Error in party identification process:", error);
  }
  
  return enhancedData;
}

// Helper function to read file content
async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result && typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          console.warn("FileReader did not return a string result");
          resolve("");
        }
      };
      reader.onerror = (error) => {
        console.error("Error in FileReader:", error);
        resolve("");
      };
      reader.readAsText(file);
    } catch (error) {
      console.error("Unexpected error in readFileAsText:", error);
      resolve("");
    }
  });
}
