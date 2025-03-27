import { DraftType } from '@/types';
import { identifyPartiesAndRoles } from './partyIdentifier';

// Function to extract text from PDF files
async function extractTextFromPDF(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = async function () {
        try {
          if (!reader.result) {
            throw new Error("File reader returned empty result");
          }
          
          const typedArray = new Uint8Array(reader.result as ArrayBuffer);
          const pdfjsLib = await import('pdfjs-dist');
          pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.js`;
          
          try {
            const pdfDocument = await pdfjsLib.getDocument(typedArray).promise;

            let fullText = '';
            for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
              try {
                const page = await pdfDocument.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageText = textContent.items
                  .map(item => {
                    // Check if the item has a 'str' property before accessing it
                    return 'str' in item ? (item as any).str : '';
                  })
                  .join(' ');
                fullText += pageText + '\n';
              } catch (pageError) {
                console.error(`Error extracting text from page ${pageNum}:`, pageError);
                // Continue with other pages even if one fails
              }
            }
            resolve(fullText || ""); // Ensure we at least return an empty string
          } catch (pdfError) {
            console.error("Error processing PDF document:", pdfError);
            // Return empty string rather than rejecting to allow processing to continue
            resolve("");
          }
        } catch (error) {
          console.error("Error extracting text from PDF:", error);
          // Return empty string rather than rejecting to allow processing to continue
          resolve("");
        }
      };
      reader.onerror = (error) => {
        console.error("Error reading PDF file:", error);
        // Return empty string rather than rejecting to allow processing to continue
        resolve("");
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Unexpected error reading PDF file:", error);
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
            console.error("File reader returned empty result for image");
            resolve("");
            return;
          }
          
          const Tesseract = await import('tesseract.js');
          try {
            const { data: { text } } = await Tesseract.recognize(
              reader.result as string,
              'por', // Use Portuguese language
              { logger: m => console.log(m) }
            );
            resolve(text || "");
          } catch (ocrError) {
            console.error("Error during OCR processing:", ocrError);
            resolve("");
          }
        } catch (error) {
          console.error("Error extracting text from image:", error);
          resolve("");
        }
      };
      reader.onerror = (error) => {
        console.error("Error reading image file:", error);
        resolve("");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Unexpected error reading image file:", error);
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
            console.error("File reader returned empty result for DOCX");
            resolve("");
            return;
          }
          
          // Import mammoth module properly
          const mammoth = await import('mammoth');
          try {
            const arrayBuffer = e.target.result as ArrayBuffer;
            const { value } = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
            resolve(value || "");
          } catch (mammothError) {
            console.error("Error extracting text with mammoth:", mammothError);
            resolve("");
          }
        } catch (error) {
          console.error("Error extracting text from DOCX:", error);
          resolve("");
        }
      };
      reader.onerror = (error) => {
        console.error("Error reading DOCX file:", error);
        resolve("");
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Unexpected error reading DOCX file:", error);
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
    
    // Process each file
    for (const file of files) {
      if (!file) {
        console.warn('Arquivo inválido encontrado na lista');
        continue;
      }
      
      console.log('Processando arquivo:', file.name, 'tipo:', file.type);
      
      // Extract text content from the file based on its type
      let textContent = '';
      
      try {
        if (file.type === 'application/pdf') {
          // PDF processing
          textContent = await extractTextFromPDF(file);
        } else if (file.type.includes('image')) {
          // Image processing
          textContent = await extractTextFromImage(file);
        } else if (file.type.includes('document') || file.name.endsWith('.docx')) {
          // Document processing
          textContent = await extractTextFromDOCX(file);
        } else {
          console.warn(`Tipo de arquivo não suportado: ${file.type}`);
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

  rolePatterns.forEach(({ role, pattern }) => {
    const match = text.match(pattern);
    if (match && match[1]) {
      extractedData[role] = match[1].trim();
    }
  });

  // Look for paragraphs that might contain multiple heirs
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
