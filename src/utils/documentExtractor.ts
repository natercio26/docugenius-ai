
import { DraftType } from '@/types';
import { identifyPartiesAndRoles } from './partyIdentifier';
import * as Tesseract from 'tesseract.js';

// Export the identifyPartiesAndRoles function to be used elsewhere
export { identifyPartiesAndRoles };

// Function to extract text from PDF files with improved content capture
async function extractTextFromPDF(file: File): Promise<string> {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      
      reader.onload = async function () {
        try {
          if (!reader.result) {
            console.warn("File reader returned empty result");
            resolve("");
            return;
          }
          
          try {
            const typedArray = new Uint8Array(reader.result as ArrayBuffer);
            const pdfjsLib = await import('pdfjs-dist');
            
            // Set worker source with a try/catch
            try {
              pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.js`;
            } catch (workerError) {
              console.warn("Error setting PDF.js worker:", workerError);
              // Continue anyway - the default worker might work
            }
            
            try {
              // Use a timeout to prevent infinite processing
              const timeoutPromise = new Promise<string>((_, reject) => {
                setTimeout(() => reject(new Error("PDF processing timeout")), 30000); // Increased timeout for image processing
              });
              
              const processingPromise = new Promise<string>(async (resolveProcessing) => {
                try {
                  const loadingTask = pdfjsLib.getDocument(typedArray);
                  const pdfDocument = await loadingTask.promise;
                  
                  let fullText = '';
                  // Process more pages to get more content (up to all pages)
                  const maxPages = pdfDocument.numPages;
                  
                  // Process all pages to extract more data
                  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
                    try {
                      const page = await pdfDocument.getPage(pageNum);
                      
                      // Extract text content
                      const textContent = await page.getTextContent();
                      const pageText = textContent.items
                        .map(item => 'str' in item ? (item as any).str : '')
                        .join(' ');
                        
                      fullText += pageText + '\n';
                      
                      // Try to extract images if text is minimal
                      if (pageText.trim().length < 100) {
                        try {
                          // Get page as canvas to extract images via OCR
                          const viewport = page.getViewport({ scale: 1.5 }); // Higher scale for better OCR
                          const canvas = document.createElement('canvas');
                          const context = canvas.getContext('2d');
                          
                          if (context) {
                            canvas.height = viewport.height;
                            canvas.width = viewport.width;
                            
                            await page.render({
                              canvasContext: context,
                              viewport: viewport
                            }).promise;
                            
                            // Use Tesseract to extract text from the rendered page
                            try {
                              const ocrResult = await Tesseract.recognize(
                                canvas.toDataURL('image/png'),
                                'por', // Portuguese language
                                { 
                                  logger: m => {
                                    if (m.status === 'recognizing text') {
                                      console.log(`OCR processing page ${pageNum}: ${Math.round(m.progress * 100)}%`);
                                    }
                                  }
                                }
                              );
                              
                              if (ocrResult?.data?.text && ocrResult.data.text.length > pageText.length) {
                                fullText += " " + ocrResult.data.text + '\n';
                                console.log(`Added OCR text from page ${pageNum}, length: ${ocrResult.data.text.length}`);
                              }
                            } catch (ocrError) {
                              console.warn(`OCR failed for page ${pageNum}:`, ocrError);
                            }
                          }
                        } catch (imageError) {
                          console.warn(`Failed to extract images from page ${pageNum}:`, imageError);
                        }
                      }
                      
                      // Brief pause to prevent UI freezing
                      await new Promise(r => setTimeout(r, 10));
                    } catch (pageError) {
                      console.warn(`Error extracting text from page ${pageNum}:`, pageError);
                      // Continue with other pages
                    }
                  }
                  resolveProcessing(fullText || "");
                } catch (error) {
                  console.warn("PDF processing error:", error);
                  resolveProcessing("");
                }
              });
              
              // Race between timeout and processing
              const result = await Promise.race([processingPromise, timeoutPromise])
                .catch(error => {
                  console.warn("PDF extraction timed out or failed:", error);
                  return "";
                });
              
              resolve(result);
            } catch (pdfError) {
              console.warn("Error processing PDF document:", pdfError);
              resolve("");
            }
          } catch (importError) {
            console.warn("Error importing PDF.js:", importError);
            resolve("");
          }
        } catch (error) {
          console.warn("Error in PDF reader onload:", error);
          resolve("");
        }
      };
      
      reader.onerror = (error) => {
        console.warn("Error reading PDF file:", error);
        resolve("");
      };
      
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.warn("Unexpected error in extractTextFromPDF:", error);
      resolve("");
    }
  });
}

// Improved function for extracting data from files 
export async function extractDataFromFiles(files: File[]): Promise<{ [key: string]: any }> {
  const extractedData: { [key: string]: any } = {};
  
  try {
    console.log('Iniciando extração de dados de', files.length, 'arquivo(s)');
    
    if (!files || files.length === 0) {
      console.warn('Nenhum arquivo para processar');
      return extractedData;
    }
    
    // Process all files for better data extraction
    for (const file of files) {
      if (!file) {
        console.warn('Arquivo inválido encontrado na lista');
        continue;
      }
      
      console.log('Processando arquivo:', file.name, 'tipo:', file.type);
      
      // Extract text content from all file types
      let textContent = '';
      
      try {
        const fileType = file.type.toLowerCase();
        const fileName = file.name.toLowerCase();
        
        // Process all supported file types
        if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
          textContent = await extractTextFromPDF(file);
          console.log(`Texto extraído do PDF ${file.name}: ${textContent.length} caracteres`);
        } else if (fileType.includes('image') || 
                  fileName.endsWith('.jpg') || 
                  fileName.endsWith('.jpeg') || 
                  fileName.endsWith('.png')) {
          console.log('Processando imagem...');
          // Use tesseract for OCR on images
          try {
            const reader = new FileReader();
            const imageData = await new Promise<string>((resolve) => {
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = () => resolve('');
              reader.readAsDataURL(file);
            });
            
            if (imageData) {
              const ocrResult = await Tesseract.recognize(
                imageData,
                'por', // Portuguese language
                { logger: m => console.log(`OCR: ${m.status} (${Math.round(m.progress * 100)}%)`) }
              );
              
              textContent = ocrResult?.data?.text || '';
              console.log(`Texto extraído da imagem ${file.name}: ${textContent.length} caracteres`);
            }
          } catch (ocrError) {
            console.warn(`Erro no OCR para ${file.name}:`, ocrError);
          }
        } else if (fileType.includes('document') || fileName.endsWith('.docx')) {
          console.log('Processando documento do Word...');
          try {
            const mammoth = await import('mammoth');
            const reader = new FileReader();
            
            const docData = await new Promise<ArrayBuffer>((resolve) => {
              reader.onload = () => resolve(reader.result as ArrayBuffer);
              reader.onerror = () => resolve(new ArrayBuffer(0));
              reader.readAsArrayBuffer(file);
            });
            
            if (docData.byteLength > 0) {
              const result = await mammoth.extractRawText({ arrayBuffer: docData });
              textContent = result.value;
              console.log(`Texto extraído do Word ${file.name}: ${textContent.length} caracteres`);
            }
          } catch (docxError) {
            console.warn(`Erro ao processar documento Word ${file.name}:`, docxError);
          }
        }
        
        if (textContent) {
          console.log(`Texto extraído com sucesso do arquivo: ${file.name}`);
          
          // Extract comprehensive data points
          extractComprehensiveData(textContent, extractedData);
        } else {
          console.warn(`Nenhum texto extraído do arquivo: ${file.name}`);
        }
      } catch (fileProcessError) {
        console.error(`Erro ao processar arquivo ${file.name}:`, fileProcessError);
        // Continue with other files
      }
    }
    
    console.log("Dados extraídos dos documentos:", extractedData);
    return extractedData;
  } catch (error) {
    console.error('Erro na extração de dados:', error);
    return { error: 'Erro ao extrair dados dos arquivos' };
  }
}

// Enhanced function for extracting comprehensive data
function extractComprehensiveData(text: string, extractedData: { [key: string]: any }): void {
  if (!text || typeof text !== 'string') {
    console.warn('Texto inválido recebido para extração de dados');
    return;
  }

  try {
    // Common patterns for personal information
    extractPersonalInfo(text, extractedData);
    
    // Dates
    extractDates(text, extractedData);
    
    // Addresses
    extractAddresses(text, extractedData);
    
    // Property details
    extractPropertyDetails(text, extractedData);
    
    // Document IDs and legal information
    extractDocumentIDs(text, extractedData);
    
    // Financial values
    extractFinancialData(text, extractedData);
    
    // Additional data specific to inventory/inheritance
    if (!extractedData['falecido']) {
      const deceasedPattern = /(?:falec[ido|eu|imento]|de cujus|autor[a]? da herança|espólio de)[\s\S]{0,100}([A-Z][a-zÀ-ÿ]+(?:\s+[A-Z][a-zÀ-ÿ]+){1,8})/i;
      const deceasedMatch = text.match(deceasedPattern);
      if (deceasedMatch && deceasedMatch[1]) {
        extractedData['falecido'] = deceasedMatch[1].trim();
      }
    }
    
    // More specific patterns for special roles
    extractSpecialRoles(text, extractedData);
    
    // Collection of heirs for nomesFilhos
    if (!extractedData['nomesFilhos']) {
      let filhos = extractedData['herdeiro1'] || "Não identificado";
      if (extractedData['herdeiro2']) filhos += ", " + extractedData['herdeiro2'];
      if (extractedData['herdeiro3']) filhos += ", " + extractedData['herdeiro3'];
      if (extractedData['herdeiro4']) filhos += ", " + extractedData['herdeiro4'];
      if (extractedData['herdeiro5']) filhos += ", " + extractedData['herdeiro5'];
      extractedData['nomesFilhos'] = filhos;
    }
    
    // Fill in missing required fields with defaults
    fillMissingFields(extractedData);
    
  } catch (error) {
    console.warn("Error in comprehensive data extraction:", error);
  }
}

// Extract personal information of individuals
function extractPersonalInfo(text: string, extractedData: { [key: string]: any }): void {
  // Names - more comprehensive pattern that catches longer names with multiple parts
  const namePattern = /(?:[A-Z][a-zÀ-ÿ]{1,20}\s){1,8}(?:[A-Z][a-zÀ-ÿ]{1,20})/g;
  const nameMatches = text.match(namePattern);
  
  if (nameMatches && nameMatches.length > 0) {
    // Try to match names with roles based on proximity
    
    // Roles with corresponding patterns
    const rolePatterns = [
      { role: 'viuvoMeeiro', pattern: /viúv[oa][\s\-]*(?:meeiro|meeira)/i },
      { role: 'conjuge', pattern: /(?:cônjuge|viúv[o|a]|esposa|esposo|casad[o|a] com)/i },
      { role: 'inventariante', pattern: /inventariante/i },
      { role: 'herdeiro1', pattern: /(?:herdeiro|herdeira|sucessor|filho|filha)/i },
      { role: 'advogado', pattern: /(?:advogad[o|a]|OAB)/i },
      { role: 'falecido', pattern: /(?:falec[ido|eu|imento]|de cujus|espólio|autor[a]? da herança)/i }
    ];
    
    // Check for context-specific names
    for (const { role, pattern } of rolePatterns) {
      if (!extractedData[role] || extractedData[role] === 'Não identificado' || extractedData[role] === '=====') {
        const contextMatch = text.match(new RegExp(`${pattern.source}[\\s\\S]{0,150}([A-Z][a-zÀ-ÿ]+(?:\\s+[A-Z][a-zÀ-ÿ]+){1,8})`, 'i'));
        if (contextMatch && contextMatch[1]) {
          extractedData[role] = contextMatch[1].trim();
        }
      }
    }
    
    // Fill other herdeiros (heirs) if we have names left
    const assignedNames = Object.values(extractedData).filter(Boolean);
    let heirIndex = 1;
    
    for (const name of nameMatches) {
      // Skip already assigned names
      if (assignedNames.includes(name)) continue;
      
      // Fill next available heir slot
      while (extractedData[`herdeiro${heirIndex}`] && heirIndex < 10) {
        heirIndex++;
      }
      
      if (heirIndex < 10 && !extractedData[`herdeiro${heirIndex}`]) {
        extractedData[`herdeiro${heirIndex}`] = name;
        assignedNames.push(name);
        heirIndex++;
      }
    }
  }
  
  // National IDs - CPF/CNPJ/RG
  const cpfPattern = /CPF[\s.:]*(\d{3}[\.\s]?\d{3}[\.\s]?\d{3}[\-\.\s]?\d{2})/gi;
  const cpfMatches = text.matchAll(cpfPattern);
  for (const match of cpfMatches) {
    if (!extractedData['cpf']) {
      extractedData['cpf'] = match[1];
    } else if (!extractedData['cpfConjuge']) {
      extractedData['cpfConjuge'] = match[1];
    }
  }
  
  const rgPattern = /RG[\s.:]*(\d[\d\.\-\/]+)/gi;
  const rgMatches = text.matchAll(rgPattern);
  for (const match of rgMatches) {
    if (!extractedData['rg']) {
      extractedData['rg'] = match[1];
    } else if (!extractedData['rgConjuge']) {
      extractedData['rgConjuge'] = match[1];
    }
  }
  
  // Professions - look for profession indicators
  const professionPattern = /(?:profissão|ocupação)\s*(?:de|do|da)?\s*([a-zÀ-ÿ]+(?:\s+[a-zÀ-ÿ]+){0,3})/i;
  const professionMatch = text.match(professionPattern);
  if (professionMatch && professionMatch[1]) {
    extractedData['profissao'] = professionMatch[1].trim();
  }
  
  // Nationality
  const nationalityPattern = /(?:nacionalidade|nascionalidade)\s*(?:de|do|da)?\s*([a-zÀ-ÿ]+(?:\s+[a-zÀ-ÿ]+){0,1})/i;
  const nationalityMatch = text.match(nationalityPattern);
  if (nationalityMatch && nationalityMatch[1]) {
    extractedData['nacionalidade'] = nationalityMatch[1].trim();
  }
  
  // Marital status
  const maritalStatusPattern = /(?:estado\s*civil|estado\-civil)\s*(?:de|do|da)?\s*([a-zÀ-ÿ]+(?:\s+[a-zÀ-ÿ]+){0,1})/i;
  const maritalStatusMatch = text.match(maritalStatusPattern);
  if (maritalStatusMatch && maritalStatusMatch[1]) {
    extractedData['estadoCivil'] = maritalStatusMatch[1].trim();
  }
}

// Extract dates from text
function extractDates(text: string, extractedData: { [key: string]: any }): void {
  // All dates in the document
  const datePattern = /(\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}\s+de\s+[a-zÀ-ÿ]+\s+de\s+\d{4})/gi;
  const dateMatches = text.match(datePattern);
  
  if (dateMatches && dateMatches.length > 0) {
    if (!extractedData['data']) extractedData['data'] = dateMatches[0];
    
    // Death date
    const deathDatePattern = /falec[ido|eu|imento][\s\S]{0,70}(\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}\s+de\s+[a-zÀ-ÿ]+\s+de\s+\d{4})/i;
    const deathDateMatch = text.match(deathDatePattern);
    if (deathDateMatch && deathDateMatch[1]) {
      extractedData['dataFalecimento'] = deathDateMatch[1];
    } else if (dateMatches.length > 1 && !extractedData['dataFalecimento']) {
      extractedData['dataFalecimento'] = dateMatches[1];
    }
    
    // Marriage date
    const marriageDatePattern = /casad[ao][\s\S]{0,70}(\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}\s+de\s+[a-zÀ-ÿ]+\s+de\s+\d{4})/i;
    const marriageDateMatch = text.match(marriageDatePattern);
    if (marriageDateMatch && marriageDateMatch[1]) {
      extractedData['dataCasamento'] = marriageDateMatch[1];
    } else if (dateMatches.length > 2 && !extractedData['dataCasamento']) {
      extractedData['dataCasamento'] = dateMatches[2];
    }
    
    // Certificate dates
    if (dateMatches.length > 3 && !extractedData['dataCertidaoCasamento']) {
      extractedData['dataCertidaoCasamento'] = dateMatches[3];
    }
    
    if (dateMatches.length > 4 && !extractedData['dataExpedicaoCertidaoObito']) {
      extractedData['dataExpedicaoCertidaoObito'] = dateMatches[4];
    }
  }
}

// Extract addresses from text
function extractAddresses(text: string, extractedData: { [key: string]: any }): void {
  // General address pattern
  const addressPattern = /(?:residente|domiciliado|endereço)[^\n,;]+((?:[A-Z][a-zÀ-ÿ]+[\s,]*)+(?:\d+)?[^\n;]*)/gi;
  const addressMatches = text.match(addressPattern);
  
  if (addressMatches && addressMatches.length > 0) {
    extractedData['endereco'] = addressMatches[0].replace(/(?:residente|domiciliado|endereço)[^\n,;]+/i, '').trim();
    
    if (addressMatches.length > 1 && !extractedData['enderecoConjuge']) {
      extractedData['enderecoConjuge'] = addressMatches[1].replace(/(?:residente|domiciliado|endereço)[^\n,;]+/i, '').trim();
    }
  }
}

// Extract property details from text
function extractPropertyDetails(text: string, extractedData: { [key: string]: any }): void {
  // Apartment number
  const aptNumberPattern = /(?:apartamento|apto)[\s\.]*(?:n[º°]?\.?)?[\s\.]*(\d+)/i;
  const aptNumberMatch = text.match(aptNumberPattern);
  if (aptNumberMatch && aptNumberMatch[1]) {
    extractedData['numeroApartamento'] = aptNumberMatch[1];
  }
  
  // Block
  const blockPattern = /(?:bloco|bl)[\s\.]*["']?([A-Z0-9]+)["']?/i;
  const blockMatch = text.match(blockPattern);
  if (blockMatch && blockMatch[1]) {
    extractedData['blocoApartamento'] = blockMatch[1];
  }
  
  // Location (quadra)
  const locationPattern = /(?:quadra|sqn|sqs|qn|qs|qi|qd)[\s\.]*(\d+)/i;
  const locationMatch = text.match(locationPattern);
  if (locationMatch && locationMatch[1]) {
    extractedData['quadraApartamento'] = `Quadra ${locationMatch[1]}`;
  }
  
  // More specific location details for SQS/SQN/QI formats
  const brasiliaSectorPattern = /(SQS|SQN|SQSW|SQNW|QI|QL)[\s\.]*(\d+)[\s\.,]*(?:Bloco|Bl\.?)[\s\.]*["']?([A-Z0-9]+)["']?/i;
  const brasiliaSectorMatch = text.match(brasiliaSectorPattern);
  if (brasiliaSectorMatch) {
    const [_, sector, number, block] = brasiliaSectorMatch;
    if (!extractedData['quadraApartamento']) {
      extractedData['quadraApartamento'] = `${sector} ${number}`;
    }
    if (!extractedData['blocoApartamento']) {
      extractedData['blocoApartamento'] = block;
    }
  }
  
  // Property additional description
  const descriptionPattern = /(?:com|tendo)[\s\.]*((?:vaga|garagem|depósito|área)[\s\S]{5,100}?)(?:[,\.\n])/i;
  const descriptionMatch = text.match(descriptionPattern);
  if (descriptionMatch && descriptionMatch[1]) {
    extractedData['descricaoAdicionalImovel'] = descriptionMatch[1].trim();
  }
}

// Extract document IDs and registration numbers
function extractDocumentIDs(text: string, extractedData: { [key: string]: any }): void {
  // Property registration
  const registrationPattern = /matrícula[\s\.]*(?:n[º°]?\.?)?[\s\.]*(\d[\d\.\-\/]+)/i;
  const registrationMatch = text.match(registrationPattern);
  if (registrationMatch && registrationMatch[1]) {
    extractedData['matriculaImovel'] = registrationMatch[1];
  }
  
  // Marriage certificate
  const marriageRegPattern = /certidão[\s\.]de[\s\.]casamento[\s\S]{0,100}matrícula[\s\.]*(?:n[º°]?\.?)?[\s\.]*(\d[\d\.\-\/]+)/i;
  const marriageRegMatch = text.match(marriageRegPattern);
  if (marriageRegMatch && marriageRegMatch[1]) {
    extractedData['matriculaCasamento'] = marriageRegMatch[1];
  }
  
  // Death certificate
  const deathRegPattern = /certidão[\s\.]de[\s\.]óbito[\s\S]{0,100}matrícula[\s\.]*(?:n[º°]?\.?)?[\s\.]*(\d[\d\.\-\/]+)/i;
  const deathRegMatch = text.match(deathRegPattern);
  if (deathRegMatch && deathRegMatch[1]) {
    extractedData['matriculaObito'] = deathRegMatch[1];
  }
  
  // GDF registration
  const gdfPattern = /GDF[\s\.]*(?:sob[\s\.](?:o|nº))?[\s\.]*(\d[\d\.\-\/]+)/i;
  const gdfMatch = text.match(gdfPattern);
  if (gdfMatch && gdfMatch[1]) {
    extractedData['inscricaoGDF'] = gdfMatch[1];
  }
  
  // ITCMD
  const itcmdPattern = /ITCMD[\s\.]*(?:n[º°]?\.?)?[\s\.]*(\d[\d\.\-\/]+)/i;
  const itcmdMatch = text.match(itcmdPattern);
  if (itcmdMatch && itcmdMatch[1]) {
    extractedData['numeroITCMD'] = itcmdMatch[1];
  }
  
  // CNIB hash
  const hashPattern = /hash[\s:]*(?:n[º°]?\.?)?[\s:]*([A-Za-z0-9]+)/i;
  const hashMatch = text.match(hashPattern);
  if (hashMatch && hashMatch[1]) {
    extractedData['hashCNIB'] = hashMatch[1];
  }
  
  // Registry Office (Cartório)
  const registryPattern = /(?:Cartório|Serventia|Ofício)[\s:]+((?:[^,;.\n]+))/i;
  const registryMatch = text.match(registryPattern);
  if (registryMatch && registryMatch[1]) {
    extractedData['cartorioImovel'] = registryMatch[1].trim();
  }
  
  // Marriage Registry Office
  const marriageRegistryPattern = /certidão[\s\.]de[\s\.]casamento[\s\S]{0,100}(?:Cartório|Serventia|Ofício)[\s:]+((?:[^,;.\n]+))/i;
  const marriageRegistryMatch = text.match(marriageRegistryPattern);
  if (marriageRegistryMatch && marriageRegistryMatch[1]) {
    extractedData['cartorioCasamento'] = marriageRegistryMatch[1].trim();
  } else if (registryMatch && !extractedData['cartorioCasamento']) {
    extractedData['cartorioCasamento'] = registryMatch[1].trim();
  }
  
  // Death Registry Office
  const deathRegistryPattern = /certidão[\s\.]de[\s\.]óbito[\s\S]{0,100}(?:Cartório|Serventia|Ofício)[\s:]+((?:[^,;.\n]+))/i;
  const deathRegistryMatch = text.match(deathRegistryPattern);
  if (deathRegistryMatch && deathRegistryMatch[1]) {
    extractedData['cartorioObito'] = deathRegistryMatch[1].trim();
  } else if (registryMatch && !extractedData['cartorioObito']) {
    extractedData['cartorioObito'] = registryMatch[1].trim();
  }
}

// Extract financial data from text
function extractFinancialData(text: string, extractedData: { [key: string]: any }): void {
  // Financial values (money)
  const moneyPattern = /R\$\s*([\d\.,]+)/g;
  const moneyMatches = text.matchAll(moneyPattern);
  
  let valueCounter = 0;
  const financialValues: string[] = [];
  
  for (const match of moneyMatches) {
    financialValues.push(match[1]);
  }
  
  // If we have financial values, assign them to specific fields
  if (financialValues.length > 0) {
    // Total property value
    extractedData['valorTotalBens'] = `R$ ${financialValues[0]}`;
    
    try {
      // Calculate related values
      const cleanValue = financialValues[0].replace(/\./g, '').replace(',', '.');
      const numValue = parseFloat(cleanValue);
      
      if (!isNaN(numValue)) {
        // Meação (half share)
        const meacao = numValue / 2;
        extractedData['valorTotalMeacao'] = `R$ ${meacao.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        
        // Count number of heirs
        let numHerdeiros = 0;
        for (let i = 1; i <= 10; i++) {
          if (extractedData[`herdeiro${i}`]) numHerdeiros++;
        }
        
        if (numHerdeiros === 0) numHerdeiros = 1;
        extractedData['numeroFilhos'] = String(numHerdeiros);
        
        // Per-heir amount
        const valorPorHerdeiro = meacao / numHerdeiros;
        extractedData['valorUnitarioHerdeiros'] = `R$ ${valorPorHerdeiro.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        extractedData['percentualHerdeiros'] = `${(50 / numHerdeiros).toFixed(2)}%`;
      }
    } catch (error) {
      console.warn("Error calculating financial values:", error);
    }
    
    // ITCMD value
    if (financialValues.length > 1) {
      extractedData['valorITCMD'] = `R$ ${financialValues[1]}`;
      
      // Look for specific ITCMD context
      const itcmdValuePattern = /ITCMD[\s\S]{0,50}R\$\s*([\d\.,]+)/i;
      const itcmdValueMatch = text.match(itcmdValuePattern);
      if (itcmdValueMatch && itcmdValueMatch[1]) {
        extractedData['valorITCMD'] = `R$ ${itcmdValueMatch[1]}`;
      }
    }
  }
}

// Extract specific roles from text
function extractSpecialRoles(text: string, extractedData: { [key: string]: any }): void {
  // Marital property regime
  const regimePattern = /regime\s+de\s+(?:bens)?\s*(?:d[eo])?\s*([a-zÀ-ÿ\s]+)(?:de bens)?/i;
  const regimeMatch = text.match(regimePattern);
  if (regimeMatch && regimeMatch[1]) {
    extractedData['regimeBens'] = regimeMatch[1].trim();
  }
  
  // Hospital
  const hospitalPattern = /(?:Hospital|Instituição|Casa de Saúde)[\s:]+((?:[A-Z][a-zÀ-ÿ]+[\s]*)+)/i;
  const hospitalMatch = text.match(hospitalPattern);
  if (hospitalMatch && hospitalMatch[1]) {
    extractedData['hospitalFalecimento'] = hospitalMatch[1].trim();
  }
  
  // City/location
  const cidadePattern = /(?:cidade|município)[\s:]+((?:[A-Z][a-zÀ-ÿ]+[\s]*)+)/i;
  const cidadeMatch = text.match(cidadePattern);
  if (cidadeMatch && cidadeMatch[1]) {
    extractedData['cidadeFalecimento'] = cidadeMatch[1].trim();
  } else if (!extractedData['cidadeFalecimento']) {
    extractedData['cidadeFalecimento'] = 'Brasília'; // Default to Brasília
  }
  
  // OAB registration (for lawyers)
  const oabPattern = /(?:OAB|Ordem dos Advogados)[\s\/\-\.nº:]*(\d+)/i;
  const oabMatch = text.match(oabPattern);
  if (oabMatch && oabMatch[1]) {
    extractedData['oabAdvogado'] = oabMatch[1];
  }
}

// Fill missing fields with default values
function fillMissingFields(extractedData: { [key: string]: any }): void {
  // If we're missing the deceased name but have an heir or spouse
  if ((!extractedData['falecido'] || extractedData['falecido'] === 'Não identificado') && 
      (extractedData['herdeiro1'] || extractedData['conjuge'])) {
    // Try once more with a broader pattern
    if (extractedData['conjuge']) {
      extractedData['falecido'] = 'Autor da Herança (cônjuge de ' + extractedData['conjuge'] + ')';
    } else {
      extractedData['falecido'] = 'Autor da Herança';
    }
  }
  
  // Default inventariante if not found (typically spouse)
  if (!extractedData['inventariante'] && extractedData['conjuge']) {
    extractedData['inventariante'] = extractedData['conjuge'];
  } else if (!extractedData['inventariante'] && extractedData['viuvoMeeiro']) {
    extractedData['inventariante'] = extractedData['viuvoMeeiro'];
  } else if (!extractedData['inventariante'] && extractedData['herdeiro1']) {
    extractedData['inventariante'] = extractedData['herdeiro1'];
  }
  
  // If there's a viuvoMeeiro but no conjuge, copy the value
  if (extractedData['viuvoMeeiro'] && !extractedData['conjuge']) {
    extractedData['conjuge'] = extractedData['viuvoMeeiro'];
  }
  
  // If there's no hospital information
  if (!extractedData['hospitalFalecimento']) {
    extractedData['hospitalFalecimento'] = 'Hospital local';
  }
  
  // Default marital regime
  if (!extractedData['regimeBens']) {
    extractedData['regimeBens'] = 'comunhão parcial de bens';
  }
  
  // Basic date if missing
  if (!extractedData['data']) {
    const today = new Date();
    extractedData['data'] = today.toLocaleDateString('pt-BR');
  }
}

// Updated document content generation with improved data insertion and order
export function generateDocumentContent(documentType: DraftType, extractedData: { [key: string]: any }): string {
  switch (documentType) {
    case 'Inventário':
      return `
        <h1>ESCRITURA PÚBLICA DE INVENTÁRIO E PARTILHA</h1>
        
        <p><strong>= S A I B A M =</strong> quantos esta virem que, ${extractedData['data'] || '====='}, nesta cidade de Brasília, Distrito
Federal, Capital da República Federativa do Brasil, nesta Serventia, perante
mim, Escrevente, compareceram como Outorgantes e reciprocamente
Outorgados, na qualidade de viúvo(a)-meeiro(a):</p>
<p>${extractedData['conjuge'] || extractedData['viuvoMeeiro'] || '====='}, ${extractedData['nacionalidade'] || 'brasileiro(a)'}, ${extractedData['estadoCivil'] || 'viúvo(a)'}, ${extractedData['profissao'] || 'aposentado(a)'}, portador(a) da cédula de identidade RG nº ${extractedData['rgConjuge'] || extractedData['rg'] || '====='}, inscrito(a) no CPF/MF sob nº ${extractedData['cpfConjuge'] || extractedData['cpf'] || '====='}, residente e domiciliado(a) ${extractedData['enderecoConjuge'] || extractedData['endereco'] || '====='}</p>

<p>e, na qualidade de herdeiros-filhos:</p>
<p>${extractedData['herdeiro1'] || '====='}, ${extractedData['nacionalidade'] || 'brasileiro(a)'}, ${extractedData['estadoCivilHerdeiro1'] || 'maior e capaz'}, ${extractedData['profissaoHerdeiro1'] || 'profissão não informada'}, portador(a) da cédula de identidade RG nº ${extractedData['rgHerdeiro1'] || '====='}, inscrito(a) no CPF/MF sob nº ${extractedData['cpfHerdeiro1'] || '====='}, residente e domiciliado(a) ${extractedData['enderecoHerdeiro1'] || extractedData['endereco'] || '====='}</p>
${extractedData['herdeiro2'] ? `<p>${extractedData['herdeiro2']}, ${extractedData['nacionalidade'] || 'brasileiro(a)'}, ${extractedData['estadoCivilHerdeiro2'] || 'maior e capaz'}, ${extractedData['profissaoHerdeiro2'] || 'profissão não informada'}, portador(a) da cédula de identidade RG nº ${extractedData['rgHerdeiro2'] || '====='}, inscrito(a) no CPF/MF sob nº ${extractedData['cpfHerdeiro2'] || '====='}, residente e domiciliado(a) ${extractedData['enderecoHerdeiro2'] || extractedData['endereco'] || '====='}</p>` : ''}
${extractedData['herdeiro3'] ? `<p>${extractedData['herdeiro3']}, ${extractedData['nacionalidade'] || 'brasileiro(a)'}, ${extractedData['estadoCivilHerdeiro3'] || 'maior e capaz'}, ${extractedData['profissaoHerdeiro3'] || 'profissão não informada'}, portador(a) da cédula de identidade RG nº ${extractedData['rgHerdeiro3'] || '====='}, inscrito(a) no CPF/MF sob nº ${extractedData['cpfHerdeiro3'] || '====='}, residente e domiciliado(a) ${extractedData['enderecoHerdeiro3'] || extractedData['endereco'] || '====='}</p>` : ''}
${extractedData['herdeiro4'] ? `<p>${extractedData['herdeiro4']}, ${extractedData['nacionalidade'] || 'brasileiro(a)'}, ${extractedData['estadoCivilHerdeiro4'] || 'maior e capaz'}, ${extractedData['profissaoHerdeiro4'] || 'profissão não informada'}, portador(a) da cédula de identidade RG nº ${extractedData['rgHerdeiro4'] || '====='}, inscrito(a) no CPF/MF sob nº ${extractedData['cpfHerdeiro4'] || '====='}, residente e domiciliado(a) ${extractedData['enderecoHerdeiro4'] || extractedData['endereco'] || '====='}</p>` : ''}
${extractedData['herdeiro5'] ? `<p>${extractedData['herdeiro5']}, ${extractedData['nacionalidade'] || 'brasileiro(a)'}, ${extractedData['estadoCivilHerdeiro5'] || 'maior e capaz'}, ${extractedData['profissaoHerdeiro5'] || 'profissão não informada'}, portador(a) da cédula de identidade RG nº ${extractedData['rgHerdeiro5'] || '====='}, inscrito(a) no CPF/MF sob nº ${extractedData['cpfHerdeiro5'] || '====='}, residente e domiciliado(a) ${extractedData['enderecoHerdeiro5'] || extractedData['endereco'] || '====='}</p>` : ''}

<p>e, na qualidade de advogado:</p>
<p>${extractedData['advogado'] || '====='}, ${extractedData['nacionalidade'] || 'brasileiro(a)'}, advogado(a) inscrito(a) na OAB sob nº ${extractedData['oabAdvogado'] || '====='}</p>

<p>Todos os presentes foram reconhecidos e identificados como os próprios de que
trato, pelos documentos apresentados, cuja capacidade jurídica reconheço e dou
fé. E, pelos Outorgantes e reciprocamente Outorgados, devidamente orientados
pelo(a) advogado(a), acima nomeado e qualificado, legalmente constituído(a)
para este ato, me foi requerida a lavratura do inventário e partilha amigável
dos bens e direitos deixados pelo falecimento de ${extractedData['falecido'] || '====='}, conforme dispõe na Lei
nº 13.105/2015, regulamentada pela Resolução nº 35 de 24 abril de 2007, do
Conselho Nacional de Justiça, nos seguintes termos e condições:</p>

<p><strong>1. DO(A) AUTOR(A) DA HERANÇA</strong> – O(A) autor(a) da herança,</p>
<p>1.1. Foi casado com o(a) viúvo(a)-meeiro(a), ${extractedData['conjuge'] || extractedData['viuvoMeeiro'] || '====='}, já anteriormente
qualificado(a), desde ${extractedData['dataCasamento'] || '======'}, sob o regime de ${extractedData['regimeBens'] || '====='}, conforme certidão
de casamento expedida aos ${extractedData['dataCertidaoCasamento'] || '==='}, registrada sob a matrícula nº ${extractedData['matriculaCasamento'] || '===='}, pelo
Cartório do ${extractedData['cartorioCasamento'] || extractedData['cartorioImovel'] || '===='};</p>

<p>1.2. Faleceu aos ${extractedData['dataFalecimento'] || '===='}, no Hospital ${extractedData['hospitalFalecimento'] || '===='}, na cidade de ${extractedData['cidadeFalecimento'] || 'Brasília'}, conforme certidão de
óbito expedida aos ${extractedData['dataExpedicaoCertidaoObito'] || '===='}, registrada sob a matrícula nº ${extractedData['matriculaObito'] || '===='}, pelo Cartório do ${extractedData['cartorioObito'] || extractedData['cartorioImovel'] || '==='};</p>

<p>1.3. Do relacionamento do(a) autor(a) da herança com o(a) ora viúvo(a)-
meeiro(a) nasceram ${extractedData['numeroFilhos'] || '===='} filhos, todos maiores e capazes, a saber:
${extractedData['nomesFilhos'] || extractedData['herdeiro1'] || '=========='}, declarando os presentes que desconhece(m) a existência de
outros herdeiros, a não ser o(s) mencionado(s) no presente ato.</p>

<p><strong>DAS DECLARAÇÕES DAS PARTES</strong> - As partes declaram sob as penas da lei,
que:</p>
<p>a) o(a) autor(a) da herança não deixou testamento conhecido, por qualquer
natureza;</p>

${extractedData['testamento'] ? `
<p>a) o(a) falecido(a) deixou testamento que foi aberto nos autos do processo nº${extractedData['processoTestamento'] || '----'}
----------------------------------------- e teve autorização expressa para realização
do inventário por meio de Escritura Pública emanada pelo (a) Juiz (a) ${extractedData['juizTestamento'] || '----'}
-----------------------------, em${extractedData['dataTestamento'] || '--------------------------------------'}, tudo conforme o
estabelecido no artigo 12-B da resolução 35 do Conselho Nacional de Justiça.</p>
` : ''}

<p>b) desconhecem quaisquer débitos em nome do(a) autor(a) da herança, por
ocasião da abertura da sucessão; c) desconhecem quaisquer obrigações
assumidas pelo(a) autor(a) da herança; d) desconhecem a existência de outros
herdeiros, a não ser os que estão presentes nesta escritura; e) a presente
escritura não prejudica os direitos adquiridos e interesses de terceiros; f) não
existem feitos ajuizados fundados em ações reais, pessoais ou reipersecutórias
que afetem os bens e direitos partilhados; g) o(a) falecido(a) não era
empregador(a) ou, de qualquer forma, responsável por recolhimento de
contribuições à Previdência Social; h) os bens ora partilhados encontram-se
livres e desembaraçados de quaisquer ônus, dívidas, tributos de quaisquer
naturezas; i) não tramita inventário e partilha na via judicial.</p>

