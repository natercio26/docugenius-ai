
import { DraftType } from '@/types';
import { identifyPartiesAndRoles } from './partyIdentifier';

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
                setTimeout(() => reject(new Error("PDF processing timeout")), 20000); 
              });
              
              const processingPromise = new Promise<string>(async (resolveProcessing) => {
                try {
                  const loadingTask = pdfjsLib.getDocument(typedArray);
                  const pdfDocument = await loadingTask.promise;
                  
                  let fullText = '';
                  // Process more pages to get more content (up to 20 pages)
                  const maxPages = Math.min(pdfDocument.numPages, 20);
                  
                  // Process all pages to extract more data
                  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
                    try {
                      const page = await pdfDocument.getPage(pageNum);
                      const textContent = await page.getTextContent();
                      
                      // Get all text from the page, not just limited items
                      const pageText = textContent.items
                        .map(item => 'str' in item ? (item as any).str : '')
                        .join(' ');
                        
                      fullText += pageText + '\n';
                      
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
          // For images, just log for now (we would need OCR for actual text extraction)
        } else if (fileType.includes('document') || fileName.endsWith('.docx')) {
          console.log('Processando documento do Word...');
          // For Word docs, just log for now
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
    // Extract common patterns with more comprehensive regex
    
    // Dates
    const datePattern = /(\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}\s+de\s+[a-zÀ-ÿ]+\s+de\s+\d{4})/gi;
    const dateMatches = text.match(datePattern);
    if (dateMatches && dateMatches.length > 0) {
      if (!extractedData['data']) extractedData['data'] = dateMatches[0];
      if (dateMatches.length > 1 && !extractedData['dataFalecimento']) {
        // Look for death date specifically
        const deathContext = text.match(/falec[ido|eu|imento][\s\S]{0,50}(\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}\s+de\s+[a-zÀ-ÿ]+\s+de\s+\d{4})/i);
        if (deathContext && deathContext[1]) {
          extractedData['dataFalecimento'] = deathContext[1];
        } else {
          extractedData['dataFalecimento'] = dateMatches[1];
        }
      }
      if (dateMatches.length > 2 && !extractedData['dataCasamento']) {
        // Look for marriage date specifically
        const marriageContext = text.match(/casad[ao][\s\S]{0,50}(\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}\s+de\s+[a-zÀ-ÿ]+\s+de\s+\d{4})/i);
        if (marriageContext && marriageContext[1]) {
          extractedData['dataCasamento'] = marriageContext[1];
        } else {
          extractedData['dataCasamento'] = dateMatches[2];
        }
      }
    }
    
    // Names
    const namePattern = /(?:[A-Z][a-zÀ-ÿ]{1,20}\s){1,3}(?:[A-Z][a-zÀ-ÿ]{1,20})/g;
    const nameMatches = text.match(namePattern);
    if (nameMatches && nameMatches.length > 0) {
      // Try to identify names by role context
      
      // Falecido - look for context
      const deceasedContext = text.match(/(?:fale[c|ç][ido|eu|imento]|de cujus|autor[a]? da herança|espólio de)[\s\S]{0,100}([A-Z][a-zÀ-ÿ]+\s(?:[A-Z][a-zÀ-ÿ]+\s){0,3}[A-Z][a-zÀ-ÿ]+)/i);
      if (deceasedContext && deceasedContext[1]) {
        extractedData['falecido'] = deceasedContext[1].trim();
      }
      
      // Cônjuge - look for context
      const spouseContext = text.match(/(?:cônjuge|viúv[o|a]|esposa|esposo|viúv[o|a]-meeiro[a]|casad[o|a] com)[\s\S]{0,100}([A-Z][a-zÀ-ÿ]+\s(?:[A-Z][a-zÀ-ÿ]+\s){0,3}[A-Z][a-zÀ-ÿ]+)/i);
      if (spouseContext && spouseContext[1]) {
        extractedData['conjuge'] = spouseContext[1].trim();
      }
      
      // Inventariante - look for context
      const inventoryManagerContext = text.match(/(?:inventariante|responsável pelo espólio)[\s\S]{0,100}([A-Z][a-zÀ-ÿ]+\s(?:[A-Z][a-zÀ-ÿ]+\s){0,3}[A-Z][a-zÀ-ÿ]+)/i);
      if (inventoryManagerContext && inventoryManagerContext[1]) {
        extractedData['inventariante'] = inventoryManagerContext[1].trim();
      }
      
      // Herdeiro - look for context
      const heirContext = text.match(/(?:herdeiro|herdeira|sucessor|filho|filha)[\s\S]{0,100}([A-Z][a-zÀ-ÿ]+\s(?:[A-Z][a-zÀ-ÿ]+\s){0,3}[A-Z][a-zÀ-ÿ]+)/i);
      if (heirContext && heirContext[1]) {
        extractedData['herdeiro1'] = heirContext[1].trim();
      }
      
      // Multiple heirs - scan for more
      if (nameMatches.length > 3) {
        // Find names not already assigned
        const assignedNames = [
          extractedData['falecido'], 
          extractedData['conjuge'], 
          extractedData['inventariante'],
          extractedData['herdeiro1']
        ].filter(Boolean);
        
        let heirIndex = 1;
        for (const name of nameMatches) {
          // Skip already assigned names
          if (assignedNames.includes(name)) continue;
          
          // Find next available herdeiro slot
          while (extractedData[`herdeiro${heirIndex}`] && heirIndex < 5) {
            heirIndex++;
          }
          
          if (heirIndex < 5) {
            extractedData[`herdeiro${heirIndex}`] = name;
            heirIndex++;
          }
        }
      }
      
      // Advogado - look for context
      const lawyerContext = text.match(/(?:advogad[o|a]|OAB)[\s\S]{0,100}([A-Z][a-zÀ-ÿ]+\s(?:[A-Z][a-zÀ-ÿ]+\s){0,3}[A-Z][a-zÀ-ÿ]+)/i);
      if (lawyerContext && lawyerContext[1]) {
        extractedData['advogado'] = lawyerContext[1].trim();
      }
    }
    
    // Document numbers and registrations
    
    // CPF/CNPJ/RG
    const documentPattern = /(?:CPF|CNPJ|RG)[\s.:]*(\d[\d\.\-\/]+)/gi;
    const docMatches = text.matchAll(documentPattern);
    for (const match of docMatches) {
      if (match[0].includes('CPF') && !extractedData['cpf']) {
        extractedData['cpf'] = match[1];
      } else if (match[0].includes('CNPJ') && !extractedData['cnpj']) {
        extractedData['cnpj'] = match[1];
      } else if (match[0].includes('RG') && !extractedData['rg']) {
        extractedData['rg'] = match[1];
      }
    }
    
    // Addresses
    const addressPattern = /(?:residente|domiciliado|endereço)[^\n,;]+((?:[A-Z][a-zÀ-ÿ]+[\s,]*)+(?:\d+)?[^\n;]*)/gi;
    const addressMatch = text.match(addressPattern);
    if (addressMatch && addressMatch[0]) {
      extractedData['endereco'] = addressMatch[0].replace(/(?:residente|domiciliado|endereço)[^\n,;]+/i, '').trim();
    }
    
    // Property details (especialmente importante para inventários)
    
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
    
    // Quadra/location
    const locationPattern = /(?:quadra|sqn|sqs|qn|qs|qi|qd)[\s\.]*(\d+)/i;
    const locationMatch = text.match(locationPattern);
    if (locationMatch && locationMatch[1]) {
      extractedData['quadraApartamento'] = `Quadra ${locationMatch[1]}`;
    }
    
    // Registration
    const registrationPattern = /matrícula[\s\.]*(?:n[º°]?\.?)?[\s\.]*(\d[\d\.\-\/]+)/i;
    const registrationMatch = text.match(registrationPattern);
    if (registrationMatch && registrationMatch[1]) {
      extractedData['matriculaImovel'] = registrationMatch[1];
    }
    
    // ITCMD
    const itcmdPattern = /ITCMD[\s\.]*(?:n[º°]?\.?)?[\s\.]*(\d[\d\.\-\/]+)/i;
    const itcmdMatch = text.match(itcmdPattern);
    if (itcmdMatch && itcmdMatch[1]) {
      extractedData['numeroITCMD'] = itcmdMatch[1];
    }
    
    // Valores monetários
    const moneyPattern = /R\$\s*([\d\.,]+)/g;
    const moneyMatches = text.matchAll(moneyPattern);
    let valueCounter = 0;
    for (const match of moneyMatches) {
      if (valueCounter === 0 && !extractedData['valorTotalBens']) {
        extractedData['valorTotalBens'] = `R$ ${match[1]}`;
        
        // Calculate meação if possible
        try {
          const cleanValue = match[1].replace(/\./g, '').replace(',', '.');
          const numValue = parseFloat(cleanValue);
          
          if (!isNaN(numValue)) {
            const meacao = numValue / 2;
            extractedData['valorTotalMeacao'] = `R$ ${meacao.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            
            // Estimate value per heir based on number of children
            let numHerdeiros = 1;
            
            // Count how many heirs we've found
            for (let i = 1; i <= 5; i++) {
              if (extractedData[`herdeiro${i}`]) numHerdeiros = i;
            }
            
            extractedData['numeroFilhos'] = String(numHerdeiros);
            
            const valorPorHerdeiro = meacao / numHerdeiros;
            extractedData['valorUnitarioHerdeiros'] = `R$ ${valorPorHerdeiro.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            extractedData['percentualHerdeiros'] = `${(50 / numHerdeiros).toFixed(2)}%`;
          }
        } catch (error) {
          console.warn("Error calculating values:", error);
        }
      } else if (valueCounter === 1 && !extractedData['valorITCMD']) {
        extractedData['valorITCMD'] = `R$ ${match[1]}`;
      }
      valueCounter++;
    }
    
    // Collection of heirs for nomesFilhos
    if (!extractedData['nomesFilhos']) {
      let filhos = extractedData['herdeiro1'] || "Não identificado";
      if (extractedData['herdeiro2']) filhos += ", " + extractedData['herdeiro2'];
      if (extractedData['herdeiro3']) filhos += ", " + extractedData['herdeiro3'];
      if (extractedData['herdeiro4']) filhos += ", " + extractedData['herdeiro4'];
      if (extractedData['herdeiro5']) filhos += ", " + extractedData['herdeiro5'];
      extractedData['nomesFilhos'] = filhos;
    }
    
    // Regime de bens
    const regimePattern = /regime\s+de\s+(?:bens)?\s*(?:d[eo])?\s*([a-zÀ-ÿ\s]+)(?:de bens)?/i;
    const regimeMatch = text.match(regimePattern);
    if (regimeMatch && regimeMatch[1]) {
      extractedData['regimeBens'] = regimeMatch[1].trim();
    }
    
    // Hospital
    const hospitalPattern = /(?:Hospital|Instituição)[\s:]+((?:[A-Z][a-zÀ-ÿ]+[\s]*)+)/i;
    const hospitalMatch = text.match(hospitalPattern);
    if (hospitalMatch && hospitalMatch[1]) {
      extractedData['hospitalFalecimento'] = hospitalMatch[1].trim();
    }
    
    // Cidade
    const cidadePattern = /(?:cidade|município)[\s:]+((?:[A-Z][a-zÀ-ÿ]+[\s]*)+)/i;
    const cidadeMatch = text.match(cidadePattern);
    if (cidadeMatch && cidadeMatch[1]) {
      extractedData['cidadeFalecimento'] = cidadeMatch[1].trim();
    }
    
    // Cartórios
    const cartorioPattern = /(?:Cartório|Serventia|Ofício)[\s:]+((?:[^,;.\n]+))/i;
    const cartorioMatch = text.match(cartorioPattern);
    if (cartorioMatch && cartorioMatch[1]) {
      extractedData['cartorioImovel'] = cartorioMatch[1].trim();
    }
    
    // CNIB hash
    const hashPattern = /hash[\s:]*(?:n[º°]?\.?)?[\s:]*([A-Za-z0-9]+)/i;
    const hashMatch = text.match(hashPattern);
    if (hashMatch && hashMatch[1]) {
      extractedData['hashCNIB'] = hashMatch[1];
    }
    
  } catch (error) {
    console.warn("Error in comprehensive data extraction:", error);
  }
}

