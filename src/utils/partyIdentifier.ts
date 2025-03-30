
import { toast } from 'sonner';
import * as pdfjs from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

// Set up PDF.js worker
const pdfjsWorker = pdfjs.GlobalWorkerOptions.workerSrc = 
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// This function uses OCR and PDF extraction to identify parties and roles from document text
export const identifyPartiesAndRoles = async (
  files: File[], 
  documentType: string,
  baseData: Record<string, string>
): Promise<Record<string, string>> => {
  console.log(`Identifying parties and roles from ${files.length} files for document type: ${documentType}`);
  
  // Initialize extracted data with base data and current date
  const extractedData: Record<string, string> = {
    ...baseData,
    dataLavratura: new Date().toLocaleDateString('pt-BR'),
  };
  
  // Track extraction progress for UI feedback
  let processedFiles = 0;
  const totalFiles = files.length;
  
  // Process each file to extract text and identify relevant information
  for (const file of files) {
    try {
      console.log(`Processing file: ${file.name}`);
      toast.info(`Processando: ${file.name}`);
      
      // Extract text from file using OCR or PDF extraction based on file type
      const fileText = await extractTextFromFile(file);
      console.log(`Extracted ${fileText.length} characters of text from ${file.name}`);
      
      // Analyze document based on filename patterns and extracted text
      await analyzeDocument(file, fileText, extractedData);
      
      // Update progress
      processedFiles++;
      console.log(`Progress: ${processedFiles}/${totalFiles} files processed`);
      
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      toast.error(`Erro ao processar ${file.name}. Verifique se o arquivo é válido.`);
    }
  }
  
  // Process the author of estate qualification if we have components
  if (extractedData.falecido) {
    console.log("Building complete qualification for falecido");
    let qualificacaoFalecido = `${extractedData.falecido}`;
    if (extractedData.nacionalidadeFalecido) qualificacaoFalecido += `, ${extractedData.nacionalidadeFalecido}`;
    if (extractedData.estadoCivilFalecido) qualificacaoFalecido += `, ${extractedData.estadoCivilFalecido}`;
    if (extractedData.profissaoFalecido) qualificacaoFalecido += `, ${extractedData.profissaoFalecido}`;
    if (extractedData.rgFalecido) qualificacaoFalecido += `, portador do RG nº ${extractedData.rgFalecido}`;
    if (extractedData.cpfFalecido) qualificacaoFalecido += `, inscrito no CPF sob o nº ${extractedData.cpfFalecido}`;
    if (extractedData.enderecoFalecido) qualificacaoFalecido += `, residente e domiciliado à ${extractedData.enderecoFalecido}`;
    
    extractedData.qualificacaoFalecido = qualificacaoFalecido;
    extractedData.qualificacao_do_autor_da_heranca = qualificacaoFalecido;
  } else {
    extractedData.qualificacao_do_autor_da_heranca = "DADO NÃO ENCONTRADO NO PDF";
  }
  
  // Provide default values for missing fields to ensure document generation works
  const requiredFields = [
    'qualificacao_do(a)_viuvo(a)', 
    'qualificacao_do(a)(s)_herdeiro(a)(s)',
    'nome_do_advogado',
    'nome_do_"de_cujus"',
    'nome_do_autor_da_heranca',
    'qualificacao_do_autor_da_heranca',
    'nome_do(a)_viuva(o)-meeira(o)',
    'regime',
    'data_do_casamento',
    'data_do_falecimento',
    'nome_do_hospital',
    'cidade',
    'quantidade_de_filhos',
    'nome_dos_filhos',
    'nome_do_inventariante',
    'DESCRICAO_DO(S)_BEM(NS)',
    'MATRICULA_Nº',
    'nº_do_cartorio',
    'modo_de_aquisicao',
    'REGISTRO_Nº',
    'valor',
    'VALOR_R$',
    'monte_mor',
    'nome_do(a)_viuvo(a)',
    'valor_da_meacao',
    'incluir_o_nome_dos_herdeiros',
    'incluir_o_percentual',
    'incluir_valor_que_pertence_a_cada_herdeiro',
    'nº__da_certidao',
    'data_da_emissao',
    'incluir_hora_de_emissao',
    'validade',
    'nº_da_guia',
    'data_de_pagamento',
    'valor_tributavel'
  ];
  
  // Make sure all required fields have at least a placeholder
  for (const field of requiredFields) {
    if (!extractedData[field]) {
      // Try to find a similar field in our data
      const similarKey = Object.keys(extractedData).find(key => 
        key.toLowerCase().includes(field.toLowerCase().replace(/[()]/g, '')) || 
        field.toLowerCase().includes(key.toLowerCase())
      );
      
      if (similarKey) {
        console.log(`Using ${similarKey} as replacement for missing ${field}`);
        extractedData[field] = extractedData[similarKey];
      } else {
        console.log(`No data found for required field: ${field}`);
        extractedData[field] = "DADO NÃO ENCONTRADO NO PDF";
      }
    }
  }
  
  // Consolidate herdeiros information if available
  if (extractedData.herdeiro1 || extractedData.herdeiro2 || extractedData.herdeiro3) {
    const herdeiros = [
      extractedData.herdeiro1,
      extractedData.herdeiro2,
      extractedData.herdeiro3
    ].filter(Boolean);
    
    if (herdeiros.length > 0) {
      extractedData.nomesFilhos = herdeiros.join(', ');
      extractedData.incluir_o_nome_dos_herdeiros = herdeiros.join(', ');
      console.log("Created consolidated heir names:", extractedData.nomesFilhos);
    }
  }
  
  console.log("Final extracted data:", Object.keys(extractedData));
  
  // Notify user that extraction is complete
  toast.success(`Extração de dados concluída com sucesso para ${files.length} arquivos!`);
  
  return extractedData;
};