<p><strong>3. DA NOMEAÇÃO DE INVENTARIANTE</strong> - Os Outorgantes e reciprocamente
Outorgados, de comum acordo, nomeiam como inventariante do espólio, ${extractedData['inventariante'] || '==='}, já anteriormente qualificado(a), conferindo-lhe todos os poderes que se fizerem
necessários para representar o espólio em Juízo ou fora dele; podendo ainda,
praticar todos os atos de administração dos bens, constituir advogado(a) em
nome do espólio, ingressar em juízo, ativa ou passivamente; podendo enfim
praticar todos os atos que se fizerem necessários em defesa do espólio e ao
cumprimento de suas eventuais obrigações;</p>

<p><strong>4. DOS BENS E SEUS VALORES</strong> - O(A) autor(a) da herança deixou, por
ocasião da abertura da sucessão, o(s) seguinte(s) bem(s):</p>
<p>4.1. Apartamento nº ${extractedData['numeroApartamento'] || '======'}, do Bloco "${extractedData['blocoApartamento'] || '====='}", da ${extractedData['quadraApartamento'] || '======'}, desta Capital,
${extractedData['descricaoAdicionalImovel'] || '========com direito a vaga na garagem'}, melhor descrito e caracterizado na
matrícula nº ${extractedData['matriculaImovel'] || '========='}, do ${extractedData['cartorioImovel'] || '====='} º Ofício do Registro de Imóveis do
Distrito Federal. Inscrição do imóvel junto ao GDF sob o nº ${extractedData['inscricaoGDF'] || '========='}</p>

