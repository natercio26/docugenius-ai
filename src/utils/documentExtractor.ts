
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
    
    // Collect all text content from all files
    let allFileContents: string = '';
    
    // Process each uploaded file
    for (const file of files) {
      let fileContent = "";
      
      try {
        console.log(`Processing file: ${file.name}, type: ${file.type}`);
        
        if (file.type === 'application/pdf') {
          // For PDFs, extract text content using PDF.js
          fileContent = await parsePdfContent(file);
          console.log(`PDF content extracted, length: ${fileContent.length} characters`);
        } else if (file.type.startsWith('image/')) {
          // For images, use OCR to extract text
          fileContent = await extractTextFromImage(file);
          console.log(`Image OCR completed, extracted text length: ${fileContent.length} characters`);
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          // For DOCX, we're still using filename (would need a different approach for full implementation)
          fileContent = file.name;
          console.log("DOCX processing not fully implemented, using filename");
        } else {
          // For text files, read the content directly
          fileContent = await readFileContents(file);
          console.log(`Text file content read, length: ${fileContent.length} characters`);
        }
        
        if (!fileContent || fileContent.trim() === '') {
          console.warn(`No content extracted from file: ${file.name}`);
          continue;
        }
        
        // Add this file's content to the collection of all text
        allFileContents += "\n" + fileContent;
        
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }
    
    // Now that we have all content, let's look for a petition document
    const isPetition = 
      allFileContents.toLowerCase().includes('petição') || 
      allFileContents.toLowerCase().includes('inicial') ||
      allFileContents.toLowerCase().includes('inventário') ||
      allFileContents.toLowerCase().includes('partilha');
    
    if (isPetition) {
      console.log("Petition document detected. Extracting detailed information...");
      extractDataFromPetition(allFileContents, extractedData);
    } else {
      console.log("No specific petition document detected. Extracting data from general content...");
    }
    
    // Now extract data from all combined content
    extractDataFromFileContent("All Files", allFileContents, extractedData);
    
    console.log("Final extracted data:", extractedData);
    
    // Add default values for missing but required fields for inventory documents
    if (extractedData.falecido || extractedData.inventariante || extractedData.herdeiro1 || 
        allFileContents.toLowerCase().includes('inventário') || allFileContents.toLowerCase().includes('espólio')) {
      
      // Fill missing required fields with placeholders
      populateMissingInventoryFields(extractedData);
    }
    
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

// Helper function to extract data specifically from petitions
const extractDataFromPetition = (content: string, extractedData: Record<string, string>): void => {
  console.log("Extracting data from petition document");
  
  // Look for the deceased name with improved patterns
  const deceasedPatterns = [
    /(?:falecido|de cujus|espólio de|autor da herança)[:,;\s]+([A-Za-zÀ-ÖØ-öø-ÿ\s.,]+?)(?=[,\.]|\n|$)/i,
    /inventário\s+(?:de|do falecido|da falecida)\s+([A-Za-zÀ-ÖØ-öø-ÿ\s.,]+?)(?=[,\.]|\n|$)/i
  ];
  
  for (const pattern of deceasedPatterns) {
    const match = content.match(pattern);
    if (match && match[1] && match[1].trim().length > 3) {
      extractedData.falecido = match[1].trim();
      console.log(`Extracted deceased person from petition: ${extractedData.falecido}`);
      break;
    }
  }
  
  // Look for the inventory administrator
  const inventoriantePatterns = [
    /(?:inventariante)[:,;\s]+([A-Za-zÀ-ÖØ-öø-ÿ\s.,]+?)(?=[,\.]|\n|$)/i,
    /nomeado(?:a)?\s+(?:como)?\s+inventariante\s+([A-Za-zÀ-ÖØ-öø-ÿ\s.,]+?)(?=[,\.]|\n|$)/i,
    /qualidade\s+de\s+inventariante\s+([A-Za-zÀ-ÖØ-öø-ÿ\s.,]+?)(?=[,\.]|\n|$)/i
  ];
  
  for (const pattern of inventoriantePatterns) {
    const match = content.match(pattern);
    if (match && match[1] && match[1].trim().length > 3) {
      extractedData.inventariante = match[1].trim();
      console.log(`Extracted inventory administrator from petition: ${extractedData.inventariante}`);
      break;
    }
  }
  
  // Look for the spouse
  const conjugePatterns = [
    /(?:cônjuge|viúvo[(\w)]*|viúva[(\w)]*)[:,;\s]+([A-Za-zÀ-ÖØ-öø-ÿ\s.,]+?)(?=[,\.]|\n|$)/i,
    /casado(?:a)?\s+com\s+([A-Za-zÀ-ÖØ-öø-ÿ\s.,]+?)(?=[,\.]|\n|$)/i
  ];
  
  for (const pattern of conjugePatterns) {
    const match = content.match(pattern);
    if (match && match[1] && match[1].trim().length > 3) {
      extractedData.conjuge = match[1].trim();
      console.log(`Extracted spouse from petition: ${extractedData.conjuge}`);
      break;
    }
  }
  
  // Look for heirs
  const herdeirosPatterns = [
    /(?:herdeiros?|filhos?)[:,;\s]+([A-Za-zÀ-ÖØ-öø-ÿ\s.,]+?)(?=[,\.]|\n|$)/i,
    /qualidade\s+de\s+herdeiros?\s+([A-Za-zÀ-ÖØ-öø-ÿ\s.,]+?)(?=[,\.]|\n|$)/i
  ];
  
  for (const pattern of herdeirosPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      // We might have multiple heirs separated by commas, "e", or other separators
      const herdeiroText = match[1].trim();
      const herdeiros = herdeiroText.split(/(?:,|\se\s|\n)/);
      
      if (herdeiros.length > 0) {
        for (let i = 0; i < Math.min(herdeiros.length, 5); i++) {
          const herdeiro = herdeiros[i].trim();
          if (herdeiro.length > 3) {
            extractedData[`herdeiro${i+1}`] = herdeiro;
            console.log(`Extracted heir ${i+1} from petition: ${herdeiro}`);
          }
        }
        // Also store the number of heirs
        extractedData.numeroFilhos = String(herdeiros.length);
        break;
      }
    }
  }
  
  // Look for the marriage regime
  const regimeBensPatterns = [
    /regime\s+(?:de\s+)?(?:bens)?[:,;\s]+([A-Za-zÀ-ÖØ-öø-ÿ\s.,]+?)(?=[,\.]|\n|$)/i,
    /(?:casados?|união)\s+(?:sob|no)\s+(?:o)?\s+regime\s+(?:de\s+)?([A-Za-zÀ-ÖØ-öø-ÿ\s.,]+?)(?=[,\.]|\n|$)/i
  ];
  
  for (const pattern of regimeBensPatterns) {
    const match = content.match(pattern);
    if (match && match[1] && match[1].trim().length > 3) {
      extractedData.regimeBens = match[1].trim();
      console.log(`Extracted marriage regime from petition: ${extractedData.regimeBens}`);
      break;
    }
  }
  
  // Look for property info
  const imovelPatterns = [
    /imóvel\s+(?:localizado|situado)\s+(?:na|no|em)\s+([^,.]+(,|\.)[^,.]+)/i,
    /apartamento\s+(?:nº|número)?\s*([\d]+)[,\s]+(?:do)?\s+(?:bloco|bl\.)\s+["']*([A-Z]*)["']*/i,
    /(?:S[QC][NS]|CRS|CLS)\s*([\d]+)/i
  ];
  
  for (const pattern of imovelPatterns) {
    const match = content.match(pattern);
    if (match) {
      if (match[0].includes('apartamento') || match[0].includes('Apartamento')) {
        if (match[1]) {
          extractedData.numeroApartamento = match[1].trim();
          console.log(`Extracted apartment number from petition: ${extractedData.numeroApartamento}`);
        }
        if (match[2]) {
          extractedData.blocoApartamento = match[2].trim();
          console.log(`Extracted apartment block from petition: ${extractedData.blocoApartamento}`);
        }
      } else if (match[0].match(/S[QC][NS]|CRS|CLS/i)) {
        extractedData.quadraApartamento = match[0].trim();
        console.log(`Extracted address from petition: ${extractedData.quadraApartamento}`);
      } else {
        extractedData.enderecoImovel = match[1].trim();
        console.log(`Extracted property address from petition: ${extractedData.enderecoImovel}`);
      }
    }
  }
  
  // Look for property registration
  const matriculaPatterns = [
    /matrícula\s+(?:nº|número)?\s*([\d\.]+)/i,
    /matrícula\s+(?:imobiliária)?\s+(?:nº|número)?\s*([\d\.]+)/i
  ];
  
  for (const pattern of matriculaPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      extractedData.matriculaImovel = match[1].trim();
      console.log(`Extracted property registration from petition: ${extractedData.matriculaImovel}`);
      break;
    }
  }
  
  // Look for GDF registration
  const gdfPatterns = [
    /inscrição\s+(?:do imóvel)?\s+(?:junto ao)?\s+GDF\s+(?:sob o)?\s+(?:nº|número)?\s*([\d\.]+)/i,
    /GDF\s+(?:sob o)?\s+(?:nº|número)?\s*([\d\.]+)/i
  ];
  
  for (const pattern of gdfPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      extractedData.inscricaoGDF = match[1].trim();
      console.log(`Extracted GDF registration from petition: ${extractedData.inscricaoGDF}`);
      break;
    }
  }
  
  // Look for lawyer info
  const advogadoPatterns = [
    /advogado[(\w)]*\s+([A-Za-zÀ-ÖØ-öø-ÿ\s.,]+),\s+(?:OAB|inscrito|inscrita)/i,
    /Dr[(\w)]*\.\s+([A-Za-zÀ-ÖØ-öø-ÿ\s.,]+),\s+(?:OAB|inscrito|inscrita)/i
  ];
  
  for (const pattern of advogadoPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      extractedData.advogado = match[1].trim();
      console.log(`Extracted lawyer from petition: ${extractedData.advogado}`);
      break;
    }
  }
  
  // Look for OAB number
  const oabPatterns = [
    /OAB\/([A-Z]{2})\s+(?:nº|número)?\s*([\d]+)/i,
    /inscrit[ao]\s+(?:na)?\s+OAB\/([A-Z]{2})\s+(?:sob)?\s+(?:nº|número)?\s*([\d]+)/i
  ];
  
  for (const pattern of oabPatterns) {
    const match = content.match(pattern);
    if (match) {
      if (match[2]) {
        extractedData.oabAdvogado = match[1] + '/' + match[2].trim();
        console.log(`Extracted OAB number from petition: ${extractedData.oabAdvogado}`);
        break;
      } else if (match[1]) {
        extractedData.oabAdvogado = match[1].trim();
        console.log(`Extracted OAB number from petition: ${extractedData.oabAdvogado}`);
        break;
      }
    }
  }
  
  // Look for death date
  const deathDatePatterns = [
    /faleceu\s+(?:em|aos|no dia)?\s+([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4}|[0-9]{1,2}\s+de\s+[a-zç]+\s+de\s+[0-9]{2,4})/i,
    /data\s+(?:do)?\s+(?:falecimento|óbito)\s+(?:em|:)?\s+([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4}|[0-9]{1,2}\s+de\s+[a-zç]+\s+de\s+[0-9]{2,4})/i
  ];
  
  for (const pattern of deathDatePatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      extractedData.dataFalecimento = match[1].trim();
      console.log(`Extracted death date from petition: ${extractedData.dataFalecimento}`);
      break;
    }
  }
  
  // Look for marriage date
  const marriageDatePatterns = [
    /casados?\s+(?:desde|em)\s+([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4}|[0-9]{1,2}\s+de\s+[a-zç]+\s+de\s+[0-9]{2,4})/i,
    /data\s+do\s+casamento\s+(?:em|:)?\s+([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4}|[0-9]{1,2}\s+de\s+[a-zç]+\s+de\s+[0-9]{2,4})/i
  ];
  
  for (const pattern of marriageDatePatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      extractedData.dataCasamento = match[1].trim();
      console.log(`Extracted marriage date from petition: ${extractedData.dataCasamento}`);
      break;
    }
  }
  
  // Look for property value
  const valorImovelPatterns = [
    /valor\s+(?:do|de)\s+(?:imóvel|bem)\s+(?:de|em)?\s+(R\$\s*[\d\.,]+)/i,
    /avaliado\s+(?:em|por)\s+(R\$\s*[\d\.,]+)/i
  ];
  
  for (const pattern of valorImovelPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      extractedData.valorPartilhaImovel = match[1].trim();
      console.log(`Extracted property value from petition: ${extractedData.valorPartilhaImovel}`);
      break;
    }
  }
  
  // Look for ITCMD info
  const itcmdPatterns = [
    /ITCMD\s+(?:sob\s+o\s+nº|número)?\s*([\d\.]+)/i,
    /imposto\s+de\s+transmissão\s+causa\s+mortis\s+(?:e doação)?\s+(?:sob\s+o\s+nº|número)?\s*([\d\.]+)/i
  ];
  
  for (const pattern of itcmdPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      extractedData.numeroITCMD = match[1].trim();
      console.log(`Extracted ITCMD number from petition: ${extractedData.numeroITCMD}`);
      break;
    }
  }
  
  // Look for ITCMD value
  const itcmdValuePatterns = [
    /ITCMD\s+(?:no valor de|de)\s+(R\$\s*[\d\.,]+)/i,
    /imposto\s+de\s+transmissão\s+causa\s+mortis\s+(?:e doação)?\s+(?:no valor de|de)\s+(R\$\s*[\d\.,]+)/i
  ];
  
  for (const pattern of itcmdValuePatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      extractedData.valorITCMD = match[1].trim();
      console.log(`Extracted ITCMD value from petition: ${extractedData.valorITCMD}`);
      break;
    }
  }
  
  // Look for hospital name
  const hospitalPatterns = [
    /faleceu\s+(?:no|em)\s+(?:Hospital|Instituto)\s+([A-Za-zÀ-ÖØ-öø-ÿ\s.,]+?)(?=[,\.]|\n|$)/i,
    /(?:Hospital|Instituto)\s+([A-Za-zÀ-ÖØ-öø-ÿ\s.,]+?)(?=[,\.]|\n|$)/i
  ];
  
  for (const pattern of hospitalPatterns) {
    const match = content.match(pattern);
    if (match && match[1] && match[1].trim().length > 3) {
      extractedData.hospitalFalecimento = match[1].trim();
      console.log(`Extracted hospital from petition: ${extractedData.hospitalFalecimento}`);
      break;
    }
  }
  
  // Look for city of death
  const cidadeFalecimentoPatterns = [
    /faleceu\s+(?:no|em)\s+(?:Hospital|Instituto)?[^,]*,\s+(?:em|na cidade de)\s+([A-Za-zÀ-ÖØ-öø-ÿ\s.,]+?)(?=[,\.]|\n|$)/i,
    /cidade\s+de\s+([A-Za-zÀ-ÖØ-öø-ÿ\s.,]+?)(?=[,\.]|\n|$)/i
  ];
  
  for (const pattern of cidadeFalecimentoPatterns) {
    const match = content.match(pattern);
    if (match && match[1] && match[1].trim().length > 2) {
      extractedData.cidadeFalecimento = match[1].trim();
      console.log(`Extracted city of death from petition: ${extractedData.cidadeFalecimento}`);
      break;
    }
  }
  
  // Look for death certificate info
  const certidaoObitoPatterns = [
    /certidão\s+de\s+óbito\s+(?:expedida|registrada)\s+(?:em|aos)\s+([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4}|[0-9]{1,2}\s+de\s+[a-zç]+\s+de\s+[0-9]{2,4})/i,
    /certidão\s+de\s+óbito\s+(?:sob)?\s+(?:matrícula|nº|número)\s+([\d\.]+)/i
  ];
  
  for (const pattern of certidaoObitoPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      if (match[0].includes('matrícula') || match[0].includes('nº') || match[0].includes('número')) {
        extractedData.matriculaObito = match[1].trim();
        console.log(`Extracted death certificate number from petition: ${extractedData.matriculaObito}`);
      } else {
        extractedData.dataCertidaoObito = match[1].trim();
        console.log(`Extracted death certificate date from petition: ${extractedData.dataCertidaoObito}`);
      }
    }
  }
  
  // Look for marriage certificate info
  const certidaoCasamentoPatterns = [
    /certidão\s+de\s+casamento\s+(?:expedida|registrada)\s+(?:em|aos)\s+([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4}|[0-9]{1,2}\s+de\s+[a-zç]+\s+de\s+[0-9]{2,4})/i,
    /certidão\s+de\s+casamento\s+(?:sob)?\s+(?:matrícula|nº|número)\s+([\d\.]+)/i
  ];
  
  for (const pattern of certidaoCasamentoPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      if (match[0].includes('matrícula') || match[0].includes('nº') || match[0].includes('número')) {
        extractedData.matriculaCasamento = match[1].trim();
        console.log(`Extracted marriage certificate number from petition: ${extractedData.matriculaCasamento}`);
      } else {
        extractedData.dataCertidaoCasamento = match[1].trim();
        console.log(`Extracted marriage certificate date from petition: ${extractedData.dataCertidaoCasamento}`);
      }
    }
  }
  
  // Look for the record office (cartório)
  const cartorioPatterns = [
    /(?:registrado|registrada|lavrado|lavrada)\s+(?:no|pelo)\s+(?:Cartório|Ofício)\s+([A-Za-zÀ-ÖØ-öø-ÿ\s.,0-9º°]+?)(?=[,\.]|\n|$)/i,
    /(?:Cartório|Ofício)\s+(?:do|de)\s+([A-Za-zÀ-ÖØ-öø-ÿ\s.,0-9º°]+?)(?=[,\.]|\n|$)/i
  ];
  
  for (const pattern of cartorioPatterns) {
    const match = content.match(pattern);
    if (match && match[1] && match[1].trim().length > 2) {
      if (match[0].toLowerCase().includes('casamento')) {
        extractedData.cartorioCasamento = match[1].trim();
        console.log(`Extracted marriage record office from petition: ${extractedData.cartorioCasamento}`);
      } else if (match[0].toLowerCase().includes('óbito')) {
        extractedData.cartorioObito = match[1].trim();
        console.log(`Extracted death record office from petition: ${extractedData.cartorioObito}`);
      } else {
        extractedData.cartorioCompetente = match[1].trim();
        console.log(`Extracted competent record office from petition: ${extractedData.cartorioCompetente}`);
      }
    }
  }
};

