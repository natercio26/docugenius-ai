
import { DraftType } from '@/types';
import * as PDFJS from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

// Set up the PDF.js worker
const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
PDFJS.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// Function to read file contents
export const readFileContents = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target && event.target.result) {
        if (typeof event.target.result === 'string') {
          resolve(event.target.result);
        } else {
          // For array buffers (PDF files)
          resolve("Array buffer read successfully");
        }
      } else {
        reject(new Error('Failed to read file content'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    if (file.type === 'application/pdf') {
      reader.readAsArrayBuffer(file);
    } else if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  });
};

// Parse PDF content using PDF.js (browser-compatible)
const parsePdfContent = async (file: File): Promise<string> => {
  try {
    console.log("Starting PDF extraction process for:", file.name);
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document using PDF.js
    const pdf = await PDFJS.getDocument({ data: arrayBuffer }).promise;
    console.log(`PDF loaded with ${pdf.numPages} pages`);
    
    let fullText = '';
    
    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
      console.log(`Extracted text from page ${i}, length: ${pageText.length} characters`);
    }
    
    console.log("PDF extraction complete, full text length:", fullText.length);
    console.log("Sample text content:", fullText.substring(0, 200) + "...");
    return fullText;
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
};

// Extract text from images using OCR
const extractTextFromImage = async (file: File): Promise<string> => {
  try {
    console.log("Starting OCR for image:", file.name);
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = async (event) => {
        if (event.target && event.target.result) {
          const imageData = event.target.result.toString();
          
          console.log("Image loaded, beginning OCR processing");
          
          const result = await Tesseract.recognize(
            imageData,
            'por', // Portuguese language
            { 
              logger: msg => {
                if (msg.status === 'recognizing text') {
                  console.log(`OCR progress: ${(msg.progress * 100).toFixed(2)}%`);
                }
              } 
            }
          );
          
          console.log("OCR completed, extracted text length:", result.data.text.length);
          console.log("Sample OCR text:", result.data.text.substring(0, 200) + "...");
          resolve(result.data.text);
        } else {
          reject(new Error('Failed to read image'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading image file'));
      };
      
      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.error("Error extracting text from image:", error);
    throw new Error(`Failed to extract text from image: ${error.message}`);
  }
};

// Extract data from files based on their content
export const extractDataFromFiles = async (files: File[]): Promise<Record<string, string>> => {
  const extractedData: Record<string, string> = {};
  
  try {
    console.log(`Starting to process ${files.length} files for data extraction`);
    
    if (files.length === 0) {
      console.error("No files provided for extraction");
      return { error: "Nenhum arquivo fornecido para extração de dados." };
    }
    
    // Process each uploaded file
    for (const file of files) {
      let content = "";
      
      try {
        console.log(`Processing file: ${file.name}, type: ${file.type}`);
        
        if (file.type === 'application/pdf') {
          // For PDFs, extract text content using PDF.js
          content = await parsePdfContent(file);
          console.log(`PDF content extracted, length: ${content.length} characters`);
        } else if (file.type.startsWith('image/')) {
          // For images, use OCR to extract text
          content = await extractTextFromImage(file);
          console.log(`Image OCR completed, extracted text length: ${content.length} characters`);
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          // For DOCX, we're still using filename (would need a different approach for full implementation)
          content = file.name;
          console.log("DOCX processing not fully implemented, using filename");
        } else {
          // For text files, read the content directly
          content = await readFileContents(file);
          console.log(`Text file content read, length: ${content.length} characters`);
        }
        
        if (!content || content.trim() === '') {
          console.warn(`No content extracted from file: ${file.name}`);
          continue;
        }
        
        // Extract information based on content
        console.log("Attempting to extract data from content");
        extractDataFromFileContent(file.name, content, extractedData);
        
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }
    
    console.log("Final extracted data:", extractedData);
    
    // If we didn't extract any meaningful data, add a warning
    if (Object.keys(extractedData).length === 0) {
      console.warn("No data could be extracted from the provided files");
      return { error: "Não foi possível extrair dados dos documentos fornecidos." };
    }
    
    return extractedData;
  } catch (error) {
    console.error('Error extracting data from files:', error);
    return { error: "Falha ao processar documentos: " + error.message };
  }
};

// Helper function to extract data from file content
const extractDataFromFileContent = (
  fileName: string, 
  content: string, 
  extractedData: Record<string, string>
): void => {
  // Convert to lowercase for easier matching
  const lowerFileName = fileName.toLowerCase();
  const lowerContent = content.toLowerCase();
  
  console.log(`Extracting data from: ${fileName}`);
  console.log("Content sample for pattern matching:", content.substring(0, 500) + "...");
  
  // Inventory document patterns (Inventário)
  if (lowerFileName.includes('inventario') || 
      lowerContent.includes('inventário') || 
      lowerContent.includes('espólio') ||
      lowerContent.includes('de cujus') ||
      lowerContent.includes('falecido')) {
    
    console.log("Identified as inventory document");
    
    // Try to extract the deceased person's name
    const deceasedMatch = content.match(/(?:falecido|de cujus|inventariado)(?:[:\s]+)([A-Za-zÀ-ÖØ-öø-ÿ\s]+?)(?:[,\.]|$)/i) ||
                          content.match(/espólio\s+de\s+([A-Za-zÀ-ÖØ-öø-ÿ\s]+?)(?:[,\.]|$)/i);
    if (deceasedMatch && deceasedMatch[1]) {
      extractedData.falecido = deceasedMatch[1].trim();
      console.log(`Extracted deceased person: ${extractedData.falecido}`);
    }
    
    // Try to extract death date
    const deathDateMatch = content.match(/(?:falecido\s+em|data\s+do\s+óbito)(?:[:\s]+)([\d\/]+)/i);
    if (deathDateMatch && deathDateMatch[1]) {
      extractedData.dataFalecimento = deathDateMatch[1].trim();
      console.log(`Extracted death date: ${extractedData.dataFalecimento}`);
    }
    
    // Try to extract inventory administrator
    const inventoryAdminMatch = content.match(/(?:inventariante)(?:[:\s]+)([A-Za-zÀ-ÖØ-öø-ÿ\s]+?)(?:[,\.]|$)/i);
    if (inventoryAdminMatch && inventoryAdminMatch[1]) {
      extractedData.inventariante = inventoryAdminMatch[1].trim();
      console.log(`Extracted inventory administrator: ${extractedData.inventariante}`);
    }
    
    // Try to extract heirs
    const heirMatch = content.match(/(?:herdeiro|herdeira)(?:[:\s]+)([A-Za-zÀ-ÖØ-öø-ÿ\s]+?)(?:[,\.]|$)/i);
    if (heirMatch && heirMatch[1]) {
      extractedData.herdeiro1 = heirMatch[1].trim();
      console.log(`Extracted heir: ${extractedData.herdeiro1}`);
    }
    
    // Scan for additional heirs
    const heirLines = content.match(/(?:herdeiros)(?:[:\s]+)([^\n]+)/i);
    if (heirLines && heirLines[1]) {
      const heirList = heirLines[1].split(',');
      if (heirList.length > 0 && !extractedData.herdeiro1) {
        extractedData.herdeiro1 = heirList[0].trim();
        console.log(`Extracted heir 1: ${extractedData.herdeiro1}`);
      }
      if (heirList.length > 1) {
        extractedData.herdeiro2 = heirList[1].trim();
        console.log(`Extracted heir 2: ${extractedData.herdeiro2}`);
      }
    }
  }
  
  // RG/Identity document patterns
  if (lowerFileName.includes('identidade') || 
      lowerFileName.includes('rg') || 
      lowerContent.includes('documento de identidade') || 
      lowerContent.includes('registro geral')) {
    
    console.log("Identified as identity document");
    
    // Try to extract name pattern (usually "Nome: [name]" or similar)
    const nameMatch = content.match(/Nome:?\s+([A-Za-zÀ-ÖØ-öø-ÿ\s]+)/i);
    if (nameMatch && nameMatch[1]) {
      extractedData.nome = nameMatch[1].trim();
      console.log(`Extracted name: ${extractedData.nome}`);
    }
    
    // Try to extract RG number
    const rgMatch = content.match(/RG:?\s*([\d.-]+\s*[A-Za-z/]*)/i) || 
                    content.match(/([\d]{1,2}\.[\d]{3}\.[\d]{3}-[0-9A-Za-z])/i);
    if (rgMatch && rgMatch[1]) {
      extractedData.rg = rgMatch[1].trim();
      console.log(`Extracted RG: ${extractedData.rg}`);
    }
    
    // Try to extract CPF number
    const cpfMatch = content.match(/CPF:?\s*([\d.-]+)/i) || 
                     content.match(/([\d]{3}\.[\d]{3}\.[\d]{3}-[\d]{2})/i);
    if (cpfMatch && cpfMatch[1]) {
      extractedData.cpf = cpfMatch[1].trim();
      console.log(`Extracted CPF: ${extractedData.cpf}`);
    }
  }
  
  // Property/Real estate document patterns
  if (lowerFileName.includes('imovel') || 
      lowerFileName.includes('matricula') || 
      lowerFileName.includes('escritura') || 
      lowerContent.includes('imóvel') ||
      lowerContent.includes('matrícula')) {
    
    console.log("Identified as property document");
    
    // Try to extract property address with improved patterns
    const addressMatch = content.match(/endereço:?\s+([^,.]+(,|\.)[^,.]+)/i) ||
                         content.match(/situado\s+(?:na|no|em)\s+([^,.]+(,|\.)[^,.]+)/i) ||
                         content.match(/imóvel\s+(?:localizado|situado)\s+(?:na|no|em)\s+([^,.]+(,|\.)[^,.]+)/i);
    if (addressMatch && addressMatch[1]) {
      extractedData.enderecoImovel = addressMatch[1].trim();
      console.log(`Extracted property address: ${extractedData.enderecoImovel}`);
    }
    
    // Try to extract property value with improved patterns
    const valueMatch = content.match(/valor:?\s+(R\$\s*[\d.,]+)/i) ||
                       content.match(/(R\$\s*[\d.,]+\s*(?:\(.*?\))?)/i) ||
                       content.match(/preço\s+(?:de|no valor de)\s+(R\$\s*[\d.,]+)/i);
    if (valueMatch && valueMatch[1]) {
      extractedData.valorImovel = valueMatch[1].trim();
      console.log(`Extracted property value: ${extractedData.valorImovel}`);
    }
    
    // Try to extract property registration number with improved patterns
    const regMatch = content.match(/matrícula\s+(?:n[º°]|número)?\s*([\d.]+)/i) ||
                     content.match(/registrado\s+sob\s+(?:a\s+)?matrícula\s+(?:n[º°]|número)?\s*([\d.]+)/i);
    if (regMatch && regMatch[1]) {
      extractedData.registroImovel = `matrícula nº ${regMatch[1].trim()}`;
      console.log(`Extracted property registration: ${extractedData.registroImovel}`);
    }
    
    // Try to extract property area with improved patterns
    const areaMatch = content.match(/área\s+(?:de)?\s*([\d,.]+\s*m²)/i) ||
                      content.match(/área\s+(?:de)?\s*([\d,.]+\s*metros quadrados)/i);
    if (areaMatch && areaMatch[1]) {
      extractedData.areaImovel = areaMatch[1].trim();
      console.log(`Extracted property area: ${extractedData.areaImovel}`);
    }
  }
  
  // Purchase/Sale document patterns
  if (lowerFileName.includes('compra') || 
      lowerFileName.includes('venda') || 
      lowerContent.includes('compra e venda')) {
    
    console.log("Identified as purchase/sale document");
    
    // Try to extract seller name with improved patterns
    const sellerMatch = content.match(/vendedor:?\s+([A-Za-zÀ-ÖØ-öø-ÿ\s]+?)(?:[,\.]|$)/i) ||
                        content.match(/outorgante(?:\s+vendedor)?:?\s+([A-Za-zÀ-ÖØ-öø-ÿ\s]+?)(?:[,\.]|$)/i);
    if (sellerMatch && sellerMatch[1]) {
      extractedData.vendedor = sellerMatch[1].trim();
      console.log(`Extracted seller: ${extractedData.vendedor}`);
    }
    
    // Try to extract buyer name with improved patterns
    const buyerMatch = content.match(/comprador:?\s+([A-Za-zÀ-ÖØ-öø-ÿ\s]+?)(?:[,\.]|$)/i) ||
                       content.match(/outorgado(?:\s+comprador)?:?\s+([A-Za-zÀ-ÖØ-öø-ÿ\s]+?)(?:[,\.]|$)/i);
    if (buyerMatch && buyerMatch[1]) {
      extractedData.nome = buyerMatch[1].trim();
      console.log(`Extracted buyer: ${extractedData.nome}`);
    }
  }
  
  // Additional document-type identification based on file name
  if (lowerFileName.includes('doacao') || lowerContent.includes('doação')) {
    console.log("Identified as donation document");
    
    // Try to extract donor
    const donorMatch = content.match(/doador:?\s+([A-Za-zÀ-ÖØ-öø-ÿ\s]+?)(?:[,\.]|$)/i) ||
                       content.match(/outorgante(?:\s+doador)?:?\s+([A-Za-zÀ-ÖØ-öø-ÿ\s]+?)(?:[,\.]|$)/i);
    if (donorMatch && donorMatch[1]) {
      extractedData.doador = donorMatch[1].trim();
      console.log(`Extracted donor: ${extractedData.doador}`);
    }
    
    // Try to extract donee
    const doneeMatch = content.match(/donatário:?\s+([A-Za-zÀ-ÖØ-öø-ÿ\s]+?)(?:[,\.]|$)/i) ||
                       content.match(/outorgado(?:\s+donatário)?:?\s+([A-Za-zÀ-ÖØ-öø-ÿ\s]+?)(?:[,\.]|$)/i);
    if (doneeMatch && doneeMatch[1]) {
      extractedData.donatario = doneeMatch[1].trim();
      console.log(`Extracted donee: ${extractedData.donatario}`);
    }
  }
  
  // Additional pattern matching for common text found in Brazilian documents
  
  // Look for any name patterns with common Brazilian document formatting
  if (!extractedData.nome) {
    const brazilianNameMatch = 
      content.match(/(?:nome completo|nome)[:;]\s*([A-Za-zÀ-ÖØ-öø-ÿ\s]+?)(?:[,\.]|$)/i) || 
      content.match(/solicitante\s*[:;]?\s*([A-Za-zÀ-ÖØ-öø-ÿ\s]+?)(?:[,\.]|$)/i) ||
      content.match(/\b([A-Za-zÀ-ÖØ-öø-ÿ]{2,}\s+[A-Za-zÀ-ÖØ-öø-ÿ]{2,}(?:\s+[A-Za-zÀ-ÖØ-öø-ÿ]{2,}){0,3})\b/);
    
    if (brazilianNameMatch && brazilianNameMatch[1]) {
      extractedData.nome = brazilianNameMatch[1].trim();
      console.log(`Extracted name using Brazilian pattern: ${extractedData.nome}`);
    }
  }
  
  // Try to extract any dates (birth dates, issue dates, etc.)
  const dateMatches = content.match(/data\s+(?:de\s+)?(?:nascimento|emissão|expedição|solicitação):?\s+(\d{2}\/\d{2}\/\d{4})/gi);
  if (dateMatches && dateMatches.length > 0) {
    const dateStr = dateMatches[0].split(':')[1]?.trim() || dateMatches[0];
    extractedData.data = dateStr;
    console.log(`Extracted date: ${extractedData.data}`);
  }
  
  // Try to extract professions
  const professionMatch = content.match(/profissão:?\s+([A-Za-zÀ-ÖØ-öø-ÿ\s]+?)(?:,|\.|;)/i);
  if (professionMatch && professionMatch[1]) {
    extractedData.profissao = professionMatch[1].trim();
    console.log(`Extracted profession: ${extractedData.profissao}`);
  }
  
  // Try to extract civil status
  const civilStatusMatch = content.match(/(?:estado\s+civil|estado):?\s+([A-Za-zÀ-ÖØ-öø-ÿ\s]+?)(?:,|\.|;)/i);
  if (civilStatusMatch && civilStatusMatch[1]) {
    extractedData.estadoCivil = civilStatusMatch[1].trim();
    console.log(`Extracted civil status: ${extractedData.estadoCivil}`);
  }
  
  // Try to extract nationality
  const nationalityMatch = content.match(/(?:nacionalidade):?\s+([A-Za-zÀ-ÖØ-öø-ÿ\s]+?)(?:,|\.|;)/i);
  if (nationalityMatch && nationalityMatch[1]) {
    extractedData.nacionalidade = nationalityMatch[1].trim();
    console.log(`Extracted nationality: ${extractedData.nacionalidade}`);
  }
};

// Generate document content based on template type and extracted data
export const generateDocumentContent = (
  type: DraftType, 
  data: Record<string, string>
): string => {
  console.log("Generating document content with data:", data);
  let content = '';
  
  // Get month name in Portuguese
  const getMonthName = (date: Date): string => {
    const monthNames = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];
    return monthNames[date.getMonth()];
  };
  
  // Format today's date
  const today = new Date();
  const formattedDate = `${today.getDate()} de ${getMonthName(today)} de ${today.getFullYear()}`;
  
  // If there's a warning message or error, show a placeholder document with the warning
  if (data.warning || data.error) {
    return `ATENÇÃO: ${data.warning || data.error}

Não foi possível extrair dados suficientes dos documentos fornecidos para gerar uma minuta completa. 
Por favor, verifique se os documentos estão legíveis e contêm as informações necessárias.

Você também pode editar esta minuta manualmente para incluir os dados corretos.

MODELO DE DOCUMENTO - ${type}
Data: ${formattedDate}`;
  }

  switch(type) {
    case 'Escritura de Compra e Venda':
      content = `ESCRITURA PÚBLICA DE COMPRA E VENDA

SAIBAM todos quantos esta Escritura Pública de Compra e Venda virem que, aos ${formattedDate}, nesta cidade e comarca de São Paulo, Estado de São Paulo, perante mim, Tabelião, compareceram as partes entre si justas e contratadas, a saber:

OUTORGANTE VENDEDOR: ${data.vendedor || 'JOÃO DA SILVA'}, ${data.nacionalidade || 'brasileiro'}, ${data.estadoCivil || 'casado'}, ${data.profissao || 'empresário'}, portador da Cédula de Identidade RG nº ${data.rgVendedor || '12.345.678-9 SSP/SP'}, inscrito no CPF/MF sob nº ${data.cpfVendedor || '123.456.789-00'}, residente e domiciliado na ${data.enderecoVendedor || 'Rua das Flores, nº 123, Bairro Jardim, CEP 01234-567, nesta Capital'};

OUTORGADO COMPRADOR: ${data.nome || 'MARIA OLIVEIRA'}, ${data.nacionalidade || 'brasileira'}, ${data.estadoCivil || 'solteira'}, ${data.profissao || 'advogada'}, portadora da Cédula de Identidade RG nº ${data.rg || '98.765.432-1 SSP/SP'}, inscrita no CPF/MF sob nº ${data.cpf || '987.654.321-00'}, residente e domiciliada na ${data.endereco || 'Avenida Central, nº 456, Bairro Centro, CEP 12345-678, nesta Capital'};

Os presentes, juridicamente capazes, identificados por mim, Tabelião, conforme documentos apresentados, do que dou fé.

E, pelo OUTORGANTE VENDEDOR, me foi dito que é legítimo proprietário do seguinte imóvel:

IMÓVEL: ${data.descricaoImovel || `Apartamento nº 101, localizado no 10º andar do Edifício Residencial Primavera`}, situado na ${data.enderecoImovel || 'Rua dos Ipês, nº 789, Bairro Jardim Paulista'}, nesta Capital, com área privativa de ${data.areaImovel || '120,00m² (cento e vinte metros quadrados)'}, área comum de 40,00m² (quarenta metros quadrados), perfazendo a área total de 160,00m² (cento e sessenta metros quadrados), correspondendo-lhe uma fração ideal no terreno de 2,5% (dois vírgula cinco por cento), registrado sob a ${data.registroImovel || 'matrícula nº 12.345 no 5º Oficial de Registro de Imóveis desta Capital'}.

TÍTULO AQUISITIVO: O referido imóvel foi adquirido pelo OUTORGANTE VENDEDOR através de Escritura Pública de Compra e Venda lavrada no 10º Tabelionato de Notas desta Capital, no Livro 500, fls. 150, em 10/05/2010, devidamente registrada na matrícula do imóvel.

E pela presente escritura e nos melhores termos de direito, o OUTORGANTE VENDEDOR vende, como de fato vendido tem, ao OUTORGADO COMPRADOR, o imóvel acima descrito e caracterizado, pelo preço certo e ajustado de ${data.valorImovel || 'R$ 800.000,00 (oitocentos mil reais)'}, que confessa e declara haver recebido, em moeda corrente nacional, dando ao OUTORGADO COMPRADOR, plena, geral e irrevogável quitação, para nada mais reclamar em tempo algum.`;
      break;
      
    case 'Inventário':
      content = `ESCRITURA PÚBLICA DE INVENTÁRIO E PARTILHA, na forma abaixo:
= S A I B A M = quantos esta virem que, ${formattedDate}, nesta cidade de Brasília, Distrito
Federal, Capital da República Federativa do Brasil, nesta Serventia, perante
mim, Escrevente, compareceram como Outorgantes e reciprocamente
Outorgados, na qualidade de viúvo(a)-meeiro(a):
${data.inventariante || data.nome || 'MARIA OLIVEIRA'}, ${data.nacionalidade || 'brasileira'}, ${data.estadoCivil || 'viúva'}, ${data.profissao || 'professora'}, portadora da Cédula de Identidade RG nº ${data.rg || '98.765.432-1 SSP/SP'}, inscrita no CPF/MF sob nº ${data.cpf || '987.654.321-00'}, residente e domiciliada na ${data.endereco || 'Avenida Central, nº 456, Bairro Centro, CEP 12345-678, nesta Capital'};

e, na qualidade de herdeiros-filhos:
${data.herdeiro1 || 'PEDRO SANTOS'}, brasileiro, solteiro, estudante, CPF nº ${data.cpfHerdeiro1 || '111.222.333-44'}, residente e domiciliado na ${data.enderecoHerdeiro1 || 'Rua A, nº 123, CEP 12345-678, Brasília-DF'};
${data.herdeiro2 ? `${data.herdeiro2}, brasileiro(a), ${data.estadoCivilHerdeiro2 || 'solteiro(a)'}, ${data.profissaoHerdeiro2 || 'estudante'}, CPF nº ${data.cpfHerdeiro2 || '555.666.777-88'}, residente e domiciliado(a) na ${data.enderecoHerdeiro2 || 'Rua B, nº 456, CEP 12345-678, Brasília-DF'};` : ''}

e, na qualidade de advogado:
Dr(a). ${data.advogado || 'JOSÉ SILVA'}, inscrito(a) na OAB/DF sob o nº ${data.oabAdvogado || '12345'}, com escritório na ${data.enderecoAdvogado || 'Rua dos Advogados, nº 789, CEP 12345-678, Brasília-DF'};

Todos os presentes foram reconhecidos e identificados como os próprios de que
trato, pelos documentos apresentados, cuja capacidade jurídica reconheço e dou
fé. E, pelos Outorgantes e reciprocamente Outorgados, devidamente orientados
pelo(a) advogado(a), acima nomeado e qualificado, legalmente constituído(a)
para este ato, me foi requerida a lavratura do inventário e partilha amigável
dos bens e direitos deixados pelo falecimento de ${data.falecido || 'JOSÉ SANTOS'}, conforme dispõe na Lei
nº 13.105/2015, regulamentada pela Resolução nº 35 de 24 abril de 2007, do
Conselho Nacional de Justiça, nos seguintes termos e condições:

1. DO(A) AUTOR(A) DA HERANÇA – O(A) autor(a) da herança,
1.1. Foi casado com o(a) viúvo(a)-meeiro(a), ${data.inventariante || data.nome || 'MARIA OLIVEIRA'}, já anteriormente
qualificado(a), desde ${data.dataCasamento || '10/05/1990'}, sob o regime de ${data.regimeBens || 'comunhão parcial de bens'}, conforme certidão
de casamento expedida aos ${data.dataCertidaoCasamento || '15/05/1990'}, registrada sob a matrícula nº ${data.matriculaCasamento || '123456'}, pelo
Cartório do ${data.cartorioCasamento || '1º Ofício de Registro Civil de Brasília-DF'};

1.2. Faleceu aos ${data.dataFalecimento || '10/01/2023'}, no Hospital ${data.hospitalFalecimento || 'Santa Luzia'}, na cidade de ${data.cidadeFalecimento || 'Brasília-DF'}, conforme certidão de
óbito expedida aos ${data.dataCertidaoObito || '12/01/2023'}, registrada sob a matrícula nº ${data.matriculaObito || '987654'}, pelo Cartório do ${data.cartorioObito || '2º Ofício de Registro Civil de Brasília-DF'};

1.3. Do relacionamento do(a) autor(a) da herança com o(a) ora viúvo(a)-
meeiro(a) nasceram ${data.quantidadeFilhos || 'dois'} filhos, todos maiores e capazes, a saber:
${data.herdeiro1 || 'PEDRO SANTOS'} e ${data.herdeiro2 || 'ANA SANTOS'}, declarando os presentes que desconhece(m) a existência de
outros herdeiros, a não ser o(s) mencionado(s) no presente ato.

DAS DECLARAÇÕES DAS PARTES - As partes declaram sob as penas da lei,
que:
a) o(a) autor(a) da herança não deixou testamento conhecido, por qualquer
natureza;
${data.temTestamento ? `a) o(a) falecido(a) deixou testamento que foi aberto nos autos do processo nº ${data.processoTestamento || '12345-67.2023.8.07.0001'} e teve autorização expressa para realização do inventário por meio de Escritura Pública emanada pelo (a) Juiz (a) ${data.juizTestamento || 'Dr. Paulo Souza'}, em ${data.dataAutorizacao || '20/01/2023'}, tudo conforme o estabelecido no artigo 12-B da resolução 35 do Conselho Nacional de Justiça.` : ''}
b) desconhecem quaisquer débitos em nome do(a) autor(a) da herança, por
ocasião da abertura da sucessão; c) desconhecem quaisquer obrigações
assumidas pelo(a) autor(a) da herança; d) desconhecem a existência de outros
herdeiros, a não ser os que estão presentes nesta escritura; e) a presente
escritura não prejudica os direitos adquiridos e interesses de terceiros; f) não
existem feitos ajuizados fundados em ações reais, pessoais ou reipersecutórias
que afetem os bens e direitos partilhados; g) o(a) falecido(a) não era
empregador(a) ou, de qualquer forma, responsável por recolhimento de
contribuições à Previdência Social; h) os bens ora partilhados encontram-se
livres e desembaraçados de quaisquer ônus, dívidas, tributos de quaisquer
naturezas; i) não tramita inventário e partilha na via judicial.

3. DA NOMEAÇÃO DE INVENTARIANTE - Os Outorgantes e reciprocamente
Outorgados, de comum acordo, nomeiam como inventariante do espólio, ${data.inventariante || data.nome || 'MARIA OLIVEIRA'},
já anteriormente qualificado(a), conferindo-lhe todos os poderes que se fizerem
necessários para representar o espólio em Juízo ou fora dele; podendo ainda,
praticar todos os atos de administração dos bens, constituir advogado(a) em
nome do espólio, ingressar em juízo, ativa ou passivamente; podendo enfim
praticar todos os atos que se fizerem necessários em defesa do espólio e ao
cumprimento de suas eventuais obrigações; 3.1. O(A) nomeado(a) declara que
aceita este encargo, prestando, aqui, o compromisso de cumprir, fiel e
eficazmente, seu ofício; 3.2. O(A) inventariante declara estar ciente da
responsabilidade civil e criminal que envolve o desempenho de seu encargo,
inclusive pelas declarações aqui prestadas.

4. DOS BENS E SEUS VALORES - O(A) autor(a) da herança deixou, por
ocasião da abertura da sucessão, o(s) seguinte(s) bem(s):
4.1. Apartamento nº ${data.numeroApartamento || '101'}, do Bloco "${data.blocoApartamento || 'A'}", da ${data.quadraApartamento || 'SQN 123'}, desta Capital,
${data.descricaoAdicionalImovel || 'com área privativa de 120,00m²'} com direito a vaga na garagem, melhor descrito e caracterizado na
matrícula nº ${data.matriculaImovel || '12345'}, do ${data.cartorioRegistroImovel || '2º'} Ofício do Registro de Imóveis do
Distrito Federal. Inscrição do imóvel junto ao GDF sob o nº ${data.inscricaoGDF || '12345678901'}. Que
referido imóvel foi adquirido pelo(a) autor(a) da herança e seu cônjuge da
seguinte forma: conforme R-${data.registroMatricula || '1'}, na matrícula nº ${data.matriculaImovel || '12345'}, do mencionado registro
imobiliário, e ao referido imóvel o(a)(s) herdeiro(a)(s) atribui(em) meramente
para fins em partilha o valor de ${data.valorPartilhaImovel || 'R$ 800.000,00 (oitocentos mil reais)'}, sendo o valor para fins em
meação em ${data.valorMeacaoImovel || 'R$ 400.000,00 (quatrocentos mil reais)'}, e o valor arbitrado pela SEFAZ/DF para fins de
cálculo de ITCD em 2025 no valor de ${data.valorITCDImovel || 'R$ 800.000,00 (oitocentos mil reais)'};

${data.temVeiculo ? `4.2. VEÍCULO marca ${data.marcaVeiculo || 'Toyota'}, cor ${data.corVeiculo || 'prata'}, categoria PARTICULAR, combustível
ÁLCOOL/GASOLINA, placa ${data.placaVeiculo || 'ABC1234'}, chassi nº ${data.chassiVeiculo || '9BRBLWHEXG0107721'}, ano ${data.anoVeiculo || '2020'}, modelo ${data.modeloVeiculo || 'Corolla'}, 
renavam nº ${data.renavamVeiculo || '01234567890'}, e ao referido veículo o(a)(s) herdeiro(a)(s) atribui(em) 
meramente para fins em partilha o valor de ${data.valorPartilhaVeiculo || 'R$ 90.000,00 (noventa mil reais)'}, sendo o valor para 
fins em meação em ${data.valorMeacaoVeiculo || 'R$ 45.000,00 (quarenta e cinco mil reais)'}, e o valor arbitrado pela SEFAZ/DF para fins 
de cálculo de ITCD em 2025 no valor de ${data.valorITCDVeiculo || 'R$ 90.000,00 (noventa mil reais)'};` : ''}

${data.temContaBancaria ? `4.3. Saldo em Conta corrente/poupança nº ${data.numeroConta || '12345-6'}, Agência nº ${data.numeroAgencia || '1234'}, junto ao
Banco ${data.nomeBanco || 'Banco do Brasil'}, no valor de ${data.valorConta || 'R$ 30.000,00 (trinta mil reais)'} e acréscimos ou deduções se houver;` : ''}

${data.temCotas ? `4.4. ${data.quantidadeCotas || '1.000 (mil)'} cotas de Capital Social da Empresa 
${data.nomeEmpresa || 'XYZ Empreendimentos Ltda.'}, inscrita no CNPJ sob o nº ${data.cnpjEmpresa || '12.345.678/0001-90'}, correspondente a 
${data.percentualCotas || '50% (cinquenta por cento)'} do patrimônio liquido. As partes atribuem o valor de 
R$ ${data.valorCotas || '100.000,00 (cem mil reais)'}, para fins de partilha. Conforme Contrato Social o valor do capital 
social é de R$ ${data.valorCapitalSocial || '200.000,00 (duzentos mil reais)'}, conforme balanço patrimonial o valor do patrimônio 
líquido é de R$ ${data.valorPatrimonioLiquido || '300.000,00 (trezentos mil reais)'};` : ''}

5. DA PARTILHA - O(s) bem(s) constante(s) do item "4." da presente, soma(m)
ou valor de ${data.valorTotalBens || 'R$ 920.000,00 (novecentos e vinte mil reais)'} e será(ão) partilhado(s) da seguinte forma:
5.1. Caberá ao(a) viúvo(a)-meeiro(a), ${data.inventariante || data.nome || 'MARIA OLIVEIRA'}, em razão de sua meação, 50%
(cinquenta por cento) de todos os bens descritos e caracterizados no item "4."
da presente, correspondendo ao valor de ${data.valorMeacao || 'R$ 460.000,00 (quatrocentos e sessenta mil reais)'};
5.2. Caberá a cada um do(s) herdeiro(s), ${data.herdeiro1 || 'PEDRO SANTOS'}${data.herdeiro2 ? ` e ${data.herdeiro2}` : ''}, em razão da sucessão legítima,
${data.percentualHerdeiros || '25% (vinte e cinco por cento)'}, de todos o(s) bem(s) descrito(s) e caracterizados no item "4." da presente,
correspondendo ao valor unitário de ${data.valorParteHerdeiro || 'R$ 230.000,00 (duzentos e trinta mil reais)'}.

6. DAS CERTIDÕES E DOCUMENTOS APRESENTADOS - Foram-me
apresentados e aqui arquivados os seguintes documentos e certidões para esta:
a) Os documentos mencionados no artigo 22 da Resolução nº 35 do Conselho
Nacional de Justiça, de 24 de abril de 2007, bem como os especificados na lei
7.433/85, regulamentada pelo Decreto-Lei 93.240/86; b) Certidão de matrícula e
ônus reais e pessoais reipersecutórias, relativa(s) ao(s) imóvel(s) objeto(s) desta
escritura, bem como os documentos comprobatórios dos demais bens descritos
e caracterizados no item "4." da presente; c) Certidão Negativa de Débitos
relativos aos Tributos Federais e à Dívida Ativa da União, expedida pela
Procuradoria-Geral da Fazenda Nacional e Secretaria da Receita Federal sob o
nº ${data.numeroDebitosFederais || '12345678'}, emitida aos ${data.dataDebitosFederais || '15/01/2023'}, às ${data.horaDebitosFederais || '10:15'}, válida até ${data.validadeDebitosFederais || '15/07/2023'}, em nome e CPF do(a) falecido(a);
d) Certidão Negativa de Débitos, expedida pelo GDF sob o nº ${data.numeroDebitosGDF || '87654321'}, emitida aos ${data.dataDebitosGDF || '16/01/2023'}, 
válida até ${data.validadeDebitosGDF || '16/07/2023'}, em nome e CPF do(a) falecido(a);
e) Certidão Negativa de Débitos de Tributos Imobiliários, expedida pelo GDF sob
o nº ${data.numeroDebitosImobiliarios || '12348765'}, emitida aos ${data.dataDebitosImobiliarios || '17/01/2023'}, válida até ${data.validadeDebitosImobiliarios || '17/07/2023'}, referente ao imóvel descrito no subitem ${data.subitemImovel || '4.1'}, 
inscrição ${data.inscricaoImovel || '12345678901'};
f) Certidão Negativa de Testamento, emitida pela Central de Serviços Eletrônicos
Compartilhados - CENSEC, em nome do(a)(s) autor(a)(es) da herança.

${data.temImovelOutroEstado ? `g) Certidão Negativa de Débitos, expedida pela Prefeitura de ${data.cidadePrefeitura || 'São Paulo'} sob o nº 
${data.numeroDebitosPrefeitura || '123456'}, emitida aos ${data.dataDebitosPrefeitura || '18/01/2023'}, válida até ${data.validadeDebitosPrefeitura || '18/07/2023'}, em nome e CPF do(a) falecido(a);` : ''}

${data.temImovelRural ? `g) Certificado de Cadastro de Imóvel Rural - CCIR, sob o nº ${data.numeroCCIR || '12345'}, código do imóvel 
rural ${data.codigoImovelRural || '12345678-9'}, referente ao exercício ${data.exercicioCCIR || '2023'}, com as seguintes medidas: área total ${data.areaTotalRural || '25,5 hectares'}, 
denominação do imóvel ${data.denominacaoImovelRural || 'Fazenda Boa Esperança'}, indicações para localização do imóvel: ${data.localizacaoImovelRural || 'Rodovia BR-123, km 45'}, município 
sede do imóvel: ${data.municipioImovelRural || 'Planaltina-DF'}, classificação fundiária ${data.classificacaoFundiaria || 'Pequena Propriedade'}, nºs. de módulos fiscais ${data.modulosFiscais || '2'}, fração 
mínima de parcelamento ${data.fracaoMinima || '2 hectares'}, área registrada ${data.areaRegistrada || '25,5 hectares'}, posse a justo título ${data.posseJustoTitulo || 'Sim'}, em relação ao 
imóvel descrito e caracterizado no item ${data.itemImovelRural || '4.4'};

h) Certidão Negativa de Débitos Relativos ao Imposto sobre a Propriedade 
Territorial Rural, expedida pela SRFB, sob o nº ${data.numeroCNDITR || '123456'}, emitida às ${data.horaCNDITR || '11:30'} horas, dia ${data.dataCNDITR || '19/01/2023'}, válida 
até ${data.validadeCNDITR || '19/07/2023'}, CIB: ${data.cibITR || '12345.67890.12345.12345'}, em relação ao imóvel descrito e caracterizado no item ${data.itemImovelITR || '4.4'};

i) Certidão Negativa de Débitos - Ministério do Meio Ambiente - MMA - Instituto 
Brasileiro do Meio Ambiente e dos Recursos Naturais Renováveis - IBAMA, sob 
os nº ${data.numeroCNDIBAMA || '123456'}, expedida em ${data.dataCNDIBAMA || '20/01/2023'}, válida até ${data.validadeCNDIBAMA || '20/07/2023'}, em nome do autor da herança.` : ''}

7. DO IMPOSTO DE TRANSMISSÃO "CAUSA MORTIS" E DOAÇÃO - Guia de
transmissão causa mortis e doação de quaisquer bens e direitos - ITCMD,
expedida pela Secretaria de Estado da Fazenda do Distrito Federal sob o nº
${data.numeroITCMD || '123456'}, no valor de ${data.valorITCMD || 'R$ 18.400,00 (dezoito mil e quatrocentos reais)'}, paga aos ${data.dataPagamentoITCMD || '25/01/2023'}, no mesmo valor, sob a alíquota de 4% sobre o valor total tributável de ${data.valorTributavelITCMD || 'R$ 460.000,00 (quatrocentos e sessenta mil reais)'}, em relação à sucessão legítima.

8. DAS DECLARAÇÕES DO(A) ADVOGADO(A) - Pelo(a) advogado(a) me foi
dito que, na qualidade de advogado(a) das partes, assessorou e aconselhou
seus constituintes, tendo conferido a correção da partilha e seus valores de
acordo com a Lei. 9. DAS DECLARAÇÕES FINAIS - Os comparecentes
requerem e autorizam ao Cartório do Registro de Imóveis competente ${data.cartorioRegistroCompetente || '2º Ofício de Registro de Imóveis do Distrito Federal'} e
demais órgãos, a praticar(em) todos os atos que se fizerem necessários ao
cumprimento da presente escritura; 9.1. Os comparecentes que figuram neste
instrumento declaram estar cientes da responsabilidade civil e criminal, pelas
declarações de bens e pela inexistência de outros herdeiros conhecidos e pela
veracidade de todos os fatos relatados neste instrumento de Inventário e
Partilha; 9.2. Declaram, ainda, que em relação ao(s) imóvel(s) descrito(s) e
caracterizado(s) no item 4, encontram-se quites com suas obrigações
condominiais; 9.3. Pelo(s) mandatário(s) foi declarado sob responsabilidade civil
e penal, que não ocorreram quaisquer das causas de extinção do mandato,
tratadas no artigo 682, do Código Civil brasileiro. 9.4. As partes declaram-se
cientes sobre a possibilidade de obtenção prévia das certidões de feitos
ajuizados expedidas pela Justiça do Distrito Federal e dos Territórios ou
Estadual, Justiça Federal e Justiça do Trabalho, em nome do(s) autor(es) da
herança, em atendimento ao disposto no artigo 45, § 6º do Provimento Geral da
Corregedoria da Justiça do Distrito Federal e dos Territórios, inclusive Certidão
Negativa de Débitos Trabalhistas - CNDT, expedida pelo TST - Tribunal Superior
do Trabalho. Demais taxas, certidões e impostos serão apresentados por
ocasião do registro. As partes declaram ter conhecimento de que outros
documentos poderão ser solicitados por ocasião do registro da presente
escritura no Cartório de Registro de Imóveis competente. Certifica que, foi feita
a consulta prévia junto a Central Nacional de Indisponibilidade de Bens - CNIB,
no(s) CPF do(a) autor(a) da herança, conforme código hash sob o nº ${data.hashCNIB || 'a1b2c3d4e5f6'}, com o
resultado NEGATIVO, conforme dispõe o artigo 7º, do Provimento nº 39/2014,
da Corregedoria Nacional de Justiça, datado de 25 de Julho de 2014. Emitida a
DOI - Declaração sobre operação imobiliária, conforme instrução normativa da
Receita Federal do Brasil. Ficam ressalvados eventuais erros, omissões ou
direitos de terceiros porventura existentes. Assim o disseram, pediram-me e eu
Escrevente lhes lavrei a presente escritura, que feita e lhes sendo lida, foi achada
em tudo conforme, aceitam e assinam.`;
      break;
      
    case 'Doação':
      content = `ESCRITURA PÚBLICA DE DOAÇÃO DE BEM IMÓVEL

SAIBAM todos quantos esta Escritura Pública de Doação virem que, aos ${formattedDate}, nesta cidade e comarca de São Paulo, Estado de São Paulo, perante mim, Tabelião, compareceram as partes:

DOADOR: ${data.doador || data.vendedor || 'JOÃO DA SILVA'}, ${data.nacionalidadeDoador || 'brasileiro'}, ${data.estadoCivilDoador || 'casado'}, ${data.profissaoDoador || 'empresário'}, portador da Cédula de Identidade RG nº ${data.rgDoador || '12.345.678-9 SSP/SP'}, inscrito no CPF/MF sob nº ${data.cpfDoador || '123.456.789-00'}, residente e domiciliado na ${data.enderecoDoador || 'Rua das Flores, nº 123, Bairro Jardim, CEP 01234-567, nesta Capital'};

DONATÁRIO: ${data.donatario || data.nome || 'MARIA OLIVEIRA'}, ${data.nacionalidadeDonatario || 'brasileira'}, ${data.estadoCivilDonatario || 'solteira'}, ${data.profissaoDonatario || 'advogada'}, portadora da Cédula de Identidade RG nº ${data.rgDonatario || data.rg || '98.765.432-1 SSP/SP'}, inscrita no CPF/MF sob nº ${data.cpfDonatario || data.cpf || '987.654.321-00'}, residente e domiciliada na ${data.enderecoDonatario || data.endereco || 'Avenida Central, nº 456, Bairro Centro, CEP 12345-678, nesta Capital'};

Os presentes, juridicamente capazes, identificados por mim, Tabelião, conforme documentos apresentados, do que dou fé.

BEM DOADO: ${data.descricaoImovel || data.enderecoImovel || 'Apartamento nº 101, localizado no 10º andar do Edifício Residencial Primavera, situado na Rua dos Ipês, nº 789, Bairro Jardim Paulista'}, registrado sob a ${data.registroImovel || 'matrícula nº 12.345 no 5º Oficial de Registro de Imóveis desta Capital'}, avaliado em ${data.valorImovel || 'R$ 800.000,00 (oitocentos mil reais)'}.

Pelo presente instrumento e na melhor forma de direito, o DOADOR, livre e espontaneamente, doa, como efetivamente doado tem, ao DONATÁRIO, que aceita esta doação, o imóvel acima descrito e caracterizado, transmitindo-lhe, desde já, toda posse, domínio, direito e ação que exercia sobre o imóvel ora doado.

O DOADOR declara que o imóvel ora doado encontra-se livre e desembaraçado de quaisquer ônus, dívidas, hipotecas, penhoras ou quaisquer outras restrições.

O DONATÁRIO, aceitando a presente doação, agradece ao DOADOR pela liberalidade.`;
      break;
    
    case 'União Estável':
      content = `ESCRITURA PÚBLICA DE DECLARAÇÃO DE UNIÃO ESTÁVEL

SAIBAM todos quantos esta Escritura Pública de Declaração de União Estável virem que, aos ${formattedDate}, nesta cidade e comarca de São Paulo, Estado de São Paulo, perante mim, Tabelião, compareceram as partes:

DECLARANTE 1: ${data.nome1 || data.nome || 'JOÃO DA SILVA'}, ${data.nacionalidade1 || 'brasileiro'}, ${data.profissao1 || 'empresário'}, portador da Cédula de Identidade RG nº ${data.rg1 || data.rg || '12.345.678-9 SSP/SP'}, inscrito no CPF/MF sob nº ${data.cpf1 || data.cpf || '123.456.789-00'}, nascido em ${data.dataNascimento1 || '10/05/1980'}, filho de ${data.filiacao1 || 'José da Silva e Maria da Silva'}, residente e domiciliado na ${data.endereco1 || data.endereco || 'Rua das Flores, nº 123, Bairro Jardim, CEP 01234-567, nesta Capital'};

DECLARANTE 2: ${data.nome2 || 'MARIA OLIVEIRA'}, ${data.nacionalidade2 || 'brasileira'}, ${data.profissao2 || 'advogada'}, portadora da Cédula de Identidade RG nº ${data.rg2 || '98.765.432-1 SSP/SP'}, inscrita no CPF/MF sob nº ${data.cpf2 || '987.654.321-00'}, nascida em ${data.dataNascimento2 || '15/08/1985'}, filha de ${data.filiacao2 || 'Pedro Oliveira e Ana Oliveira'}, residente e domiciliada no mesmo endereço do Declarante 1;

Os presentes, identificados por mim, Tabelião, conforme documentos apresentados, do que dou fé.

Os DECLARANTES, por livre e espontânea vontade, cientes da responsabilidade civil e criminal de suas declarações, declaram que convivem em união estável, de forma pública, contínua, duradoura e com o objetivo de constituir família, desde ${data.inicioUniao || '15/06/2018'}, nos termos do art. 1.723 do Código Civil Brasileiro.

Na constância da união estável, os conviventes adotam o regime da ${data.regimeBens || 'comunhão parcial de bens'}, nos termos do art. 1.725 do Código Civil Brasileiro.`;
      break;
      
    case 'Procuração':
      content = `PROCURAÇÃO PÚBLICA

SAIBAM todos quantos esta Procuração Pública virem que, aos ${formattedDate}, nesta cidade e comarca de São Paulo, Estado de São Paulo, perante mim, Tabelião, compareceu como OUTORGANTE:

${data.outorgante || data.nome || 'JOÃO DA SILVA'}, ${data.nacionalidadeOutorgante || 'brasileiro'}, ${data.estadoCivilOutorgante || 'casado'}, ${data.profissaoOutorgante || 'empresário'}, portador da Cédula de Identidade RG nº ${data.rgOutorgante || data.rg || '12.345.678-9 SSP/SP'}, inscrito no CPF/MF sob nº ${data.cpfOutorgante || data.cpf || '123.456.789-00'}, residente e domiciliado na ${data.enderecoOutorgante || data.endereco || 'Rua das Flores, nº 123, Bairro Jardim, CEP 01234-567, nesta Capital'};

O presente, identificado por mim, Tabelião, do que dou fé.

E, por este instrumento público, nomeia e constitui como seu bastante PROCURADOR:

${data.procurador || 'MARIA OLIVEIRA'}, ${data.nacionalidadeProcurador || 'brasileira'}, ${data.estadoCivilProcurador || 'solteira'}, ${data.profissaoProcurador || 'advogada'}, portadora da Cédula de Identidade RG nº ${data.rgProcurador || '98.765.432-1 SSP/SP'}, inscrita no CPF/MF sob nº ${data.cpfProcurador || '987.654.321-00'}, residente e domiciliada na ${data.enderecoProcurador || 'Avenida Central, nº 456, Bairro Centro, CEP 12345-678, nesta Capital'};

A quem confere poderes para ${data.poderes || 'representá-lo perante repartições públicas federais, estaduais, municipais e autárquicas, inclusive junto à Receita Federal, Detran, Cartórios de Registro de Imóveis, Tabelionatos, podendo requerer, assinar e retirar documentos, pagar taxas e emolumentos, prestar declarações e informações, bem como especialmente para vender, prometer vender, ceder ou transferir, pelo preço e condições que ajustar, o imóvel de propriedade do Outorgante situado na Rua dos Ipês, nº 789, Bairro Jardim Paulista, nesta Capital, registrado sob a matrícula nº 12.345 no 5º Oficial de Registro de Imóveis desta Capital, podendo para tanto assinar escrituras públicas, contratos particulares, receber valores e dar quitação, transmitir posse, domínio, direito e ação, responder pela evicção, prestar declarações fiscais e de situação jurídica do imóvel'}.

Os poderes ora conferidos terão validade pelo prazo de ${data.prazoValidade || '1 (um) ano'}, a contar desta data.`;
      break;
      
    case 'Testamento':
      content = `TESTAMENTO PÚBLICO

SAIBAM todos quantos este Testamento Público virem que, aos ${formattedDate}, nesta cidade e comarca de São Paulo, Estado de São Paulo, perante mim, Tabelião, compareceu como TESTADOR:

${data.testador || data.nome || 'JOÃO DA SILVA'}, ${data.nacionalidadeTestador || 'brasileiro'}, ${data.estadoCivilTestador || 'casado'}, ${data.profissaoTestador || 'empresário'}, portador da Cédula de Identidade RG nº ${data.rgTestador || data.rg || '12.345.678-9 SSP/SP'}, inscrito no CPF/MF sob nº ${data.cpfTestador || data.cpf || '123.456.789-00'}, residente e domiciliado na ${data.enderecoTestador || data.endereco || 'Rua das Flores, nº 123, Bairro Jardim, CEP 01234-567, nesta Capital'};

O presente, identificado por mim, Tabelião, conforme documentos apresentados, o qual se encontra em perfeito estado de saúde mental e em pleno gozo de suas faculdades intelectuais, do que dou fé, e perante as testemunhas adiante nomeadas e assinadas, declarou que, livre e espontaneamente, sem coação ou influência de qualquer espécie, resolve fazer seu testamento, pela forma a seguir:

1. Declaro que sou casado com ${data.conjugeTestador || 'MARIA DA SILVA'}, sob o regime da ${data.regimeBensTestador || 'comunhão parcial de bens'}.

2. Declaro que tenho os seguintes filhos: ${data.filhosTestador || 'PEDRO DA SILVA e ANA DA SILVA'}.

3. Para depois de minha morte, respeitada a legítima dos herdeiros necessários, disponho dos meus bens na seguinte forma:

   a) Deixo ao meu filho ${data.beneficiario1 || 'PEDRO DA SILVA'}, o imóvel situado na ${data.enderecoImovel1 || 'Rua dos Ipês, nº 789, Bairro Jardim Paulista, nesta Capital'}, registrado sob a ${data.registroImovel1 || 'matrícula nº 12.345 no 5º Oficial de Registro de Imóveis desta Capital'}.
   
   b) Deixo à minha filha ${data.beneficiario2 || 'ANA DA SILVA'}, o imóvel situado na ${data.enderecoImovel2 || 'Avenida das Palmeiras, nº 456, Bairro Moema, nesta Capital'}, registrado sob a ${data.registroImovel2 || 'matrícula nº 54.321 no 10º Oficial de Registro de Imóveis desta Capital'}.
   
   c) Deixo ao meu amigo ${data.beneficiario3 || 'JOSÉ OLIVEIRA'}, como legado, a importância de ${data.valorLegado || 'R$ 50.000,00 (cinquenta mil reais)'}, que deverá ser retirada de minhas aplicações financeiras.

4. Nomeio como inventariante e testamenteiro ${data.testamenteiro || 'minha esposa, MARIA DA SILVA'}, a quem concedo os poderes de representação ativa e passiva do espólio, em juízo ou fora dele.

Este é o meu testamento, que faço de livre e espontânea vontade, para que produza seus jurídicos e legais efeitos.`;
      break;
    
    default:
      content = `DOCUMENTO JURÍDICO - ${type}

Documento gerado automaticamente com base nos dados fornecidos em ${formattedDate}.

Nome: ${data.nome || 'Nome não fornecido'}
${data.rg ? `RG: ${data.rg}` : ''}
${data.cpf ? `CPF: ${data.cpf}` : ''}
${data.profissao ? `Profissão: ${data.profissao}` : ''}
${data.estadoCivil ? `Estado Civil: ${data.estadoCivil}` : ''}
${data.nacionalidade ? `Nacionalidade: ${data.nacionalidade}` : ''}
${data.endereco ? `Endereço: ${data.endereco}` : ''}
${data.enderecoImovel ? `Endereço do imóvel: ${data.enderecoImovel}` : ''}
${data.valorImovel ? `Valor: ${data.valorImovel}` : ''}
${data.registroImovel ? `Registro: ${data.registroImovel}` : ''}
${data.areaImovel ? `Área: ${data.areaImovel}` : ''}

Este é um documento modelo. Em uma aplicação real, o conteúdo completo seria gerado com base nos dados extraídos dos documentos enviados e no tipo de minuta selecionado.`;
  }
  
  return content;
};
