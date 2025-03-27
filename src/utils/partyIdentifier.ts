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
    conjuge: [/cônjuge/i, /viúv[o|a]/i, /esposa/i, /esposo/i, /viúv[o|a]-meeiro[a]/i, /meeiro[a]/i],
    advogado: [/advogad[o|a]/i, /representante legal/i, /OAB/i]
  },
  'Escritura de Compra e Venda': {
    vendedor: [/vendedor/i, /outorgante vendedor/i, /transmitente/i],
    comprador: [/comprador/i, /outorgado comprador/i, /adquirente/i],
    advogado: [/advogad[o|a]/i, /representante legal/i, /OAB/i],
    testemunha: [/testemunha/i]
  },
  'Doação': {
    doador: [/doador/i, /outorgante doador/i],
    donatario: [/donatário/i, /outorgado donatário/i, /beneficiário/i],
    advogado: [/advogad[o|a]/i, /representante legal/i, /OAB/i],
    testemunha: [/testemunha/i]
  },
  'União Estável': {
    companheiro1: [/companheiro/i, /convivente/i, /primeiro declarante/i],
    companheiro2: [/companheira/i, /convivente/i, /segundo declarante/i],
    advogado: [/advogad[o|a]/i, /representante legal/i, /OAB/i],
    testemunha: [/testemunha/i]
  },
  'Procuração': {
    outorgante: [/outorgante/i, /mandante/i, /representado/i],
    procurador: [/outorgado/i, /procurador/i, /mandatário/i, /representante/i],
    advogado: [/advogad[o|a]/i, /OAB/i],
    testemunha: [/testemunha/i]
  },
  'Testamento': {
    testador: [/testador/i, /autor do testamento/i],
    beneficiario: [/beneficiário/i, /herdeiro/i, /legatário/i],
    advogado: [/advogad[o|a]/i, /OAB/i],
    testemunha: [/testemunha/i]
  },
  'Contrato de Aluguel': {
    locador: [/locador/i, /proprietário/i],
    locatario: [/locatário/i, /inquilino/i],
    fiador: [/fiador/i, /garantidor/i],
    advogado: [/advogad[o|a]/i, /OAB/i]
  },
  'Contrato Social': {
    socio1: [/sócio/i, /primeiro sócio/i, /sócio administrador/i],
    socio2: [/segundo sócio/i, /sócio quotista/i],
    advogado: [/advogad[o|a]/i, /OAB/i, /contador/i],
    testemunha: [/testemunha/i]
  },
  'Outro': {
    parte1: [/parte/i, /requerente/i, /autor/i, /outorgante/i],
    parte2: [/parte/i, /requerido/i, /réu/i, /outorgado/i],
    advogado: [/advogad[o|a]/i, /OAB/i],
    testemunha: [/testemunha/i]
  }
};

