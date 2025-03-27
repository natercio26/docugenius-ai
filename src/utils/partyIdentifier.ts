import { DraftType } from '@/types';

interface ExtractedData {
  [key: string]: any;
  nome?: string;
}

// Enhanced regex patterns for better information extraction
const personNamePattern = /(?:[A-Z][a-zÀ-ÿ]{1,20}\s){1,3}(?:[A-Z][a-zÀ-ÿ]{1,20})/g;
const datePattern = /(\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}\s+de\s+[a-zÀ-ÿ]+\s+de\s+\d{4})/gi;
const documentNumberPattern = /(?:CPF|CNPJ|RG)[\s.:]*(\d[\d\.\-\/]+)/gi;
const addressPattern = /(?:residente|domiciliado|endereço)[^\n,;]+((?:[A-Z][a-zÀ-ÿ]+[\s,]*)+(?:\d+)?[^\n;]*)/gi;

// Specific role identifiers with improved patterns
const roleIdentifiers: Record<DraftType, Record<string, RegExp[]>> = {
  'Inventário': {
    falecido: [/falecido/i, /de cujus/i, /autor[a]? da herança/i, /espólio de/i],
    herdeiro1: [/herdeiro/i, /herdeira/i, /sucessor/i, /filho/i, /filha/i],
    herdeiro2: [/segundo[a]? herdeiro/i, /outro[a]? herdeiro/i],
    herdeiro3: [/terceir[o|a] herdeiro/i],
    inventariante: [/inventariante/i, /responsável pelo espólio/i],
    conjuge: [/cônjuge/i, /viúv[o|a]/i, /esposa/i, /esposo/i, /viúv[o|a]-meeiro[a]/i],
    advogado: [/advogad[o|a]/i, /representante legal/i, /OAB/i]
  },
  // ... keep existing code for other document types
};

// Helper to find names near role patterns - enhanced to extract more context
function findNamesInContext(content: string, rolePatterns: RegExp[], windowSize: number = 100): string[] {
  if (!content || typeof content !== 'string') {
    return [];
  }
  
  // Performance optimization - analyze larger content
  const maxContentLength = 50000; // Increased to 50K characters
  const trimmedContent = content.substring(0, maxContentLength);
  
  const foundNames: string[] = [];
  
  // Increased time limit for better extraction
  const startTime = Date.now();
  const maxProcessingTime = 2000; // 2 seconds maximum per pattern group
  
  for (let i = 0; i < Math.min(rolePatterns.length, 5); i++) { // Increased to 5 patterns
    // Check if we've exceeded the time limit
    if (Date.now() - startTime > maxProcessingTime) {
      console.warn('Tempo limite excedido para análise de padrões de papel');
      break;
    }
    
    const pattern = rolePatterns[i];
    
    try {
      // Find multiple matches for this pattern
      let match;
      let matchCount = 0;
      const re = new RegExp(pattern);
      
      while ((match = re.exec(trimmedContent)) !== null && matchCount < 3) { // Increased to 3 matches
        const matchIndex = match.index;
        const startContext = Math.max(0, matchIndex - windowSize);
        const endContext = Math.min(trimmedContent.length, matchIndex + match[0].length + windowSize);
        
        const context = trimmedContent.substring(startContext, endContext);
        
        // Find names in this context
        const nameRegex = new RegExp(personNamePattern);
        let nameMatch;
        let nameMatchCount = 0;
        
        while ((nameMatch = nameRegex.exec(context)) !== null && nameMatchCount < 3) { // Increased to 3 names
          foundNames.push(nameMatch[0]);
          nameMatchCount++;
          
          // Prevent infinite loops
          if (nameMatch.index === nameRegex.lastIndex) {
            nameRegex.lastIndex++;
          }
        }
        
        matchCount++;
        
        // Prevent infinite loops
        if (match.index === re.lastIndex) {
          re.lastIndex++;
        }
      }
    } catch (patternError) {
      console.warn("Error with role pattern:", patternError);
    }
  }
  
  // Take only first 5 unique names maximum
  return [...new Set(foundNames)].slice(0, 5); // Increased to 5 names
}

