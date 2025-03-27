
import { DraftType } from '@/types';
import { identifyPartiesAndRoles } from './partyIdentifier';

// Function to extract text from PDF files
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
                setTimeout(() => reject(new Error("PDF processing timeout")), 30000);
              });
              
              const processingPromise = new Promise<string>(async (resolveProcessing) => {
                try {
                  const loadingTask = pdfjsLib.getDocument(typedArray);
                  const pdfDocument = await loadingTask.promise;
                  
                  let fullText = '';
                  const maxPages = Math.min(pdfDocument.numPages, 20); // Limit to 20 pages for performance
                  
                  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
                    try {
                      const page = await pdfDocument.getPage(pageNum);
                      const textContent = await page.getTextContent();
                      const pageText = textContent.items
                        .map(item => 'str' in item ? (item as any).str : '')
                        .join(' ');
                      fullText += pageText + '\n';
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
      
      // Set a timeout for the overall file reading process
      const timeoutId = setTimeout(() => {
        console.warn("PDF file reading timed out");
        resolve("");
      }, 10000);
      
      reader.onloadend = () => {
        clearTimeout(timeoutId);
      };
      
      try {
        reader.readAsArrayBuffer(file);
      } catch (readError) {
        console.warn("Error calling readAsArrayBuffer:", readError);
        clearTimeout(timeoutId);
        resolve("");
      }
    } catch (error) {
      console.warn("Unexpected error in extractTextFromPDF:", error);
      resolve("");
    }
  });
}

// Function to extract text from image files using OCR
async function extractTextFromImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      
      reader.onload = async function () {
        try {
          if (!reader.result) {
            console.warn("File reader returned empty result for image");
            resolve("");
            return;
          }
          
          try {
            // Set a timeout for Tesseract processing
            const timeoutPromise = new Promise<string>((_, reject) => {
              setTimeout(() => reject(new Error("OCR processing timeout")), 30000);
            });
            
            const ocrPromise = new Promise<string>(async (resolveOcr) => {
              try {
                const Tesseract = await import('tesseract.js');
                const { data: { text } } = await Tesseract.recognize(
                  reader.result as string,
                  'por', // Portuguese language
                  { logger: m => console.log(m) }
                );
                resolveOcr(text || "");
              } catch (ocrError) {
                console.warn("Error during OCR processing:", ocrError);
                resolveOcr("");
              }
            });
            
            // Race between timeout and OCR processing
            const result = await Promise.race([ocrPromise, timeoutPromise])
              .catch(error => {
                console.warn("OCR timed out or failed:", error);
                return "";
              });
            
            resolve(result);
          } catch (importError) {
            console.warn("Error importing Tesseract:", importError);
            resolve("");
          }
        } catch (error) {
          console.warn("Error extracting text from image:", error);
          resolve("");
        }
      };
      
      reader.onerror = (error) => {
        console.warn("Error reading image file:", error);
        resolve("");
      };
      
      try {
        reader.readAsDataURL(file);
      } catch (readError) {
        console.warn("Error calling readAsDataURL:", readError);
        resolve("");
      }
    } catch (error) {
      console.warn("Unexpected error in extractTextFromImage:", error);
      resolve("");
    }
  });
}

// Function to extract text from DOCX files
async function extractTextFromDOCX(file: File): Promise<string> {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      
      reader.onload = async function (e) {
        try {
          if (!e.target?.result) {
            console.warn("File reader returned empty result for DOCX");
            resolve("");
            return;
          }
          
          try {
            // Set a timeout for mammoth processing
            const timeoutPromise = new Promise<string>((_, reject) => {
              setTimeout(() => reject(new Error("DOCX processing timeout")), 20000);
            });
            
            const docxPromise = new Promise<string>(async (resolveDocx) => {
              try {
                const mammoth = await import('mammoth');
                const arrayBuffer = e.target.result as ArrayBuffer;
                const { value } = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
                resolveDocx(value || "");
              } catch (mammothError) {
                console.warn("Error extracting text with mammoth:", mammothError);
                resolveDocx("");
              }
            });
            
            // Race between timeout and DOCX processing
            const result = await Promise.race([docxPromise, timeoutPromise])
              .catch(error => {
                console.warn("DOCX processing timed out or failed:", error);
                return "";
              });
            
            resolve(result);
          } catch (importError) {
            console.warn("Error importing mammoth:", importError);
            resolve("");
          }
        } catch (error) {
          console.warn("Error extracting text from DOCX:", error);
          resolve("");
        }
      };
      
      reader.onerror = (error) => {
        console.warn("Error reading DOCX file:", error);
        resolve("");
      };
      
      try {
        reader.readAsArrayBuffer(file);
      } catch (readError) {
        console.warn("Error calling readAsArrayBuffer for DOCX:", readError);
        resolve("");
      }
    } catch (error) {
      console.warn("Unexpected error in extractTextFromDOCX:", error);
      resolve("");
    }
  });
}