${extractedData['veiculoMarca'] ? `
<p>4.2. VEÍCULO marca ${extractedData['veiculoMarca'] || '==='}, cor ${extractedData['veiculoCor'] || '==='}, categoria PARTICULAR, combustível
${extractedData['veiculoCombustivel'] || 'ÁLCOOL/GASOLINA'}, placa ${extractedData['veiculoPlaca'] || '===='}, chassi nº ${extractedData['veiculoChassi'] || '==='}, ano ${extractedData['veiculoAno'] || '==='}, modelo ${extractedData['veiculoModelo'] || '==='}, renavam nº ${extractedData['veiculoRenavam'] || '===='}, e ao referido bem o(a)(s) herdeiro(a)(s) atribui(em)
meramente para fins em partilha o valor de ${extractedData['veiculoValor'] || '==========='}.</p>
` : ''}

${extractedData['saldoConta'] ? `
<p>4.3. Saldo em Conta corrente/poupança nº ${extractedData['numeroConta'] || '==='}, Agência nº ${extractedData['agenciaConta'] || '==='}, junto ao
Banco ${extractedData['bancoConta'] || '===='}, no valor de ${extractedData['saldoConta'] || '====='} e acréscimos ou deduções se houver;</p>
` : ''}

<p><strong>5. DA PARTILHA</strong> - O(s) bem(s) constante(s) do item "4." da presente, soma(m)
ou valor de ${extractedData['valorTotalBens'] || '===='} e será(ão) partilhado(s) da seguinte forma:</p>
<p>5.1. Caberá ao(a) viúvo(a)-meeiro(a), ${extractedData['conjuge'] || '====='}, em razão de sua meação, 50%
(cinquenta por cento) de todos os bens descritos e caracterizados no item "4."
da presente, correspondendo ao valor de ${extractedData['valorTotalMeacao'] || '===='};</p>
<p>5.2. Caberá a cada um do(s) herdeiro(s), ${extractedData['nomesFilhos'] || extractedData['herdeiro1'] || '===='}, em razão da sucessão legítima,
${extractedData['percentualHerdeiros'] || '===='}, de todos o(s) bem(s) descrito(s) e caracterizados no item "4." da presente,
correspondendo ao valor unitário de ${extractedData['valorUnitarioHerdeiros'] || '==='}.</p>