// Extract dates from context
function findDatesInContext(content: string, contextPattern: RegExp, windowSize: number = 100): string {
  if (!content || typeof content !== 'string') {
    return '';
  }
  
  try {
    const match = contextPattern.exec(content);
    if (!match) return '';
    
    const matchIndex = match.index;
    const startContext = Math.max(0, matchIndex - windowSize);
    const endContext = Math.min(content.length, matchIndex + match[0].length + windowSize);
    
    const context = content.substring(startContext, endContext);
    
    const dateRegex = new RegExp(datePattern);
    const dateMatch = dateRegex.exec(context);
    
    return dateMatch ? dateMatch[0] : '';
  } catch (error) {
    console.warn("Error extracting date:", error);
    return '';
  }
}

// Extract addresses from context
function findAddressInContext(content: string, contextPattern: RegExp, windowSize: number = 150): string {
  if (!content || typeof content !== 'string') {
    return '';
  }
  
  try {
    const match = contextPattern.exec(content);
    if (!match) return '';
    
    const matchIndex = match.index;
    const startContext = Math.max(0, matchIndex - windowSize);
    const endContext = Math.min(content.length, matchIndex + match[0].length + windowSize * 2);
    
    const context = content.substring(startContext, endContext);
    
    const addressRegex = new RegExp(addressPattern);
    const addressMatch = addressRegex.exec(context);
    
    return addressMatch && addressMatch[1] ? addressMatch[1].trim() : '';
  } catch (error) {
    console.warn("Error extracting address:", error);
    return '';
  }
}