// Export the identifyPartiesAndRoles function to be used elsewhere
export { identifyPartiesAndRoles };

// Enhance the extractDataFromFiles function to perform deeper analysis
export async function extractDataFromFiles(files: File[]): Promise<{ [key: string]: any }> {
  const extractedData: { [key: string]: any } = {};
  
  try {
    console.log('Iniciando extração de dados de', files.length, 'arquivo(s)');
    
    if (!files || files.length === 0) {
      console.warn('Nenhum arquivo para processar');
      return extractedData;
    }
    
    // Set an overall timeout for the entire extraction process
    const startTime = Date.now();
    const maxProcessingTime = 45000; // 45 seconds maximum
    
    // Process each file with time tracking
    for (const file of files) {
      // Check if we've exceeded the total processing time
      if (Date.now() - startTime > maxProcessingTime) {
        console.warn('Tempo máximo de extração excedido, interrompendo processamento');
        break;
      }
      
      if (!file) {
        console.warn('Arquivo inválido encontrado na lista');
        continue;
      }
      
      console.log('Processando arquivo:', file.name, 'tipo:', file.type);
      
      // Extract text content from the file based on its type
      let textContent = '';
      
      try {
        const fileType = file.type.toLowerCase();
        const fileName = file.name.toLowerCase();
        
        // PDF processing
        if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
          textContent = await extractTextFromPDF(file);
        } 
        // Image processing
        else if (fileType.includes('image') || /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(fileName)) {
          textContent = await extractTextFromImage(file);
        } 
        // Document processing
        else if (fileType.includes('document') || fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
          textContent = await extractTextFromDOCX(file);
        } else {
          console.warn(`Tipo de arquivo não suportado: ${fileType}`);
        }
        
        if (textContent) {
          console.log('Texto extraído com sucesso do arquivo:', file.name);
          console.log('Analisando conteúdo para extração de dados...');
          
          // Extract basic data points
          extractDataPoints(textContent, extractedData);
        } else {
          console.warn(`Nenhum texto extraído do arquivo: ${file.name}`);
        }
      } catch (fileProcessError) {
        console.error(`Erro ao processar arquivo ${file.name}:`, fileProcessError);
        // Continue with other files
      }
    }
    
    return extractedData;
  } catch (error) {
    console.error('Erro na extração de dados:', error);
    return { error: 'Erro ao extrair dados dos arquivos' };
  }
}