<p><strong>7. DO IMPOSTO DE TRANSMISSÃO "CAUSA MORTIS" E DOAÇÃO</strong> - Guia de
transmissão causa mortis e doação de quaisquer bens e direitos - ITCMD,
expedida pela Secretaria de Estado da Fazenda do Distrito Federal sob o nº
${extractedData['numeroITCMD'] || '==='}, no valor de ${extractedData['valorITCMD'] || '====='}</p>

<p>Certifica que, foi feita a consulta prévia junto a Central Nacional de Indisponibilidade de Bens - CNIB, no(s) CPF do(a) autor(a) da herança, conforme código hash sob o nº ${extractedData['hashCNIB'] || '===='}, com o resultado NEGATIVO.</p>

<p>Assim o disseram, pediram-me e eu Escrevente lhes lavrei a presente escritura, que feita e lhes sendo lida, foi achada em tudo conforme, aceitam e assinam.</p>
      `;
    case 'Doação':
      return `
        <h1>Doação</h1>
        <p>Doador: ${extractedData['doador'] || 'N/A'}</p>
        <p>Donatário: ${extractedData['donatario'] || 'N/A'}</p>
        <p>Bem Doado: ${extractedData['bemDoado'] || 'N/A'}</p>
        <p>Valor do Bem: ${extractedData['valorDoBem'] || 'N/A'}</p>
      `;
    case 'União Estável':
      return `
        <h1>União Estável</h1>
        <p>Nome do Primeiro Companheiro: ${extractedData['companheiro1'] || extractedData['nomeDoPrimeiroCompanheiro'] || 'N/A'}</p>
        <p>Nome do Segundo Companheiro: ${extractedData['companheiro2'] || extractedData['nomeDoSegundoCompanheiro'] || 'N/A'}</p>
        <p>Data de Início da União: ${extractedData['dataDeInicioDaUniao'] || 'N/A'}</p>
        <p>Regime de Bens: ${extractedData['regimeBens'] || extractedData['regimeDeBens'] || 'N/A'}</p>
      `;
    case 'Procuração':
      return `
        <h1>Procuração</h1>
        <p>Outorgante: ${extractedData['outorgante'] || 'N/A'}</p>
        <p>Outorgado: ${extractedData['outorgado'] || 'N/A'}</p>
        <p>Poderes: ${extractedData['poderes'] || 'N/A'}</p>
        <p>Prazo de Validade: ${extractedData['prazoDeValidade'] || 'N/A'}</p>
      `;
    case 'Testamento':
      return `
        <h1>Testamento</h1>
        <p>Testador: ${extractedData['testador'] || 'N/A'}</p>
        <p>Herdeiros: ${extractedData['herdeiros'] || extractedData['herdeiro1'] || 'N/A'}</p>
        <p>Legados: ${extractedData['legados'] || 'N/A'}</p>
        <p>Testemunhas: ${extractedData['testemunhas'] || 'N/A'}</p>
      `;
    case 'Contrato de Aluguel':
      return `
        <h1>Contrato de Aluguel</h1>
        <p>Locador: ${extractedData['locador'] || 'N/A'}</p>
        <p>Locatário: ${extractedData['locatario'] || 'N/A'}</p>
        <p>Endereço do Imóvel: ${extractedData['enderecoDoImovel'] || 'N/A'}</p>
        <p>Valor do Aluguel: ${extractedData['valorDoAluguel'] || 'N/A'}</p>
        <p>Prazo do Contrato: ${extractedData['prazoDoContrato'] || 'N/A'}</p>
      `;
    case 'Contrato Social':
      return `
        <h1>Contrato Social</h1>
        <p>Nome da Empresa: ${extractedData['nomeDaEmpresa'] || 'N/A'}</p>
        <p>CNPJ: ${extractedData['cnpj'] || 'N/A'}</p>
        <p>Sócio 1: ${extractedData['socio1'] || 'N/A'}</p>
        <p>Sócio 2: ${extractedData['socio2'] || 'N/A'}</p>
        <p>Capital Social: ${extractedData['capitalSocial'] || 'N/A'}</p>
        <p>Objeto Social: ${extractedData['objetoSocial'] || 'N/A'}</p>
      `;
    case 'Outro':
      return `
        <h1>Outro Documento</h1>
        <p>Título do Documento: ${extractedData['tituloDoDocumento'] || 'N/A'}</p>
        <p>Partes Envolvidas: ${extractedData['partesEnvolvidas'] || extractedData['nome'] || 'N/A'}</p>
        <p>Objeto: ${extractedData['objeto'] || 'N/A'}</p>
      `;
    default:
      return `<h1>${documentType}</h1><p>Tipo de documento não suportado.</p>`;
  }
}

