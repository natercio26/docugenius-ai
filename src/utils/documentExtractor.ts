
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
      content = `TERMO DE INVENTÁRIO E PARTILHA

Aos ${formattedDate}, na cidade de São Paulo, Estado de São Paulo, procede-se ao INVENTÁRIO E PARTILHA dos bens deixados por falecimento de ${data.falecido || 'JOSÉ SANTOS'}, falecido em ${data.dataFalecimento || '10/01/2023'}, conforme certidão de óbito apresentada.

INVENTARIANTE: ${data.inventariante || data.nome || 'MARIA OLIVEIRA'}, ${data.nacionalidade || 'brasileira'}, ${data.estadoCivil || 'viúva'}, ${data.profissao || 'professora'}, portadora da Cédula de Identidade RG nº ${data.rg || '98.765.432-1 SSP/SP'}, inscrita no CPF/MF sob nº ${data.cpf || '987.654.321-00'}, residente e domiciliada na ${data.endereco || 'Avenida Central, nº 456, Bairro Centro, CEP 12345-678, nesta Capital'}.

HERDEIROS:
1. ${data.herdeiro1 || 'PEDRO SANTOS'}, filho do falecido, brasileiro, solteiro, estudante, CPF nº ${data.cpfHerdeiro1 || '111.222.333-44'};
2. ${data.herdeiro2 || 'ANA SANTOS'}, filha do falecido, brasileira, casada, médica, CPF nº ${data.cpfHerdeiro2 || '555.666.777-88'}.

BENS A SEREM PARTILHADOS:
1. IMÓVEL: ${data.descricaoImovel || data.enderecoImovel || 'Apartamento situado na Rua dos Ipês, nº 789, Bairro Jardim Paulista'}, registrado sob a ${data.registroImovel || 'matrícula nº 12.345 no 5º Oficial de Registro de Imóveis desta Capital'}, avaliado em ${data.valorImovel || 'R$ 800.000,00 (oitocentos mil reais)'}.
2. VEÍCULO: ${data.veiculo || 'Automóvel marca Toyota, modelo Corolla, ano 2020, placa ABC-1234'}, avaliado em R$ 90.000,00 (noventa mil reais).
3. CONTAS BANCÁRIAS: Saldo em conta corrente no valor de R$ 30.000,00 (trinta mil reais).

TOTAL DO ESPÓLIO: R$ 920.000,00 (novecentos e vinte mil reais).

PLANO DE PARTILHA:
- Ao herdeiro ${data.herdeiro1 || 'PEDRO SANTOS'} caberá o imóvel descrito no item 1, avaliado em ${data.valorImovel || 'R$ 800.000,00'};
- À herdeira ${data.herdeiro2 || 'ANA SANTOS'} caberão o veículo descrito no item 2 e os valores em conta bancária descritos no item 3, totalizando R$ 120.000,00.

Os herdeiros declaram estar de acordo com a presente partilha, dando-se mútua quitação quanto aos bens do espólio.`;
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
