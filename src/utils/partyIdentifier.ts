
import { DraftType } from '@/types';

interface ExtractedData {
  [key: string]: any;
  nome?: string;
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

// Helper to find names near role patterns with improved error handling
function findNamesInContext(content: string, rolePatterns: RegExp[], windowSize: number = 100): string[] {
  if (!content || typeof content !== 'string') {
    return [];
  }
  
  const foundNames: string[] = [];
  
  rolePatterns.forEach(pattern => {
    try {
      // Create a new RegExp instance to avoid lastIndex issues
      const patternCopy = new RegExp(pattern.source, pattern.flags);
      
      let match;
      while ((match = patternCopy.exec(content)) !== null) {
        const matchIndex = match.index;
        const startContext = Math.max(0, matchIndex - windowSize);
        const endContext = Math.min(content.length, matchIndex + match[0].length + windowSize);
        
        const context = content.substring(startContext, endContext);
        
        try {
          // Create a new regex for each iteration to avoid lastIndex issues
          const nameRegex = new RegExp(personNamePattern);
          let nameMatch;
          
          // Use a safer approach to find all matches
          const nameMatches: string[] = [];
          while ((nameMatch = nameRegex.exec(context)) !== null) {
            if (nameMatch.index !== undefined && 
                (nameMatch.index < windowSize || nameMatch.index > windowSize + match[0].length)) {
              nameMatches.push(nameMatch[0]);
            }
            
            // Prevent infinite loops
            if (nameMatch.index === nameRegex.lastIndex) {
              nameRegex.lastIndex++;
            }
          }
          
          // Add all found names
          nameMatches.forEach(name => foundNames.push(name));
        } catch (regexError) {
          console.warn("Error matching names in context:", regexError);
        }
        
        // Prevent infinite loops
        if (match.index === patternCopy.lastIndex) {
          patternCopy.lastIndex++;
        }
      }
    } catch (patternError) {
      console.warn("Error with role pattern:", patternError);
    }
  });
  
  // Remove duplicates and return
  return [...new Set(foundNames)];
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
    // Set an overall timeout for the entire identification process
    const startTime = Date.now();
    const maxProcessingTime = 30000; // 30 seconds maximum
    
    // Loop through each file to process content
    for (const file of files) {
      // Check if we've exceeded the total processing time
      if (Date.now() - startTime > maxProcessingTime) {
        console.warn('Tempo máximo de identificação excedido, usando dados básicos');
        break;
      }
      
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
              console.warn(`Error processing role ${role}:`, roleError);
            }
          }
        }
        
        // Ensure we at least have a 'nome' field
        if (!enhancedData.nome && Object.keys(enhancedData).length > 0) {
          // Use the first found name from any field
          for (const key of Object.keys(enhancedData)) {
            if (typeof enhancedData[key] === 'string' && enhancedData[key].match(/[A-Z][a-zÀ-ÿ]+/)) {
              enhancedData.nome = enhancedData[key].split(',')[0].trim();
              break;
            }
          }
        }
        
      } catch (fileError) {
        console.warn(`Erro ao processar o arquivo ${file.name}:`, fileError);
      }
    }
  } catch (error) {
    console.warn("Error in party identification process:", error);
  }
  
  // Make sure we return at least something
  if (Object.keys(enhancedData).length === 0) {
    enhancedData.nome = "Participante não identificado";
  }
  
  return enhancedData;
}

// Helper function to read file content with timeout
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
        console.warn("Error in FileReader:", error);
        resolve("");
      };
      
      // Set a timeout for the file reading process
      const timeoutId = setTimeout(() => {
        console.warn("File reading timed out");
        resolve("");
      }, 10000);
      
      reader.onloadend = () => {
        clearTimeout(timeoutId);
      };
      
      try {
        reader.readAsText(file);
      } catch (readError) {
        console.warn("Error calling readAsText:", readError);
        clearTimeout(timeoutId);
        resolve("");
      }
    } catch (error) {
      console.warn("Unexpected error in readFileAsText:", error);
      resolve("");
    }
  });
}