// Existing function for extracting data points
function extractDataPoints(text: string, extractedData: { [key: string]: any }): void {
  // Extract names with roles if possible
  const rolePatterns = [
    { role: 'vendedor', pattern: /vendedor[:\s]+([A-Z][a-zÀ-ÿ]+\s(?:[A-Z][a-zÀ-ÿ]+\s)*[A-Z][a-zÀ-ÿ]+)/i },
    { role: 'comprador', pattern: /comprador[:\s]+([A-Z][a-zÀ-ÿ]+\s(?:[A-Z][a-zÀ-ÿ]+\s)*[A-Z][a-zÀ-ÿ]+)/i },
    { role: 'falecido', pattern: /falecido[:\s]+([A-Z][a-zÀ-ÿ]+\s(?:[A-Z][a-zÀ-ÿ]+\s)*[A-Z][a-zÀ-ÿ]+)/i },
    { role: 'herdeiro', pattern: /herdeiro[:\s]+([A-Z][a-zÀ-ÿ]+\s(?:[A-Z][a-zÀ-ÿ]+\s)*[A-Z][a-zÀ-ÿ]+)/i },
    { role: 'inventariante', pattern: /inventariante[:\s]+([A-Z][a-zÀ-ÿ]+\s(?:[A-Z][a-zÀ-ÿ]+\s)*[A-Z][a-zÀ-ÿ]+)/i },
    { role: 'doador', pattern: /doador[:\s]+([A-Z][a-zÀ-ÿ]+\s(?:[A-Z][a-zÀ-ÿ]+\s)*[A-Z][a-zÀ-ÿ]+)/i },
    { role: 'donatário', pattern: /donatário[:\s]+([A-Z][a-zÀ-ÿ]+\s(?:[A-Z][a-zÀ-ÿ]+\s)*[A-Z][a-zÀ-ÿ]+)/i },
    { role: 'locador', pattern: /locador[:\s]+([A-Z][a-zÀ-ÿ]+\s(?:[A-Z][a-zÀ-ÿ]+\s)*[A-Z][a-zÀ-ÿ]+)/i },
    { role: 'locatário', pattern: /locatário[:\s]+([A-Z][a-zÀ-ÿ]+\s(?:[A-Z][a-zÀ-ÿ]+\s)*[A-Z][a-zÀ-ÿ]+)/i }
  ];

  // Safety check for text input
  if (!text || typeof text !== 'string') {
    console.warn('Texto inválido recebido para extração de dados');
    return;
  }

  rolePatterns.forEach(({ role, pattern }) => {
    try {
      const match = text.match(pattern);
      if (match && match[1]) {
        extractedData[role] = match[1].trim();
      }
    } catch (patternError) {
      console.warn(`Erro ao aplicar padrão para ${role}:`, patternError);
    }
  });

  // Look for paragraphs that might contain multiple heirs
  try {
    if (text.includes('herdeiro') || text.includes('Herdeiro')) {
      const heirsParagraphMatch = text.match(/(?:herdeiros?|Herdeiros?).*?(?:\.|$)/gm);
      if (heirsParagraphMatch) {
        const heirsParagraph = heirsParagraphMatch.join(' ');
        const namesMatch = heirsParagraph.match(/[A-Z][a-zÀ-ÿ]+\s(?:[A-Z][a-zÀ-ÿ]+\s)*[A-Z][a-zÀ-ÿ]+/g);
        if (namesMatch && namesMatch.length > 0) {
          extractedData['herdeiros'] = namesMatch.join(', ');
        }
      }
    }
  } catch (heirsError) {
    console.warn('Erro ao extrair herdeiros:', heirsError);
  }
  
  // Ensure we have at least some basic data
  if (Object.keys(extractedData).length === 0) {
    try {
      // Extract any name-like patterns as a fallback
      const namePatterns = text.match(/[A-Z][a-zÀ-ÿ]+\s(?:[A-Z][a-zÀ-ÿ]+\s)+[A-Z][a-zÀ-ÿ]+/g);
      if (namePatterns && namePatterns.length > 0) {
        extractedData['nome'] = namePatterns[0].trim();
      }
    } catch (nameError) {
      console.warn('Erro ao extrair padrões de nome:', nameError);
    }
  }
}

// Existing code for document content generation
export function generateDocumentContent(documentType: DraftType, extractedData: { [key: string]: any }): string {
  switch (documentType) {
    case 'Escritura de Compra e Venda':
      return `
        <h1>Escritura de Compra e Venda</h1>
        <p>Vendedor: ${extractedData['vendedor'] || 'N/A'}</p>
        <p>Comprador: ${extractedData['comprador'] || 'N/A'}</p>
        <p>Valor do Imóvel: ${extractedData['valorDoImovel'] || 'N/A'}</p>
        <p>Descrição do Imóvel: ${extractedData['descricaoDoImovel'] || 'N/A'}</p>
      `;
    case 'Inventário':
      return `
        <h1>Inventário</h1>
        <p>Nome do Autor da Herança: ${extractedData['nomeDoAutorDaHeranca'] || 'N/A'}</p>
        <p>Data do Falecimento: ${extractedData['dataDoFalecimento'] || 'N/A'}</p>
        <p>Existência de Testamento: ${extractedData['existenciaDeTestamento'] ? 'Sim' : 'Não'}</p>
        <p>Regime de Bens: ${extractedData['regimeDeBens'] || 'N/A'}</p>
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
        <p>Nome do Primeiro Companheiro: ${extractedData['nomeDoPrimeiroCompanheiro'] || 'N/A'}</p>
        <p>Nome do Segundo Companheiro: ${extractedData['nomeDoSegundoCompanheiro'] || 'N/A'}</p>
        <p>Data de Início da União: ${extractedData['dataDeInicioDaUniao'] || 'N/A'}</p>
        <p>Regime de Bens: ${extractedData['regimeDeBens'] || 'N/A'}</p>
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
        <p>Herdeiros: ${extractedData['herdeiros'] || 'N/A'}</p>
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
        <p>Partes Envolvidas: ${extractedData['partesEnvolvidas'] || 'N/A'}</p>
        <p>Objeto: ${extractedData['objeto'] || 'N/A'}</p>
      `;
    default:
      return `<p>Tipo de documento não suportado.</p>`;
  }
}