// Main function to identify parties and their roles - optimized for better extraction
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
    const maxProcessingTime = 15000; // Increased to 15 seconds maximum
    
    // Process all files for better data extraction
    for (const file of files) {
      try {
        if (!file) {
          console.warn("Invalid file found");
          continue;
        }
        
        // Check if we've exceeded the total processing time
        if (Date.now() - startTime > maxProcessingTime) {
          console.warn('Tempo máximo de identificação excedido, usando dados parciais');
          break;
        }
        
        // Read file content as text
        const fileContent = await readFileAsText(file);
        
        if (!fileContent) {
          console.warn(`No content extracted from file: ${file.name}`);
          continue;
        }
        
        console.log(`Analyzing content from ${file.name}, length: ${fileContent.length}`);
        
        // Get role identifiers for the current document type
        const relevantRoles = roleIdentifiers[documentType] || {};
        
        // Process each role
        for (const [role, patterns] of Object.entries(relevantRoles)) {
          // Check if we've exceeded the total processing time
          if (Date.now() - startTime > maxProcessingTime) {
            console.warn('Tempo máximo de identificação excedido, usando dados parciais');
            break;
          }
          
          // Ensure patterns is an array of RegExp
          if (Array.isArray(patterns)) {
            try {
              const namesForRole = findNamesInContext(fileContent, patterns);
              
              if (namesForRole.length > 0) {
                // If we already have this role but with placeholder data, update it
                if (!enhancedData[role] || 
                    enhancedData[role] === 'N/A' || 
                    enhancedData[role] === '=====' || 
                    enhancedData[role] === 'Não identificado') {
                  enhancedData[role] = namesForRole[0];
                }
                
                // For herdeiros, handle multiple entries
                if (role === 'herdeiro1' && namesForRole.length > 1 && !enhancedData['herdeiro2']) {
                  enhancedData['herdeiro2'] = namesForRole[1];
                }
                if (role === 'herdeiro1' && namesForRole.length > 2 && !enhancedData['herdeiro3']) {
                  enhancedData['herdeiro3'] = namesForRole[2];
                }
              }
              
              // For specific roles, try to extract additional information
              if (role === 'falecido' && enhancedData[role]) {
                // Try to extract death date
                const deathDatePattern = /faleceu|óbito|data do falecimento/i;
                const deathDate = findDatesInContext(fileContent, deathDatePattern);
                if (deathDate && !enhancedData['dataFalecimento']) {
                  enhancedData['dataFalecimento'] = deathDate;
                }
              } else if (role === 'conjuge' && enhancedData[role]) {
                // Try to extract marriage date
                const marriageDatePattern = /casad[o|a]|casamento|matrimônio/i;
                const marriageDate = findDatesInContext(fileContent, marriageDatePattern);
                if (marriageDate && !enhancedData['dataCasamento']) {
                  enhancedData['dataCasamento'] = marriageDate;
                }
                
                // Try to extract regime de bens
                if (!enhancedData['regimeBens']) {
                  const regimePattern = /regime\s+de\s+(?:bens)?\s*(?:d[eo])?\s*([a-zÀ-ÿ\s]+)(?:de bens)?/i;
                  const match = regimePattern.exec(fileContent);
                  if (match && match[1]) {
                    enhancedData['regimeBens'] = match[1].trim();
                  }
                }
              }
            } catch (roleError) {
              console.warn(`Error processing role ${role}:`, roleError);
            }
          }
          
          // Small pause between roles to prevent UI freezing
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        // Try to extract real estate information
        if (documentType === 'Inventário') {
          const apartmentPattern = /apartamento|imóvel|apartamento n[º°]/i;
          const match = apartmentPattern.exec(fileContent);
          if (match) {
            const apartmentContext = fileContent.substring(Math.max(0, match.index - 100), 
                                                          Math.min(fileContent.length, match.index + 300));
            
            // Extract apartment number
            const numberPattern = /(?:apartamento|apt|ap)[\s.]*(?:n[º°]?\.?)?[\s.]*(\d+)/i;
            const numberMatch = numberPattern.exec(apartmentContext);
            if (numberMatch && numberMatch[1] && !enhancedData['numeroApartamento']) {
              enhancedData['numeroApartamento'] = numberMatch[1];
            }
            
            // Extract block
            const blockPattern = /(?:bloco|bl)[\s.]*["']?([A-Z0-9]+)["']?/i;
            const blockMatch = blockPattern.exec(apartmentContext);
            if (blockMatch && blockMatch[1] && !enhancedData['blocoApartamento']) {
              enhancedData['blocoApartamento'] = blockMatch[1];
            }
            
            // Extract address/quadra
            const quadraPattern = /(?:quadra|sqn|sqs|qn|qs|qi|qd)[\s.]*(\d+)/i;
            const quadraMatch = quadraPattern.exec(apartmentContext);
            if (quadraMatch && quadraMatch[1] && !enhancedData['quadraApartamento']) {
              const fullAddressPattern = new RegExp(`(?:${quadraMatch[1]}[^.;,]*)[\\s,]*(?:Brasília|DF)`, 'i');
              const fullAddressMatch = fullAddressPattern.exec(apartmentContext);
              
              if (fullAddressMatch) {
                enhancedData['quadraApartamento'] = fullAddressMatch[0];
              } else {
                enhancedData['quadraApartamento'] = `Quadra ${quadraMatch[1]}`;
              }
            }
          }
          
          // Try to extract registration numbers
          const matriculaPattern = /matrícula[\s.]*(?:n[º°]?\.?)?[\s.]*(\d[\d\.\-\/]+)/i;
          const matriculaMatch = matriculaPattern.exec(fileContent);
          if (matriculaMatch && matriculaMatch[1] && !enhancedData['matriculaImovel']) {
            enhancedData['matriculaImovel'] = matriculaMatch[1];
          }
          
          // Try to extract children count
          if (!enhancedData['numeroFilhos']) {
            const filhosPattern = /(\d+)[\s]*filhos?/i;
            const filhosMatch = filhosPattern.exec(fileContent);
            if (filhosMatch && filhosMatch[1]) {
              enhancedData['numeroFilhos'] = filhosMatch[1];
            } else if (enhancedData['herdeiro1']) {
              // Count how many herdeiros we found
              let herdeirosCount = 1;
              if (enhancedData['herdeiro2']) herdeirosCount++;
              if (enhancedData['herdeiro3']) herdeirosCount++;
              if (enhancedData['herdeiro4']) herdeirosCount++;
              if (enhancedData['herdeiro5']) herdeirosCount++;
              enhancedData['numeroFilhos'] = String(herdeirosCount);
            }
          }
          
          // Try to extract ITCMD information
          if (!enhancedData['numeroITCMD']) {
            const itcmdPattern = /ITCMD[\s.]*(?:n[º°]?\.?)?[\s.]*(\d[\d\.\-\/]+)/i;
            const itcmdMatch = itcmdPattern.exec(fileContent);
            if (itcmdMatch && itcmdMatch[1]) {
              enhancedData['numeroITCMD'] = itcmdMatch[1];
            }
          }
          
          // Try to extract value information
          if (!enhancedData['valorTotalBens']) {
            const valorPattern = /(?:R\$|valor)[\s.]*([0-9]{1,3}(?:\.[0-9]{3})*(?:,[0-9]{2})?)/i;
            const valorMatch = valorPattern.exec(fileContent);
            if (valorMatch && valorMatch[1]) {
              enhancedData['valorTotalBens'] = "R$ " + valorMatch[1];
              
              // Calculate meação and herdeiros
              try {
                const cleanValue = valorMatch[1].replace(/\./g, '').replace(',', '.');
                const numValue = parseFloat(cleanValue);
                
                if (!isNaN(numValue)) {
                  const meacao = numValue / 2;
                  enhancedData['valorTotalMeacao'] = "R$ " + meacao.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                  
                  const numHerdeiros = parseInt(enhancedData['numeroFilhos'] || '1', 10);
                  if (!isNaN(numHerdeiros) && numHerdeiros > 0) {
                    const valorPorHerdeiro = meacao / numHerdeiros;
                    enhancedData['valorUnitarioHerdeiros'] = "R$ " + valorPorHerdeiro.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                    enhancedData['percentualHerdeiros'] = (50 / numHerdeiros).toFixed(2) + "%";
                  }
                }
              } catch (calcError) {
                console.warn("Error calculating values:", calcError);
              }
            }
          }
        }
      } catch (fileError) {
        console.warn(`Erro ao processar o arquivo ${file.name}:`, fileError);
      }
    }
    
    // Ensure we have at least basic default values for required fields
    if (documentType === 'Inventário') {
      if (!enhancedData['falecido']) enhancedData['falecido'] = "Não identificado";
      if (!enhancedData['conjuge']) enhancedData['conjuge'] = "Não identificado(a)";
      if (!enhancedData['inventariante']) enhancedData['inventariante'] = "Não identificado(a)";
      if (!enhancedData['herdeiro1']) enhancedData['herdeiro1'] = "Não identificado(a)";
      if (!enhancedData['advogado']) enhancedData['advogado'] = "Não identificado(a)";
      if (!enhancedData['dataCasamento']) enhancedData['dataCasamento'] = "Data não identificada";
      if (!enhancedData['regimeBens']) enhancedData['regimeBens'] = "Não informado";
      if (!enhancedData['dataFalecimento']) enhancedData['dataFalecimento'] = "Data não identificada";
      if (!enhancedData['numeroFilhos']) enhancedData['numeroFilhos'] = "1";
      if (!enhancedData['valorTotalBens']) enhancedData['valorTotalBens'] = "Valor não informado";
      if (!enhancedData['nomesFilhos']) {
        let filhos = enhancedData['herdeiro1'] || "Não identificado";
        if (enhancedData['herdeiro2']) filhos += ", " + enhancedData['herdeiro2'];
        if (enhancedData['herdeiro3']) filhos += ", " + enhancedData['herdeiro3'];
        enhancedData['nomesFilhos'] = filhos;
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

// Helper function to read file content with timeout - optimized for better extraction
async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      
      reader.onload = () => {
        if (reader.result && typeof reader.result === 'string') {
          // Return more content for better analysis
          resolve(reader.result.substring(0, 100000)); // Increased to 100K chars
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
      }, 10000); // Increased timeout
      
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