// Helper function to populate missing but required fields for inventory documents
const populateMissingInventoryFields = (extractedData: Record<string, string>): void => {
  const requiredFields: Record<string, string> = {
    falecido: "Não identificado",
    inventariante: "Não identificado",
    dataFalecimento: "Não identificada",
    herdeiro1: "Não identificado",
    dataCasamento: "Não identificada",
    regimeBens: "comunhão parcial de bens",
    advogado: "Não identificado",
    conjuge: "Não identificado",
    numeroFilhos: "Não identificado",
    hospitalFalecimento: "Não identificado",
    cidadeFalecimento: "Brasília",
    matriculaObito: "Não identificado",
    dataCertidaoObito: "Não identificada",
    cartorioObito: "Não identificado",
    matriculaCasamento: "Não identificado",
    dataCertidaoCasamento: "Não identificada",
    cartorioCasamento: "Não identificado",
    cartorioCompetente: "Não identificado",
    numeroApartamento: "",
    blocoApartamento: "",
    quadraApartamento: "",
    matriculaImovel: "",
    inscricaoGDF: "",
    valorPartilhaImovel: "",
    valorTotalBens: "Não apurado",
    valorTotalMeacao: "Não apurado",
    valorUnitarioHerdeiros: "Não apurado",
    numeroITCMD: "Não identificado",
    valorITCMD: "Não identificado",
    percentualHerdeiros: "Não identificado"
  };
  
  for (const [key, defaultValue] of Object.entries(requiredFields)) {
    if (!extractedData[key]) {
      extractedData[key] = defaultValue;
    }
  }
  
  // If we have the deceased and the spouse but not the inventory administrator, use the spouse
  if (extractedData.falecido !== "Não identificado" && 
      extractedData.conjuge !== "Não identificado" && 
      extractedData.inventariante === "Não identificado") {
    extractedData.inventariante = extractedData.conjuge;
    console.log(`Using spouse as inventory administrator: ${extractedData.inventariante}`);
  }
  
  // If we have identification info but no heirs, try to extract from the broader content
  if (extractedData.falecido !== "Não identificado" && extractedData.herdeiro1 === "Não identificado") {
    // We might still need to find heirs
    console.log("No heirs identified yet. Will try to extract from context clues.");
  }
  
  // Calculate property values if we have some data
  if (extractedData.valorPartilhaImovel && extractedData.valorPartilhaImovel !== "") {
    try {
      // Set total assets value if we have property value
      extractedData.valorTotalBens = extractedData.valorPartilhaImovel;
      
      // Try to calculate spouse's share
      extractedData.valorTotalMeacao = extractedData.valorPartilhaImovel;
      console.log(`Set total assets value: ${extractedData.valorTotalBens}`);
      
      // Try to calculate heirs' share
      const numHeirs = parseInt(extractedData.numeroFilhos);
      if (!isNaN(numHeirs) && numHeirs > 0) {
        extractedData.percentualHerdeiros = `${(50 / numHeirs).toFixed(2)}%`;
        console.log(`Calculated heirs percentage: ${extractedData.percentualHerdeiros}`);
      }
    } catch (error) {
      console.error("Error calculating property values:", error);
    }
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
    
    // Try to extract the deceased person's name - improved pattern matching
    const deceasedMatch = content.match(/(?:falecido|de cujus|inventariado|autor[a]? da herança)(?:[:\s]+)([A-Za-zÀ-ÖØ-öø-ÿ\s]+?)(?:[,\.]|$)/i) ||
                          content.match(/espólio\s+de\s+([A-Za-zÀ-ÖØ-öø-ÿ\s]+?)(?:[,\.]|$)/i) ||
                          content.match(/(?:falecimento de|faleceu)(?:[:\s]+)([A-Za-zÀ-ÖØ-öø-ÿ\s]+?)(?:[,\.]|$)/i);
    if (deceasedMatch && deceasedMatch[1]) {
      extractedData.falecido = deceasedMatch[1].trim();
      console.log(`Extracted deceased person: ${extractedData.falecido}`);
    }
    
    // Try to extract death date - improved pattern matching
    const deathDateMatch = content.match(/(?:falecido\s+em|data\s+do\s+óbito|faleceu\s+aos)(?:[:\s]+)([\d\/\s]+d[e\s]+[a-zç]+d[e\s]+\d{4}|[\d\/\.-]+)/i);
    if (deathDateMatch && deathDateMatch[1]) {
      extractedData.dataFalecimento = deathDateMatch[1].trim();
      console.log(`Extracted death date: ${extractedData.dataFalecimento}`);
    }
    
    // Try to extract inventory administrator - improved pattern matching
    const inventoryAdminMatch = content.match(/(?:inventariante|viúvo\(a\)-meeiro\(a\))(?:[:\s]+)([A-Za-zÀ-ÖØ-öø-ÿ\s]+?)(?:[,\.]|$)/i) ||
                              content.match(/nomeiam como inventariante\s+([A-Za-zÀ-ÖØ-öø-ÿ\s]+?)(?:[,\.]|$)/i);
    if (inventoryAdminMatch && inventoryAdminMatch[1]) {
      extractedData.inventariante = inventoryAdminMatch[1].trim();
      console.log(`Extracted inventory administrator: ${extractedData.inventariante}`);
    }
    
    // Try to extract the spouse
    const spouseMatch = content.match(/(?:cônjuge|casado\s+com|casada\s+com)(?:[:\s]+)([A-Za-zÀ-ÖØ-öø-ÿ\s]+?)(?:[,\.]|$)/i);
    if (spouseMatch && spouseMatch[1]) {
      extractedData.conjuge = spouseMatch[1].trim();
      console.log(`Extracted spouse: ${extractedData.conjuge}`);
    }
    
    // Try to extract marriage date
    const marriageDateMatch = content.match(/(?:desde|data do casamento|casados desde)(?:[:\s]+)([\d\/\s]+d[e\s]+[a-zç]+d[e\s]+\d{4}|[\d\/\.-]+)/i);
    if (marriageDateMatch && marriageDateMatch[1]) {
      extractedData.dataCasamento = marriageDateMatch[1].trim();
      console.log(`Extracted marriage date: ${extractedData.dataCasamento}`);
    }
    
    // Try to extract marriage regime
    const marriageRegimeMatch = content.match(/(?:regime\s+de|sob\s+o\s+regime\s+de)(?:[:\s]+)([A-Za-zÀ-ÖØ-öø-ÿ\s]+?)(?:[,\.]|$)/i);
    if (marriageRegimeMatch && marriageRegimeMatch[1]) {
      extractedData.regimeBens = marriageRegimeMatch[1].trim();
      console.log(`Extracted marriage regime: ${extractedData.regimeBens}`);
    }
    
    // Try to extract lawyer
    const lawyerMatch = content.match(/(?:advogado\(a\)|na qualidade de advogado)(?:[:\s]+)([A-Za-zÀ-ÖØ-öø-ÿ\s]+?)(?:[,\.]|$)/i) ||
                        content.match(/(?:Dr\.|Dra\.)(?:[:\s]+)([A-Za-zÀ-ÖØ-öø-ÿ\s]+?)(?:[,\.]|$)/i);
    if (lawyerMatch && lawyerMatch[1]) {
      extractedData.advogado = lawyerMatch[1].trim();
      console.log(`Extracted lawyer: ${extractedData.advogado}`);
    }
    
    // Try to extract OAB number
    const oabMatch = content.match(/(?:OAB\/[A-Z]{2})(?:[:\s]+)([\d]+)/i) ||
                     content.match(/(?:inscrito\(a\) na OAB\/[A-Z]{2})(?:[:\s]+)([\d]+)/i);
    if (oabMatch && oabMatch[1]) {
      extractedData.oabAdvogado = oabMatch[1].trim();
      console.log(`Extracted OAB number: ${extractedData.oabAdvogado}`);
    }
    
    // Try to extract heirs - improved pattern matching
    const heirMatch = content.match(/(?:herdeiro|herdeira|na qualidade de herdeiro)(?:[:\s]+)([A-Za-zÀ-ÖØ-öø-ÿ\s]+?)(?:[,\.]|$)/i);
    if (heirMatch && heirMatch[1]) {
      extractedData.herdeiro1 = heirMatch[1].trim();
      console.log(`Extracted heir: ${extractedData.herdeiro1}`);
    }
    
    // Scan for additional heirs
    const heirLines = content.match(/(?:herdeiros|filhos)(?:[:\s]+)([^\n]+)/i);
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
      if (heirList.length > 2) {
        extractedData.herdeiro3 = heirList[2].trim();
        console.log(`Extracted heir 3: ${extractedData.herdeiro3}`);
      }
      if (heirList.length > 3) {
        extractedData.herdeiro4 = heirList[3].trim();
        console.log(`Extracted heir 4: ${extractedData.herdeiro4}`);
      }
      if (heirList.length > 4) {
        extractedData.herdeiro5 = heirList[4].trim();
        console.log(`Extracted heir 5: ${extractedData.herdeiro5}`);
      }
      
      // Store number of heirs
      extractedData.numeroFilhos = String(heirList.length);
    }
    
    // Try to extract property details - apartment number
    const apartmentNumberMatch = content.match(/(?:apartamento|apto)(?:[:\s]+n[º°]?\s*)([\d]+)/i);
    if (apartmentNumberMatch && apartmentNumberMatch[1]) {
      extractedData.numeroApartamento = apartmentNumberMatch[1].trim();
      console.log(`Extracted apartment number: ${extractedData.numeroApartamento}`);
    }
    
    // Try to extract property details - block
    const blockMatch = content.match(/(?:bloco)(?:[:\s]+["']?([A-Z]?)["']?)/i);
    if (blockMatch && blockMatch[1]) {
      extractedData.blocoApartamento = blockMatch[1].trim();
      console.log(`Extracted block: ${extractedData.blocoApartamento}`);
    }
    
    // Try to extract property address - specific to Brasília format (SQN, etc)
    const addressMatch = content.match(/(?:S[QC][NS]|CRS|CLS)(?:[:\s]+)([\d]+)/i);
    if (addressMatch && addressMatch[1]) {
      extractedData.quadraApartamento = addressMatch[0] + " " + addressMatch[1].trim();
      console.log(`Extracted address: ${extractedData.quadraApartamento}`);
    }
    
    // Try to extract property registration number
    const propertyRegMatch = content.match(/(?:matrícula)(?:[:\s]+n[º°]?\s*)([\d\.]+)/i);
    if (propertyRegMatch && propertyRegMatch[1]) {
      extractedData.matriculaImovel = propertyRegMatch[1].trim();
      console.log(`Extracted property registration: ${extractedData.matriculaImovel}`);
    }
    
    // Try to extract GDF registration number
    const gdfRegMatch = content.match(/(?:GDF sob o n[º°])(?:[:\s]+)([\d\.]+)/i);
    if (gdfRegMatch && gdfRegMatch[1]) {
      extractedData.inscricaoGDF = gdfRegMatch[1].trim();
      console.log(`Extracted GDF registration: ${extractedData.inscricaoGDF}`);
    }
    
    // Try to extract property value
    const propertyValueMatch = content.match(/(?:valor de)(?:[:\s]+)(R\$\s*[\d\.,]+)/i);
    if (propertyValueMatch && propertyValueMatch[1]) {
      extractedData.valorPartilhaImovel = propertyValueMatch[1].trim();
      console.log(`Extracted property value: ${extractedData.valorPartilhaImovel}`);
    }
    
    // Try to extract ITCMD registration number
    const itcmdRegMatch = content.match(/(?:ITCMD)(?:[,\s]+)(?:sob o n[º°])(?:[:\s]+)([\d\.]+)/i);
    if (itcmdRegMatch && itcmdRegMatch[1]) {
      extractedData.numeroITCMD = itcmdRegMatch[1].trim();
      console.log(`Extracted ITCMD registration: ${extractedData.numeroITCMD}`);
    }
    
    // Try to extract ITCMD value
    const itcmdValueMatch = content.match(/(?:ITCMD)(?:[,\s]+)(?:no valor de)(?:[:\s]+)(R\$\s*[\d\.,]+)/i);
    if (itcmdValueMatch && itcmdValueMatch[1]) {
      extractedData.valorITCMD = itcmdValueMatch[1].trim();
      console.log(`Extracted ITCMD value: ${extractedData.valorITCMD}`);
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

TÍTULO AQUISITIVO: O referido imóvel foi adquirido pelo OUTORGANTE VENDEDOR através de Escritura Pública de Compra e Venda lavrada no 10º Tabelionato de Notas desta Capital.`;
      break;
    
    case 'Inventário':
      content = `ESCRITURA PÚBLICA DE INVENTÁRIO E PARTILHA, na forma abaixo:
= S A I B A M = quantos esta virem que, ${formattedDate}, nesta cidade de Brasília, Distrito
Federal, Capital da República Federativa do Brasil, nesta Serventia, perante
mim, Escrevente, compareceram como Outorgantes e reciprocamente
Outorgados, na qualidade de viúvo(a)-meeiro(a):
${data.inventariante || data.conjuge || 'Nome do viúvo(a)-meeiro(a) não identificado'}, ${data.nacionalidade || 'brasileiro(a)'}, ${data.estadoCivil || 'viúvo(a)'}, ${data.profissao || 'profissão não identificada'}, portador(a) da Cédula de Identidade RG nº ${data.rg || 'não informado'}, inscrito(a) no CPF/MF sob nº ${data.cpf || 'não informado'}, residente e domiciliado(a) em ${data.endereco || 'endereço não informado'};

e, na qualidade de herdeiros-filhos:
${data.herdeiro1 || 'Nome do herdeiro 1 não identificado'}, ${data.nacionalidadeHerdeiro1 || 'brasileiro(a)'}, ${data.estadoCivilHerdeiro1 || 'estado civil não informado'}, ${data.profissaoHerdeiro1 || 'profissão não identificada'}, portador(a) da Cédula de Identidade RG nº ${data.rgHerdeiro1 || 'não informado'}, inscrito(a) no CPF/MF sob nº ${data.cpfHerdeiro1 || 'não informado'}, residente e domiciliado(a) em ${data.enderecoHerdeiro1 || 'endereço não informado'};
${data.herdeiro2 ? `${data.herdeiro2}, ${data.nacionalidadeHerdeiro2 || 'brasileiro(a)'}, ${data.estadoCivilHerdeiro2 || 'estado civil não informado'}, ${data.profissaoHerdeiro2 || 'profissão não identificada'}, portador(a) da Cédula de Identidade RG nº ${data.rgHerdeiro2 || 'não informado'}, inscrito(a) no CPF/MF sob nº ${data.cpfHerdeiro2 || 'não informado'}, residente e domiciliado(a) em ${data.enderecoHerdeiro2 || 'endereço não informado'};` : ''}
${data.herdeiro3 ? `${data.herdeiro3}, ${data.nacionalidadeHerdeiro3 || 'brasileiro(a)'}, ${data.estadoCivilHerdeiro3 || 'estado civil não informado'}, ${data.profissaoHerdeiro3 || 'profissão não identificada'}, portador(a) da Cédula de Identidade RG nº ${data.rgHerdeiro3 || 'não informado'}, inscrito(a) no CPF/MF sob nº ${data.cpfHerdeiro3 || 'não informado'}, residente e domiciliado(a) em ${data.enderecoHerdeiro3 || 'endereço não informado'};` : ''}
${data.herdeiro4 ? `${data.herdeiro4}, ${data.nacionalidadeHerdeiro4 || 'brasileiro(a)'}, ${data.estadoCivilHerdeiro4 || 'estado civil não informado'}, ${data.profissaoHerdeiro4 || 'profissão não identificada'}, portador(a) da Cédula de Identidade RG nº ${data.rgHerdeiro4 || 'não informado'}, inscrito(a) no CPF/MF sob nº ${data.cpfHerdeiro4 || 'não informado'}, residente e domiciliado(a) em ${data.enderecoHerdeiro4 || 'endereço não informado'};` : ''}
${data.herdeiro5 ? `${data.herdeiro5}, ${data.nacionalidadeHerdeiro5 || 'brasileiro(a)'}, ${data.estadoCivilHerdeiro5 || 'estado civil não informado'}, ${data.profissaoHerdeiro5 || 'profissão não identificada'}, portador(a) da Cédula de Identidade RG nº ${data.rgHerdeiro5 || 'não informado'}, inscrito(a) no CPF/MF sob nº ${data.cpfHerdeiro5 || 'não informado'}, residente e domiciliado(a) em ${data.enderecoHerdeiro5 || 'endereço não informado'};` : ''}

e, na qualidade de advogado:
${data.advogado || 'Nome do advogado não identificado'}, ${data.nacionalidadeAdvogado || 'brasileiro(a)'}, ${data.estadoCivilAdvogado || 'estado civil não informado'}, advogado(a) inscrito(a) na OAB sob nº ${data.oabAdvogado || 'não informado'}, portador(a) da Cédula de Identidade RG nº ${data.rgAdvogado || 'não informado'}, inscrito(a) no CPF/MF sob nº ${data.cpfAdvogado || 'não informado'};

Todos os presentes foram reconhecidos e identificados como os próprios de que
trato, pelos documentos apresentados, cuja capacidade jurídica reconheço e dou
fé. E, pelos Outorgantes e reciprocamente Outorgados, devidamente orientados
pelo(a) advogado(a), acima nomeado e qualificado, legalmente constituído(a)
para este ato, me foi requerida a lavratura do inventário e partilha amigável
dos bens e direitos deixados pelo falecimento de ${data.falecido || 'Nome do falecido não identificado'}, conforme dispõe na Lei
nº 13.105/2015, regulamentada pela Resolução nº 35 de 24 abril de 2007, do
Conselho Nacional de Justiça, nos seguintes termos e condições:

1. DO(A) AUTOR(A) DA HERANÇA – O(A) autor(a) da herança, ${data.falecido || 'Nome do falecido não identificado'}, ${data.nacionalidadeFalecido || 'brasileiro(a)'}, ${data.estadoCivilFalecido || 'estado civil não informado'}, ${data.profissaoFalecido || 'profissão não identificada'}, portador(a) da Cédula de Identidade RG nº ${data.rgFalecido || 'não informado'}, inscrito(a) no CPF/MF sob nº ${data.cpfFalecido || 'não informado'}.
1.1. Foi casado com o(a) viúvo(a)-meeiro(a), ${data.inventariante || data.conjuge || 'Nome do cônjuge não identificado'}, já anteriormente
qualificado(a), desde ${data.dataCasamento || 'data não informada'}, sob o regime de ${data.regimeBens || 'comunhão parcial de bens'}, conforme certidão
de casamento expedida aos ${data.dataCertidaoCasamento || 'data não informada'}, registrada sob a matrícula nº ${data.matriculaCasamento || 'não informado'}, pelo
Cartório do ${data.cartorioCasamento || 'não informado'};
1.2. Faleceu aos ${data.dataFalecimento || 'data não informada'}, no Hospital ${data.hospitalFalecimento || 'não informado'}, na cidade de ${data.cidadeFalecimento || 'Brasília'}, conforme certidão de
óbito expedida aos ${data.dataCertidaoObito || 'data não informada'}, registrada sob a matrícula nº ${data.matriculaObito || 'não informado'}, pelo Cartório do ${data.cartorioObito || 'não informado'};
1.3. Do relacionamento do(a) autor(a) da herança com o(a) ora viúvo(a)-
meeiro(a) nasceram ${data.numeroFilhos || 'não informado'} filhos, todos maiores e capazes, a saber:
${data.herdeiro1 || 'Nome do herdeiro 1 não identificado'}, ${data.herdeiro2 ? data.herdeiro2 + ', ' : ''}${data.herdeiro3 ? data.herdeiro3 + ', ' : ''}${data.herdeiro4 ? data.herdeiro4 + ', ' : ''}${data.herdeiro5 ? data.herdeiro5 : ''} declarando os presentes que desconhece(m) a existência de
outros herdeiros, a não ser o(s) mencionado(s) no presente ato.

DAS DECLARAÇÕES DAS PARTES - As partes declaram sob as penas da lei,
que:
a) o(a) autor(a) da herança não deixou testamento conhecido, por qualquer
natureza;
${data.temTestamento ? `CASO TENHA DEIXADO TESTAMENTO - CONSTAR O SEGUINTE TEXTO:
a) o(a) falecido(a) deixou testamento que foi aberto nos autos do processo nº${data.processoTestamento || '---'}
----------------------------------------- e teve autorização expressa para realização
do inventário por meio de Escritura Pública emanada pelo (a) Juiz (a) ${data.juizTestamento || '---'}
-----------------------------, em${data.dataTestamento || '---'}, tudo conforme o
estabelecido no artigo 12-B da resolução 35 do Conselho Nacional de Justiça.` : ''}
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
Outorgados, de comum acordo, nomeiam como inventariante do espólio, ${data.inventariante || 'Nome do inventariante não identificado'},
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
${data.numeroApartamento ? `4.1. Apartamento nº ${data.numeroApartamento || '101'}, do Bloco "${data.blocoApartamento || 'A'}", da ${data.quadraApartamento || 'SQN 000'}, desta Capital,
${data.descricaoAdicionalImovel || ''} com direito a vaga na garagem, melhor descrito e caracterizado na
matrícula nº ${data.matriculaImovel || '00000'}, do ${data.oficioImovel || '0'}º Ofício do Registro de Imóveis do
Distrito Federal. Inscrição do imóvel junto ao GDF sob o nº ${data.inscricaoGDF || '00000000000'}. Que
referido imóvel foi adquirido pelo(a) autor(a) da herança e seu cônjuge da
seguinte forma: conforme R-${data.registroImovel || '00'}, na matrícula nº ${data.matriculaImovel || '00000'}, do mencionado registro
imobiliário, e ao referido imóvel o(a)(s) herdeiro(a)(s) atribui(em) meramente
para fins em partilha o valor de ${data.valorPartilhaImovel || 'R$ 1.000.000,00 (um milhão de reais)'}, sendo o valor para fins em
meação em ${data.valorMeacaoImovel || 'R$ 500.000,00 (quinhentos mil reais)'}, e o valor arbitrado pela SEFAZ/DF para fins de
cálculo de ITCD em 2025 no valor de ${data.valorImovelITCD || 'R$ 1.000.000,00 (um milhão de reais)'};` : ''}

${data.veiculoMarca ? `4.2. VEÍCULO marca ${data.veiculoMarca || 'não informado'}, cor ${data.veiculoCor || 'não informado'}, categoria PARTICULAR, combustível
${data.veiculoCombustivel || 'ÁLCOOL/GASOLINA'}, placa ${data.veiculoPlaca || 'não informado'}, chassi nº ${data.veiculoChassi || 'não informado'}, ano ${data.veiculoAno || 'não informado'}, modelo ${data.veiculoModelo || 'não informado'},
renavam nº ${data.veiculoRenavam || 'não informado'}, e ao referido veículo o(a)(s) herdeiro(a)(s) atribui(em)
meramente para fins em partilha o valor de ${data.valorPartilhaVeiculo || 'R$ 50.000,00 (cinquenta mil reais)'}, sendo o valor para
fins em meação em ${data.valorMeacaoVeiculo || 'R$ 25.000,00 (vinte e cinco mil reais)'}, e o valor arbitrado pela SEFAZ/DF para fins
de cálculo de ITCD em 2025 no valor de ${data.valorVeiculoITCD || 'R$ 50.000,00 (cinquenta mil reais)'};` : ''}

${data.saldoBancario ? `4.3. Saldo em Conta corrente/poupança nº ${data.numeroConta || 'não informado'}, Agência nº ${data.numeroAgencia || 'não informado'}, junto ao
Banco ${data.nomeBanco || 'não informado'}, no valor de ${data.saldoBancario || 'R$ 10.000,00 (dez mil reais)'} e acréscimos ou deduções se houver;` : ''}

${data.cotasSociais ? `4.4. ${data.quantidadeCotasSociais || 'não informado'} cotas de Capital Social da Empresa
${data.nomeEmpresa || 'não informado'}, inscrita no CNPJ sob o nº ${data.cnpjEmpresa || 'não informado'}, correspondente a
${data.percentualEmpresa || 'não informado'}% do patrimônio liquido. As partes atribuem o valor de
R$ ${data.valorCotasSociais || 'não informado'}, para fins de partilha. Conforme Contrato Social o valor do capital
social é de R$ ${data.valorCapitalSocial || 'não informado'}, conforme balanço patrimonial o valor do patrimônio
líquido é de R$ ${data.valorPatrimonioLiquido || 'não informado'};` : ''}

5. DA PARTILHA - O(s) bem(s) constante(s) do item "4." da presente, soma(m)
ou valor de ${data.valorTotalBens || 'R$ 1.060.000,00 (um milhão e sessenta mil reais)'} e será(ão) partilhado(s) da seguinte forma:
5.1. Caberá ao(a) viúvo(a)-meeiro(a), ${data.inventariante || data.conjuge || 'Nome do viúvo(a)-meeiro(a) não identificado'}, em razão de sua meação, 50%
(cinquenta por cento) de todos os bens descritos e caracterizados no item "4."
da presente, correspondendo ao valor de ${data.valorTotalMeacao || 'R$ 530.000,00 (quinhentos e trinta mil reais)'};
5.2. Caberá a cada um do(s) herdeiro(s), ${data.herdeiro1 || 'Nome do herdeiro 1 não identificado'}${data.herdeiro2 ? ', ' + data.herdeiro2 : ''}${data.herdeiro3 ? ', ' + data.herdeiro3 : ''}, em razão da sucessão legítima,
${data.percentualHerdeiros || 'não informado'}, de todos o(s) bem(s) descrito(s) e caracterizados no item "4." da presente,
correspondendo ao valor unitário de ${data.valorUnitarioHerdeiros || 'R$ 265.000,00 (duzentos e sessenta e cinco mil reais)'}.

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
nº ${data.numeroCertidaoPGFN || 'não informado'}, emitida aos ${data.dataCertidaoPGFN || 'não informado'}, às ${data.horaCertidaoPGFN || 'não informado'}, válida até ${data.validadeCertidaoPGFN || 'não informado'}, em nome e CPF do(a) falecido(a);
d) Certidão Negativa de Débitos, expedida pelo GDF sob o nº ${data.numeroCertidaoGDF || 'não informado'}, emitida aos ${data.dataCertidaoGDF || 'não informado'},
válida até ${data.validadeCertidaoGDF || 'não informado'}, em nome e CPF do(a) falecido(a);
e) Certidão Negativa de Débitos de Tributos Imobiliários, expedida pelo GDF sob
o nº ${data.numeroCertidaoImobiliaria || 'não informado'}, emitida aos ${data.dataCertidaoImobiliaria || 'não informado'}, válida até ${data.validadeCertidaoImobiliaria || 'não informado'}, referente ao imóvel descrito no subitem ${data.subItemImovel || 'não informado'},
inscrição ${data.inscricaoTributaria || 'não informado'};
f) Certidão Negativa de Testamento, emitida pela Central de Serviços Eletrônicos
Compartilhados - CENSEC, em nome do(a)(s) autor(a)(es) da herança.

${data.imovelOutroEstado ? `g) Certidão Negativa de Débitos, expedida pela Prefeitura de ${data.nomePrefeitura || 'não informado'} sob o nº
${data.numeroCertidaoPrefeitura || 'não informado'}, emitida aos ${data.dataCertidaoPrefeitura || 'não informado'}, válida até ${data.validadeCertidaoPrefeitura || 'não informado'}, em nome e CPF do(a) falecido(a);` : ''}

${data.imovelRural ? `g) Certificado de Cadastro de Imóvel Rural - CCIR, sob o nº ${data.numeroCCIR || 'não informado'}, código do imóvel
rural ${data.codigoImovelRural || 'não informado'}, referente ao exercício ${data.exercicioCCIR || 'não informado'}, com as seguintes medidas: área total ${data.areaTotalRural || 'não informado'},
denominação do imóvel ${data.denominacaoImovelRural || 'não informado'}, indicações para localização do imóvel: ${data.localizacaoImovelRural || 'não informado'}, município
sede do imóvel: ${data.municipioImovelRural || 'não informado'}, classificação fundiária ${data.classificacaoFundiaria || 'não informado'}, nºs. de módulos fiscais ${data.modulosFiscais || 'não informado'}, fração
mínima de parcelamento ${data.fracaoMinimaParcelamento || 'não informado'}, área registrada ${data.areaRegistrada || 'não informado'}, posse a justo título ${data.posseJustoTitulo || 'não informado'}, em relação ao
imóvel descrito e caracterizado no item ${data.itemImovelRural || 'não informado'};

h) Certidão Negativa de Débitos Relativos ao Imposto sobre a Propriedade
Territorial Rural, expedida pela SRFB, sob o nº ${data.numeroCertidaoITR || 'não informado'}, emitida às ${data.horaCertidaoITR || 'não informado'} horas, dia ${data.dataCertidaoITR || 'não informado'}, válida
até ${data.validadeCertidaoITR || 'não informado'}, CIB: ${data.cibCertidaoITR || 'não informado'}, em relação ao imóvel descrito e caracterizado no item ${data.itemImovelCertidaoITR || 'não informado'};

i) Certidão Negativa de Débitos - Ministério do Meio Ambiente - MMA - Instituto
Brasileiro do Meio Ambiente e dos Recursos Naturais Renováveis - IBAMA, sob
os nº ${data.numeroCertidaoIBAMA || 'não informado'}, expedida em ${data.dataCertidaoIBAMA || 'não informado'}, válida até ${data.validadeCertidaoIBAMA || 'não informado'}, em nome do autor da herança.` : ''}

7. DO IMPOSTO DE TRANSMISSÃO "CAUSA MORTIS" E DOAÇÃO - Guia de
transmissão causa mortis e doação de quaisquer bens e direitos - ITCMD,
expedida pela Secretaria de Estado da Fazenda do Distrito Federal sob o nº
${data.numeroITCMD || 'não informado'}, no valor de ${data.valorITCMD || 'não informado'}, paga aos ${data.dataPagamentoITCMD || 'não informado'}, no mesmo valor, sob a alíquota de 4% sobre o valor
total tributável de ${data.valorTributavelITCMD || 'não informado'}, em relação à sucessão legítima.

8. DAS DECLARAÇÕES DO(A) ADVOGADO(A) - Pelo(a) advogado(a) me foi
dito que, na qualidade de advogado(a) das partes, assessorou e aconselhou
seus constituintes, tendo conferido a correção da partilha e seus valores de
acordo com a Lei. 9. DAS DECLARAÇÕES FINAIS - Os comparecentes
requerem e autorizam ao Cartório do Registro de Imóveis competente ${data.cartorioCompetente || 'não informado'} e
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
no(s) CPF do(a) autor(a) da herança, conforme código hash sob o nº ${data.hashCNIB || 'não informado'}, com o
resultado NEGATIVO, conforme dispõe o artigo 7º, do Provimento nº 39/2014,
da Corregedoria Nacional de Justiça, datado de 25 de Julho de 2014. Emitida a
DOI - Declaração sobre operação imobiliária, conforme instrução normativa da
Receita Federal do Brasil. Ficam ressalvados eventuais erros, omissões ou
direitos de terceiros porventura existentes. Assim o disseram, pediram-me e eu
Escrevente lhes lavrei a presente escritura, que feita e lhes sendo lida, foi achada
em tudo conforme, aceitam e assinam.`;
      break;
      
    case 'Doação':
      content = `ESCRITURA PÚBLICA DE DOAÇÃO

Este é um modelo de documento de doação.`;
      break;
      
    case 'União Estável':
      content = `ESCRITURA PÚBLICA DE UNIÃO ESTÁVEL

Este é um modelo de documento de união estável.`;
      break;
      
    case 'Procuração':
      content = `PROCURAÇÃO

Este é um modelo de procuração.`;
      break;
      
    case 'Testamento':
      content = `TESTAMENTO PÚBLICO

Este é um modelo de testamento público.`;
      break;
    
    case 'Contrato de Aluguel':
      content = `CONTRATO DE LOCAÇÃO DE IMÓVEL RESIDENCIAL

LOCADOR: ${data.locador || 'Nome do Locador'}, ${data.nacionalidadeLocador || 'nacionalidade'}, ${data.estadoCivilLocador || 'estado civil'}, ${data.profissaoLocador || 'profissão'}, portador da cédula de identidade RG nº ${data.rgLocador || 'número'}, inscrito no CPF sob nº ${data.cpfLocador || 'número'}, residente e domiciliado à ${data.enderecoLocador || 'endereço completo'}.

LOCATÁRIO: ${data.locatario || 'Nome do Locatário'}, ${data.nacionalidadeLocatario || 'nacionalidade'}, ${data.estadoCivilLocatario || 'estado civil'}, ${data.profissaoLocatario || 'profissão'}, portador da cédula de identidade RG nº ${data.rgLocatario || 'número'}, inscrito no CPF sob nº ${data.cpfLocatario || 'número'}, residente e domiciliado à ${data.enderecoLocatario || 'endereço completo'}.

As partes acima identificadas têm, entre si, justo e acertado o presente Contrato de Locação de Imóvel Residencial, que se regerá pelas cláusulas seguintes e pelas condições descritas no presente.`;
      break;
      
    case 'Contrato Social':
      content = `CONTRATO SOCIAL DE SOCIEDADE LIMITADA

Pelo presente instrumento particular de contrato social:

SÓCIO 1: ${data.socio1 || 'Nome do Sócio 1'}, ${data.nacionalidadeSocio1 || 'nacionalidade'}, ${data.estadoCivilSocio1 || 'estado civil'}, ${data.profissaoSocio1 || 'profissão'}, portador da cédula de identidade RG nº ${data.rgSocio1 || 'número'}, inscrito no CPF sob nº ${data.cpfSocio1 || 'número'}, residente e domiciliado à ${data.enderecoSocio1 || 'endereço completo'};

SÓCIO 2: ${data.socio2 || 'Nome do Sócio 2'}, ${data.nacionalidadeSocio2 || 'nacionalidade'}, ${data.estadoCivilSocio2 || 'estado civil'}, ${data.profissaoSocio2 || 'profissão'}, portador da cédula de identidade RG nº ${data.rgSocio2 || 'número'}, inscrito no CPF sob nº ${data.cpfSocio2 || 'número'}, residente e domiciliado à ${data.enderecoSocio2 || 'endereço completo'};

Resolvem constituir uma sociedade limitada, mediante as seguintes cláusulas:`;
      break;
      
    default:
      content = `DOCUMENTO GENÉRICO

Este é um modelo genérico de documento jurídico.
Data: ${formattedDate}`;
      break;
  }
  
  return content;
};
