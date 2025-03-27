
import { DraftType } from '@/types';

interface ExtractedData {
  [key: string]: any;
  nome?: string;
}

// Simplified regex patterns for better performance
const personNamePattern = /(?:[A-Z][a-zÀ-ÿ]{1,20}\s){1,3}(?:[A-Z][a-zÀ-ÿ]{1,20})/g;

// Specific role identifiers - using a smaller subset for better performance
const roleIdentifiers: Record<DraftType, Record<string, RegExp[]>> = {
  'Inventário': {
    falecido: [/falecido/i, /de cujus/i],
    herdeiro: [/herdeiro/i, /herdeira/i],
    inventariante: [/inventariante/i]
  },
  'Escritura de Compra e Venda': {
    vendedor: [/vendedor/i, /outorgante vendedor/i],
    comprador: [/comprador/i, /outorgado comprador/i]
  },
  'Doação': {
    doador: [/doador/i],
    donatário: [/donatário/i]
  },
  'União Estável': {
    companheiro1: [/primeiro companheiro/i],
    companheiro2: [/segundo companheiro/i]
  },
  'Procuração': {
    outorgante: [/outorgante/i],
    outorgado: [/outorgado/i, /procurador/i]
  },
  'Testamento': {
    testador: [/testador/i],
    herdeiro: [/herdeiro/i, /legatário/i]
  },
  'Outro': {
    parte1: [/primeira parte/i],
    parte2: [/segunda parte/i]
  }
};

// Helper to find names near role patterns - optimized with performance restrictions
function findNamesInContext(content: string, rolePatterns: RegExp[], windowSize: number = 50): string[] {
  if (!content || typeof content !== 'string') {
    return [];
  }
  
  // Performance optimization - limit content size
  const maxContentLength = 20000; // Only analyze first 20K characters
  const trimmedContent = content.substring(0, maxContentLength);
  
  const foundNames: string[] = [];
  
  // Time limit for pattern matching - prevent runaway regex
  const startTime = Date.now();
  const maxProcessingTime = 1000; // 1 second maximum per pattern group
  
  for (let i = 0; i < Math.min(rolePatterns.length, 3); i++) {
    // Check if we've exceeded the time limit
    if (Date.now() - startTime > maxProcessingTime) {
      console.warn('Tempo limite excedido para análise de padrões de papel');
      break;
    }
    
    const pattern = rolePatterns[i];
    
    try {
      // Find only the first match for this pattern to improve performance
      const match = pattern.exec(trimmedContent);
      if (!match) continue;
      
      const matchIndex = match.index;
      const startContext = Math.max(0, matchIndex - windowSize);
      const endContext = Math.min(trimmedContent.length, matchIndex + match[0].length + windowSize);
      
      const context = trimmedContent.substring(startContext, endContext);
      
      // Find only up to 2 names in this context for better performance
      const nameRegex = new RegExp(personNamePattern);
      const nameMatches = [];
      let nameMatch;
      let matchCount = 0;
      
      while ((nameMatch = nameRegex.exec(context)) !== null && matchCount < 2) {
        nameMatches.push(nameMatch[0]);
        matchCount++;
        
        // Prevent infinite loops
        if (nameMatch.index === nameRegex.lastIndex) {
          nameRegex.lastIndex++;
        }
      }
      
      // Add found names
      nameMatches.forEach(name => foundNames.push(name));
    } catch (patternError) {
      console.warn("Error with role pattern:", patternError);
    }
  }
  
  // Take only first 3 unique names maximum
  return [...new Set(foundNames)].slice(0, 3);
}

// Main function to identify parties and their roles - optimized for performance
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
    const maxProcessingTime = 10000; // Reduced to 10 seconds maximum
    
    // Process only first file for role identification to improve performance
    const file = files[0];
    
    try {
      if (!file) {
        console.warn("Invalid file found");
        return enhancedData;
      }
      
      // Read file content as text
      const fileContent = await readFileAsText(file);
      
      if (!fileContent) {
        console.warn(`No content extracted from file: ${file.name}`);
        return enhancedData;
      }
      
      // Get role identifiers for the current document type
      const relevantRoles = roleIdentifiers[documentType] || {};
      
      // Process only the 3 most important roles to improve performance
      const importantRoles = Object.entries(relevantRoles).slice(0, 3);
      
      // Process each important role
      for (const [role, patterns] of importantRoles) {
        // Check if we've exceeded the total processing time
        if (Date.now() - startTime > maxProcessingTime) {
          console.warn('Tempo máximo de identificação excedido, usando dados básicos');
          break;
        }
        
        // Ensure patterns is an array of RegExp
        if (Array.isArray(patterns)) {
          try {
            const namesForRole = findNamesInContext(fileContent, patterns);
            
            if (namesForRole.length > 0) {
              // Take only the first name found for this role
              enhancedData[role] = namesForRole[0];
            }
          } catch (roleError) {
            console.warn(`Error processing role ${role}:`, roleError);
          }
        }
        
        // Small pause between roles to prevent UI freezing
        await new Promise(resolve => setTimeout(resolve, 10));
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
          // Limit the amount of text returned to improve performance
          resolve(reader.result.substring(0, 30000)); // Only return first 30K chars
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
      }, 5000); // Reduced timeout
      
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