// Function to extract text from file
const extractTextFromFile = async (file: File): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log(`Extracting text from ${file.name} (${file.type})`);
      const fileName = file.name.toLowerCase();
      
      // Handle PDF files
      if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument(new Uint8Array(arrayBuffer)).promise;
        
        let fullText = '';
        // Process all pages
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          fullText += pageText + '\n';
        }
        
        // If PDF text extraction returned very little text, it might be a scanned document
        // In that case, use OCR as fallback
        if (fullText.trim().length < 100) {
          console.log(`PDF appears to be scanned (extracted only ${fullText.length} chars). Trying OCR...`);
          toast.info(`${file.name} parece ser um documento escaneado. Aplicando OCR...`);
          
          // Use Tesseract OCR on the first page as demo
          // In a real implementation, we would process all pages
          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          if (context) {
            await page.render({
              canvasContext: context,
              viewport: viewport
            }).promise;
            
            // Process the canvas with Tesseract
            const result = await Tesseract.recognize(canvas, 'por');
            fullText += result.data.text;
            console.log(`OCR extracted ${result.data.text.length} characters`);
          }
        }
        
        console.log(`Extracted ${fullText.length} characters from PDF`);
        resolve(fullText);
      } 
      // Handle images
      else if (file.type.startsWith('image/') || 
               fileName.endsWith('.jpg') || 
               fileName.endsWith('.jpeg') || 
               fileName.endsWith('.png')) {
        toast.info(`Aplicando OCR na imagem: ${file.name}`);
        
        const imageUrl = URL.createObjectURL(file);
        
        // Use Tesseract to extract text from image
        const result = await Tesseract.recognize(imageUrl, 'por');
        console.log(`OCR extracted ${result.data.text.length} characters`);
        
        // Clean up object URL
        URL.revokeObjectURL(imageUrl);
        
        resolve(result.data.text);
      } 
      // Handle Word documents
      else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
               fileName.endsWith('.docx')) {
        // For Word documents, in a full implementation we would use mammoth.js
        // But for now we'll return a placeholder
        console.log(`DOCX processing not implemented in this version`);
        resolve(`Conteúdo do documento Word: ${file.name}`);
      }
      // Fallback for other file types
      else {
        console.log(`Unsupported file type for text extraction: ${file.type}`);
        resolve(`Arquivo não suportado para extração de texto: ${file.name}`);
      }
    } catch (error) {
      console.error(`Error in extractTextFromFile for ${file.name}:`, error);
      reject(error);
    }
  });
};