// Updated document content generation with improved data insertion
export function generateDocumentContent(documentType: DraftType, extractedData: { [key: string]: any }): string {
  switch (documentType) {
    case 'Inventário':
      return `
        <h1>ESCRITURA PÚBLICA DE INVENTÁRIO E PARTILHA</h1>
        
        <p><strong>= S A I B A M =</strong> quantos esta virem que, ${extractedData['data'] || '====='}, nesta cidade de Brasília, Distrito
Federal, Capital da República Federativa do Brasil, nesta Serventia, perante
mim, Escrevente, compareceram como Outorgantes e reciprocamente
Outorgados, na qualidade de viúvo(a)-meeiro(a):</p>
<p>${extractedData['conjuge'] || extractedData['viuvoMeeiro'] || '====='}</p>

<p>e, na qualidade de herdeiros-filhos:</p>
<p>${extractedData['herdeiro1'] || '====='}</p>
${extractedData['herdeiro2'] ? `<p>${extractedData['herdeiro2']}</p>` : ''}
${extractedData['herdeiro3'] ? `<p>${extractedData['herdeiro3']}</p>` : ''}
${extractedData['herdeiro4'] ? `<p>${extractedData['herdeiro4']}</p>` : ''}
${extractedData['herdeiro5'] ? `<p>${extractedData['herdeiro5']}</p>` : ''}

<p>e, na qualidade de advogado:</p>
<p>${extractedData['advogado'] || '====='}</p>

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