// Helper to find names near role patterns - enhanced to extract more context
function findNamesInContext(content: string, rolePatterns: RegExp[], windowSize: number = 200): string[] {
  if (!content || typeof content !== 'string') {
    return [];
  }
  
  // Performance optimization - analyze larger content
  const maxContentLength = 100000; // Increased to 100K characters
  const trimmedContent = content.substring(0, maxContentLength);
  
  const foundNames: string[] = [];
  
  // Increased time limit for better extraction
  const startTime = Date.now();
  const maxProcessingTime = 3000; // 3 seconds maximum per pattern group
  
  for (const pattern of rolePatterns) {
    // Check if we've exceeded the time limit
    if (Date.now() - startTime > maxProcessingTime) {
      console.warn('Tempo limite excedido para análise de padrões de papel');
      break;
    }
    
    try {
      // Find multiple matches for this pattern
      let match;
      let matchCount = 0;
      const re = new RegExp(pattern);
      
      // Attempt to find matches for this role pattern
      while ((match = re.exec(trimmedContent)) !== null && matchCount < 5) { // Increased to 5 matches
        const matchIndex = match.index;
        const startContext = Math.max(0, matchIndex - windowSize);
        const endContext = Math.min(trimmedContent.length, matchIndex + match[0].length + windowSize);
        
        const context = trimmedContent.substring(startContext, endContext);
        
        // Find names in this context
        const nameMatches = [...context.matchAll(new RegExp(personNamePattern, 'g'))];
        
        for (const nameMatch of nameMatches.slice(0, 5)) { // Take up to 5 names
          if (nameMatch && nameMatch[0]) {
            // Validate that this looks like a real name (at least 2 words, each word at least 2 chars)
            const nameParts = nameMatch[0].trim().split(/\s+/);
            if (nameParts.length >= 2 && nameParts.every(part => part.length >= 2)) {
              foundNames.push(nameMatch[0].trim());
            }
          }
          
          if (foundNames.length >= 5) break;
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
  return [...new Set(foundNames)].slice(0, 5);
}

// Extract dates from context - improved to handle more date formats
function findDatesInContext(content: string, contextPattern: RegExp, windowSize: number = 200): string {
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
    
    // Try to find dates in different formats
    const dateFormats = [
      /(\d{1,2}\/\d{1,2}\/\d{4})/gi, // DD/MM/YYYY
      /(\d{1,2}\.\d{1,2}\.\d{4})/gi, // DD.MM.YYYY
      /(\d{1,2}\-\d{1,2}\-\d{4})/gi, // DD-MM-YYYY
      /(\d{1,2}\s+de\s+[a-zÀ-ÿ]+\s+de\s+\d{4})/gi, // DD de Month de YYYY
    ];
    
    for (const format of dateFormats) {
      const dateMatch = format.exec(context);
      if (dateMatch && dateMatch[0]) {
        return dateMatch[0];
      }
    }
    
    return '';
  } catch (error) {
    console.warn("Error extracting date:", error);
    return '';
  }
}

// Extract addresses from context - improved to detect more address formats
function findAddressInContext(content: string, contextPattern: RegExp, windowSize: number = 250): string {
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
    
    // Try multiple address patterns
    const addressPatterns = [
      /(?:residente|domiciliado|endereço)[^\n,;]+((?:[A-Z][a-zÀ-ÿ]+[\s,]*)+(?:\d+)?[^\n;]*)/i,
      /(?:residente|domiciliado)[^,;]*((?:à|a|na|no|em)[^,;]*)/i,
      /(?:SHIGS|SQN|SQS|SQSW|SHCGN|SHIN)[\s,]*\d+[^,;]*/i,
      /(?:Quadra|Bloco|Lote|Casa|Apartamento)[\s,]*\d+[^,;]*/i,
    ];
    
    for (const pattern of addressPatterns) {
      const addressMatch = pattern.exec(context);
      if (addressMatch && addressMatch[1]) {
        return addressMatch[1].trim();
      }
    }
    
    return '';
  } catch (error) {
    console.warn("Error extracting address:", error);
    return '';
  }
}

// Look for specific document patterns like RG, CPF, etc.
function findDocumentInContext(content: string, contextPattern: RegExp, documentType: string, windowSize: number = 150): string {
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
    
    // Create pattern based on document type
    const documentPattern = new RegExp(`${documentType}[\\s.:]*([\\d\\.\\-\\/]+)`, 'i');
    const documentMatch = documentPattern.exec(context);
    
    return documentMatch && documentMatch[1] ? documentMatch[1].trim() : '';
  } catch (error) {
    console.warn(`Error extracting ${documentType}:`, error);
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
    const maxProcessingTime = 30000; // Increased to 30 seconds maximum
    
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
                // Filter out obvious non-names (like "Poder Judiciário" or "Certidão")
                const validNames = namesForRole.filter(name => {
                  const lowercaseName = name.toLowerCase();
                  return !lowercaseName.includes('poder') && 
                         !lowercaseName.includes('certidão') && 
                         !lowercaseName.includes('judiciário') && 
                         !lowercaseName.includes('justiça') &&
                         !lowercaseName.includes('tribunal') &&
                         !lowercaseName.includes('código') &&
                         !lowercaseName.includes('consulta');
                });
                
                if (validNames.length > 0) {
                  // If we already have this role but with placeholder data or detected system text, update it
                  if (!enhancedData[role] || 
                      enhancedData[role] === 'N/A' || 
                      enhancedData[role] === '=====' || 
                      enhancedData[role] === 'Não identificado' ||
                      enhancedData[role].includes('Poder') ||
                      enhancedData[role].includes('Judiciário')) {
                    enhancedData[role] = validNames[0];
                  }
                  
                  // For herdeiros, handle multiple entries
                  if (role === 'herdeiro1' && validNames.length > 1 && !enhancedData['herdeiro2']) {
                    enhancedData['herdeiro2'] = validNames[1];
                  }
                  if (role === 'herdeiro1' && validNames.length > 2 && !enhancedData['herdeiro3']) {
                    enhancedData['herdeiro3'] = validNames[2];
                  }
                }
              }
              
              // For specific roles, try to extract additional information
              if (role === 'falecido' && enhancedData[role]) {
                // Try to extract death date
                const deathDatePattern = /faleceu|óbito|data do falecimento/i;
                const deathDate = findDatesInContext(fileContent, deathDatePattern);
                if (deathDate && (!enhancedData['dataFalecimento'] || 
                                  enhancedData['dataFalecimento'] === 'Data não identificada')) {
                  enhancedData['dataFalecimento'] = deathDate;
                }
                
                // Try to extract CPF
                const cpfFalecido = findDocumentInContext(fileContent, /falecido|de cujus|autor da herança/i, 'CPF');
                if (cpfFalecido && !enhancedData['cpfFalecido']) {
                  enhancedData['cpfFalecido'] = cpfFalecido;
                }
              } else if (role === 'conjuge' && enhancedData[role]) {
                // Try to extract marriage date
                const marriageDatePattern = /casad[o|a]|casamento|matrimônio/i;
                const marriageDate = findDatesInContext(fileContent, marriageDatePattern);
                if (marriageDate && (!enhancedData['dataCasamento'] || 
                                    enhancedData['dataCasamento'] === 'Data não identificada')) {
                  enhancedData['dataCasamento'] = marriageDate;
                }
                
                // Try to extract CPF
                const cpfConjuge = findDocumentInContext(fileContent, /cônjuge|viúv[o|a]|esposa|esposo/i, 'CPF');
                if (cpfConjuge && !enhancedData['cpfConjuge']) {
                  enhancedData['cpfConjuge'] = cpfConjuge;
                }
                
                // Try to extract regime de bens
                if (!enhancedData['regimeBens'] || enhancedData['regimeBens'].includes('Endereço')) {
                  const regimePatterns = [
                    /regime\s+de\s+(?:bens)?\s*(?:d[eo])?\s*([a-zÀ-ÿ\s]+)(?:de bens)?/i,
                    /casad[o|a][^,;]*regime\s+([^,;]*)/i,
                    /sob\s+o\s+regime\s+([^,;]*)/i
                  ];
                  
                  for (const pattern of regimePatterns) {
                    const match = pattern.exec(fileContent);
                    if (match && match[1]) {
                      const regime = match[1].trim().toLowerCase();
                      // Check if it's a valid regime
                      if (regime.includes('comunhão') || 
                          regime.includes('separação') || 
                          regime.includes('participação') ||
                          regime.includes('universal')) {
                        enhancedData['regimeBens'] = match[1].trim();
                        break;
                      }
                    }
                  }
                }
              }
            } catch (roleError) {
              console.warn(`Error processing role ${role}:`, roleError);
            }
          }
          
          // Small pause between roles to prevent UI freezing
          await new Promise(resolve => setTimeout(resolve, 5));
        }
        
        // Try to extract real estate information for Inventário
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
      // Clean up data, replacing system text with appropriate placeholders
      Object.keys(enhancedData).forEach(key => {
        const value = enhancedData[key];
        if (typeof value === 'string') {
          // Check if it's likely a system text rather than actual data
          if (value.includes('Poder Judiciário') || 
              value.includes('Certidão') || 
              value.includes('ião estável') ||
              value.includes('Consulta')) {
            
            // Replace with appropriate placeholder based on field
            if (key === 'falecido') enhancedData[key] = "Autor da Herança";
            else if (key === 'conjuge') enhancedData[key] = "Cônjuge Sobrevivente";
            else if (key === 'inventariante') enhancedData[key] = "Inventariante Nomeado";
            else if (key.includes('herdeiro')) enhancedData[key] = "Herdeiro Legítimo";
            else if (key === 'advogado') enhancedData[key] = "Advogado(a) Constituído(a)";
            else delete enhancedData[key]; // Remove invalid system text for other fields
          }
        }
      });
      
      // Set default values if missing
      if (!enhancedData['falecido']) enhancedData['falecido'] = "Autor da Herança";
      if (!enhancedData['conjuge']) enhancedData['conjuge'] = "Cônjuge Sobrevivente";
      if (!enhancedData['inventariante']) enhancedData['inventariante'] = "Inventariante Nomeado";
      if (!enhancedData['herdeiro1']) enhancedData['herdeiro1'] = "Herdeiro Legítimo";
      if (!enhancedData['advogado']) enhancedData['advogado'] = "Advogado(a) Constituído(a)";
      if (!enhancedData['dataCasamento']) enhancedData['dataCasamento'] = "Data não identificada";
      if (!enhancedData['regimeBens']) enhancedData['regimeBens'] = "Comunhão parcial de bens";
      if (!enhancedData['dataFalecimento']) enhancedData['dataFalecimento'] = "Data não identificada";
      if (!enhancedData['numeroFilhos']) enhancedData['numeroFilhos'] = "1";
      if (!enhancedData['valorTotalBens']) enhancedData['valorTotalBens'] = "Valor não informado";
    }
  } catch (error) {
    console.warn("Error in party identification process:", error);
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