// Function to analyze document content and extract relevant information
const analyzeDocument = async (
  file: File, 
  text: string, 
  extractedData: Record<string, string>
) => {
  const fileName = file.name.toLowerCase();
  const textLower = text.toLowerCase();
  
  console.log(`Analyzing document: ${fileName}`);
  
  // Check for death certificate
  if (fileName.includes('obito') || 
      fileName.includes('certidao') && fileName.includes('falecimento') ||
      textLower.includes('certidão de óbito') || 
      textLower.includes('registro de óbito')) {
    
    console.log("Detected death certificate document");
    
    // Extract deceased name
    const nameMatch = text.match(/(?:falecido|nome do falecido|nome):?\s*([A-Z][a-zÀ-ú]+(?: [A-ZÀ-Úa-zà-ú]+)+)/i);
    if (nameMatch && nameMatch[1]) {
      extractedData.falecido = nameMatch[1].trim();
      extractedData.nome_do_autor_da_heranca = nameMatch[1].trim();
      extractedData.nome_do_de_cujus = nameMatch[1].trim();
      extractedData['nome_do_"de_cujus"'] = nameMatch[1].trim();
      console.log(`Extracted deceased name: ${nameMatch[1].trim()}`);
    } else {
      extractedData.falecido = `Nome não identificado no documento ${file.name}`;
    }
    
    // Extract death date
    const dateMatch = text.match(/(?:data do falecimento|falecimento em):?\s*(\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2} de [a-zà-ú]+ de \d{4})/i);
    if (dateMatch && dateMatch[1]) {
      extractedData.dataFalecimento = dateMatch[1].trim();
      extractedData.data_do_falecimento = dateMatch[1].trim();
      console.log(`Extracted death date: ${dateMatch[1].trim()}`);
    } else {
      extractedData.dataFalecimento = "Data não identificada no documento";
    }
    
    // Extract hospital
    const hospitalMatch = text.match(/(?:hospital|local do falecimento|faleceu no):?\s*([A-Z][a-zÀ-ú]+(?: [A-ZÀ-Úa-zà-ú]+)+)/i);
    if (hospitalMatch && hospitalMatch[1]) {
      extractedData.hospitalFalecimento = hospitalMatch[1].trim();
      extractedData.nome_do_hospital = hospitalMatch[1].trim();
      console.log(`Extracted hospital: ${hospitalMatch[1].trim()}`);
    }
    
    // Extract city
    const cityMatch = text.match(/(?:cidade|município|em):?\s*([A-Z][a-zÀ-ú]+(?: [A-ZÀ-Úa-zà-ú]+)+)(?:\/[A-Z]{2})?/i);
    if (cityMatch && cityMatch[1]) {
      extractedData.cidadeFalecimento = cityMatch[1].trim();
      extractedData.cidade = cityMatch[1].trim();
      console.log(`Extracted city: ${cityMatch[1].trim()}`);
    }
    
    // Extract registry information
    const registryMatch = text.match(/(?:matrícula|registro):?\s*([0-9.]+)/i);
    if (registryMatch && registryMatch[1]) {
      extractedData['nº_da_matricula_da_cert._obito'] = registryMatch[1].trim();
      console.log(`Extracted registry number: ${registryMatch[1].trim()}`);
    }
  }
  
  // Check for heir information
  if (fileName.includes('herdeiro') || 
      fileName.includes('qualificacao') || 
      fileName.includes('filho') ||
      textLower.includes('herdeiro') || 
      textLower.includes('filho') && textLower.includes('qualificação')) {
    
    console.log("Detected heir qualification document");
    
    // Try to find heir name with qualifications
    const heirMatch = text.match(/([A-Z][a-zÀ-ú]+(?: [A-ZÀ-Úa-zà-ú]+)+),\s*(brasileiro|brasileira)?,\s*([a-zÀ-ú]+),.*?(RG|CPF|identidade)/);
    if (heirMatch) {
      const heirName = heirMatch[1].trim();
      extractedData.herdeiro1 = heirName;
      extractedData.nome_dos_filhos = heirName;
      console.log(`Extracted heir name: ${heirName}`);
      
      // Count heirs - simplistic approach (would use more advanced logic in a real implementation)
      extractedData.quantidade_de_filhos = "1 (um)";
      
      // Extract full qualification
      const qualificationMatch = text.match(/([A-Z][a-zÀ-ú]+(?: [A-ZÀ-Úa-zà-ú]+)+),.*?(residente|domiciliado|domiciliada).+?(\.|$)/);
      if (qualificationMatch) {
        extractedData.qualificacaoHerdeiro1 = qualificationMatch[0].trim();
        extractedData['qualificacao_do(a)(s)_herdeiro(a)(s)'] = qualificationMatch[0].trim();
        console.log(`Extracted heir qualification: ${qualificationMatch[0].trim().substring(0, 50)}...`);
      }
    }
  }
  
  // Check for spouse information
  if (fileName.includes('conjuge') || 
      fileName.includes('viuvo') || 
      fileName.includes('viuva') ||
      textLower.includes('cônjuge') || 
      textLower.includes('viúvo') || 
      textLower.includes('viúva')) {
    
    console.log("Detected spouse document");
    
    // Extract spouse name
    const spouseMatch = text.match(/(?:cônjuge|viúvo|viúva|esposo|esposa):?\s*([A-Z][a-zÀ-ú]+(?: [A-ZÀ-Úa-zà-ú]+)+)/i);
    if (spouseMatch && spouseMatch[1]) {
      const spouseName = spouseMatch[1].trim();
      extractedData.conjuge = spouseName;
      extractedData['nome_do(a)_viuvo(a)'] = spouseName;
      extractedData['nome_do(a)_viuva(o)-meeira(o)'] = spouseName;
      extractedData['viuvo(a)-meeiro(a)'] = spouseName;
      console.log(`Extracted spouse name: ${spouseName}`);
    }
    
    // Extract spouse qualification
    const qualificationMatch = text.match(/([A-Z][a-zÀ-ú]+(?: [A-ZÀ-Úa-zà-ú]+)+),.*?(residente|domiciliado|domiciliada).+?(\.|$)/);
    if (qualificationMatch) {
      const qualification = qualificationMatch[0].trim();
      extractedData.qualificacaoConjuge = qualification;
      extractedData['qualificacao_do(a)_viuvo(a)'] = qualification;
      console.log(`Extracted spouse qualification: ${qualification.substring(0, 50)}...`);
    }
    
    // Try to extract marriage regime
    const regimeMatch = text.match(/(?:regime|casamento):?\s*(comunhão parcial de bens|comunhão universal de bens|separação de bens|separação total)/i);
    if (regimeMatch && regimeMatch[1]) {
      extractedData.regimeBens = regimeMatch[1].trim();
      extractedData.regime = regimeMatch[1].trim();
      console.log(`Extracted marriage regime: ${regimeMatch[1].trim()}`);
    }
    
    // Try to extract marriage date
    const marriageMatch = text.match(/(?:casamento em|casados em|casou-se em):?\s*(\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2} de [a-zà-ú]+ de \d{4})/i);
    if (marriageMatch && marriageMatch[1]) {
      extractedData.dataCasamento = marriageMatch[1].trim();
      extractedData.data_do_casamento = marriageMatch[1].trim();
      console.log(`Extracted marriage date: ${marriageMatch[1].trim()}`);
    }
  }
  
  // Check for property document
  if (fileName.includes('imovel') || 
      fileName.includes('matricula') ||
      textLower.includes('matrícula') || 
      textLower.includes('imóvel') || 
      textLower.includes('registro de imóveis')) {
    
    console.log("Detected property document");
    
    // Extract property description (substantial text block after "imóvel" or "descrição")
    const descMatch = text.match(/(?:imóvel|descrição|descrito como):?\s*([^.]+\.[^.]+\.[^.]+\.)/i);
    if (descMatch && descMatch[1]) {
      const propertyDesc = descMatch[1].trim();
      extractedData.DESCRICAO_DO_BEM = propertyDesc;
      extractedData['DESCRICAO_DO(S)_BEM(NS)'] = propertyDesc;
      console.log(`Extracted property description: ${propertyDesc.substring(0, 50)}...`);
    }
    
    // Extract registration number
    const regMatch = text.match(/(?:matrícula|registro):?\s*(?:n[°º.]|número)?\s*([0-9.]+)/i);
    if (regMatch && regMatch[1]) {
      const matricula = regMatch[1].trim();
      extractedData.MATRICULA_Nº = matricula;
      extractedData['MATRICULA-'] = matricula;
      console.log(`Extracted registration number: ${matricula}`);
    }
    
    // Extract registry office
    const officeMatch = text.match(/(?:\d+º|\d+°|\d+o)(?:\s*ofício|\s*cartório|\s*registro)/i);
    if (officeMatch) {
      extractedData.nº_do_cartorio = officeMatch[0].trim();
      console.log(`Extracted registry office: ${officeMatch[0].trim()}`);
    }
    
    // Extract acquisition method
    const acquisitionMatch = text.match(/(?:adquirido por|havido por|através de):?\s*(compra e venda|doação|herança|permuta|usucapião)/i);
    if (acquisitionMatch && acquisitionMatch[1]) {
      extractedData.modo_de_aquisicao = acquisitionMatch[1].trim();
      console.log(`Extracted acquisition method: ${acquisitionMatch[1].trim()}`);
    }
    
    // Extract registry number
    const registryMatch = text.match(/(?:R-|registro número|sob número):?\s*([0-9-]+)/i);
    if (registryMatch && registryMatch[1]) {
      extractedData.REGISTRO_Nº = registryMatch[1].trim();
      console.log(`Extracted registry entry number: ${registryMatch[1].trim()}`);
    }
    
    // Extract property value
    const valueMatch = text.match(/(?:valor|avaliado em):?\s*(?:R\$|reais)?\s*([0-9.,]+)/i);
    if (valueMatch && valueMatch[1]) {
      const value = valueMatch[1].trim();
      extractedData.valor = `R$ ${value}`;
      extractedData.VALOR_R$ = value;
      console.log(`Extracted property value: R$ ${value}`);
    }
  }
  
  // Check for ITCMD tax document
  if (fileName.includes('itcmd') || 
      fileName.includes('imposto') ||
      textLower.includes('itcmd') || 
      textLower.includes('imposto transmissão')) {
    
    console.log("Detected tax document");
    
    // Extract guide number
    const guideMatch = text.match(/(?:guia|recolhimento):?\s*(?:n[°º.]|número)?\s*([0-9-]+)/i);
    if (guideMatch && guideMatch[1]) {
      extractedData.nº_da_guia = guideMatch[1].trim();
      console.log(`Extracted guide number: ${guideMatch[1].trim()}`);
    }
    
    // Extract payment date
    const paymentMatch = text.match(/(?:pagamento em|pago em|data):?\s*(\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2} de [a-zà-ú]+ de \d{4})/i);
    if (paymentMatch && paymentMatch[1]) {
      extractedData.data_de_pagamento = paymentMatch[1].trim();
      console.log(`Extracted payment date: ${paymentMatch[1].trim()}`);
    }
    
    // Extract taxable value
    const taxValueMatch = text.match(/(?:valor|base de cálculo):?\s*(?:R\$|reais)?\s*([0-9.,]+)/i);
    if (taxValueMatch && taxValueMatch[1]) {
      extractedData.valor_tributavel = `R$ ${taxValueMatch[1].trim()}`;
      console.log(`Extracted taxable value: R$ ${taxValueMatch[1].trim()}`);
    }
  }
  
  // Check for inventory administrator
  if (fileName.includes('inventariante') ||
      textLower.includes('inventariante')) {
    
    console.log("Detected inventory administrator document");
    
    // Extract name
    const nameMatch = text.match(/(?:inventariante):?\s*([A-Z][a-zÀ-ú]+(?: [A-ZÀ-Úa-zà-ú]+)+)/i);
    if (nameMatch && nameMatch[1]) {
      const name = nameMatch[1].trim();
      extractedData.nome_do_inventariante = name;
      extractedData.inventariante = name;
      console.log(`Extracted inventory administrator name: ${name}`);
    }
  }
  
  // Check for lawyer information
  if (fileName.includes('advogado') ||
      textLower.includes('advogado') || 
      textLower.includes('oab')) {
    
    console.log("Detected lawyer document");
    
    // Extract name with title
    const nameMatch = text.match(/(?:(?:Dr|Dra)\.\s*([A-Z][a-zÀ-ú]+(?: [A-ZÀ-Úa-zà-ú]+)+))/i);
    if (nameMatch) {
      const name = nameMatch[0].trim(); // Full match with title
      extractedData.nome_do_advogado = name;
      extractedData.advogado = name;
      console.log(`Extracted lawyer name: ${name}`);
    } else {
      // Try without title
      const simpleName = text.match(/([A-Z][a-zÀ-ú]+(?: [A-ZÀ-Úa-zà-ú]+)+),?\s*advogado/i);
      if (simpleName && simpleName[1]) {
        const name = `Dr. ${simpleName[1].trim()}`;
        extractedData.nome_do_advogado = name;
        extractedData.advogado = name;
        console.log(`Extracted lawyer name: ${name}`);
      }
    }
  }
  
  // Check for assets and estate valuation
  if (fileName.includes('bens') || 
      fileName.includes('patrimonio') ||
      fileName.includes('avaliacao') ||
      textLower.includes('monte mor') || 
      textLower.includes('avaliação de bens')) {
    
    console.log("Detected assets document");
    
    // Extract total estate value
    const totalMatch = text.match(/(?:monte mor|total de bens|patrimônio total):?\s*(?:R\$|reais)?\s*([0-9.,]+)/i);
    if (totalMatch && totalMatch[1]) {
      extractedData.monte_mor = `R$ ${totalMatch[1].trim()}`;
      console.log(`Extracted estate value: R$ ${totalMatch[1].trim()}`);
    }
    
    // Extract spouse's share
    const spouseShareMatch = text.match(/(?:meação|parte do cônjuge):?\s*(?:R\$|reais)?\s*([0-9.,]+)/i);
    if (spouseShareMatch && spouseShareMatch[1]) {
      extractedData.valor_da_meacao = `R$ ${spouseShareMatch[1].trim()}`;
      console.log(`Extracted spouse share: R$ ${spouseShareMatch[1].trim()}`);
    }
    
    // Extract heir percentage
    const percentageMatch = text.match(/(?:percentual|cota parte):?\s*(\d+[.,]?\d*\s*%|\d+[.,]?\d*\s*por cento)/i);
    if (percentageMatch && percentageMatch[1]) {
      let percentage = percentageMatch[1].trim();
      // Convert numeric percentage to text format
      if (percentage.endsWith('%')) {
        const numericValue = parseFloat(percentage.replace('%', '').replace(',', '.'));
        // Format with text representation
        const percentageText = `${numericValue}% (${percentageInWords(numericValue)} por cento)`;
        extractedData.incluir_o_percentual = percentageText;
        console.log(`Extracted heir percentage: ${percentageText}`);
      } else {
        extractedData.incluir_o_percentual = percentage;
        console.log(`Extracted heir percentage: ${percentage}`);
      }
    }
    
    // Extract heir value
    const heirValueMatch = text.match(/(?:valor por herdeiro|valor para cada herdeiro):?\s*(?:R\$|reais)?\s*([0-9.,]+)/i);
    if (heirValueMatch && heirValueMatch[1]) {
      extractedData.incluir_valor_que_pertence_a_cada_herdeiro = `R$ ${heirValueMatch[1].trim()}`;
      console.log(`Extracted heir value: R$ ${heirValueMatch[1].trim()}`);
    }
  }
  
  // Check for certificates and negative certificates
  if (fileName.includes('certidao') || 
      fileName.includes('negativa') || 
      fileName.includes('cnd') ||
      textLower.includes('certidão') || 
      textLower.includes('negativa de débitos')) {
    
    console.log("Detected certificate document");
    
    // Extract certificate number
    const certNumberMatch = text.match(/(?:certidão|certificado):?\s*(?:n[°º.]|número)?\s*([0-9-]+)/i);
    if (certNumberMatch && certNumberMatch[1]) {
      extractedData.nº__da_certidao = certNumberMatch[1].trim();
      console.log(`Extracted certificate number: ${certNumberMatch[1].trim()}`);
    }
    
    // Extract issuance date
    const issueDateMatch = text.match(/(?:emitida em|emissão|expedida em):?\s*(\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2} de [a-zà-ú]+ de \d{4})/i);
    if (issueDateMatch && issueDateMatch[1]) {
      extractedData.data_da_emissao = issueDateMatch[1].trim();
      extractedData.data_de_emissao = issueDateMatch[1].trim();
      console.log(`Extracted issuance date: ${issueDateMatch[1].trim()}`);
    }
    
    // Extract issuance time
    const issueTimeMatch = text.match(/(?:às|hora):?\s*(\d{1,2}:\d{2})/i);
    if (issueTimeMatch && issueTimeMatch[1]) {
      extractedData.incluir_hora_de_emissao = issueTimeMatch[1].trim();
      console.log(`Extracted issuance time: ${issueTimeMatch[1].trim()}`);
    }
    
    // Extract validity date
    const validityMatch = text.match(/(?:válida até|validade):?\s*(\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2} de [a-zà-ú]+ de \d{4})/i);
    if (validityMatch && validityMatch[1]) {
      extractedData.validade = validityMatch[1].trim();
      console.log(`Extracted validity date: ${validityMatch[1].trim()}`);
    }
  }
};

// Helper function to convert numeric percentage to words
const percentageInWords = (percentage: number): string => {
  const numberWords: Record<number, string> = {
    0: 'zero', 1: 'um', 2: 'dois', 3: 'três', 4: 'quatro', 5: 'cinco',
    6: 'seis', 7: 'sete', 8: 'oito', 9: 'nove', 10: 'dez',
    11: 'onze', 12: 'doze', 13: 'treze', 14: 'quatorze', 15: 'quinze',
    16: 'dezesseis', 17: 'dezessete', 18: 'dezoito', 19: 'dezenove', 20: 'vinte',
    25: 'vinte e cinco', 30: 'trinta', 33: 'trinta e três',
    40: 'quarenta', 50: 'cinquenta', 60: 'sessenta',
    70: 'setenta', 75: 'setenta e cinco', 80: 'oitenta', 90: 'noventa', 100: 'cem'
  };

  // Round to whole number for most common percentages
  const roundedPercentage = Math.round(percentage);
  
  if (numberWords[roundedPercentage]) {
    return numberWords[roundedPercentage];
  }
  
  // For more complex numbers, create a simple representation
  if (roundedPercentage < 100) {
    const tens = Math.floor(roundedPercentage / 10) * 10;
    const units = roundedPercentage % 10;
    
    if (units === 0) {
      return numberWords[tens] || `${tens}`;
    } else {
      return `${numberWords[tens] || tens} e ${numberWords[units]}`;
    }
  }
  
  return `${roundedPercentage}`; // Fallback to numeric representation
};

