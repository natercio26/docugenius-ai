import { DraftType } from '@/types';
import { identifyPartiesAndRoles } from './partyIdentifier';

// Export the identifyPartiesAndRoles function to be used elsewhere
export { identifyPartiesAndRoles };

// Function to extract text from PDF files with time limits and chunking
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
                setTimeout(() => reject(new Error("PDF processing timeout")), 15000); // Reduced timeout
              });
              
              const processingPromise = new Promise<string>(async (resolveProcessing) => {
                try {
                  const loadingTask = pdfjsLib.getDocument(typedArray);
                  const pdfDocument = await loadingTask.promise;
                  
                  let fullText = '';
                  // Limit to 10 pages maximum and only process evenly-numbered pages for faster extraction
                  const maxPages = Math.min(pdfDocument.numPages, 10);
                  
                  // Process pages in batches of 2 with pauses between batches
                  for (let pageNum = 1; pageNum <= maxPages; pageNum += 2) {
                    try {
                      const page = await pdfDocument.getPage(pageNum);
                      // Remove properties to fix TypeScript error
                      const textContent = await page.getTextContent();
                      
                      // Extract only first 1000 characters per page for faster processing
                      const pageText = textContent.items
                        .slice(0, 50) // Limit items processed
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
      
      // Set a timeout for the overall file reading process
      const timeoutId = setTimeout(() => {
        console.warn("PDF file reading timed out");
        resolve("");
      }, 5000); // Reduced timeout
      
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

// Enhance the extractDataFromFiles function for better performance
export async function extractDataFromFiles(files: File[]): Promise<{ [key: string]: any }> {
  const extractedData: { [key: string]: any } = {};
  
  try {
    console.log('Iniciando extração de dados de', files.length, 'arquivo(s)');
    
    if (!files || files.length === 0) {
      console.warn('Nenhum arquivo para processar');
      return extractedData;
    }
    
    // Set a strict timeout for the entire extraction process
    const startTime = Date.now();
    const maxProcessingTime = 20000; // Reduced to 20 seconds maximum
    
    // Process only a single file at a time, with a maximum of 3 files total
    const filesToProcess = files.slice(0, 3);
    
    // Process each file with time tracking
    for (const file of filesToProcess) {
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
      
      // Extract text content from the file based on its type - but limit to PDF for now (most common)
      let textContent = '';
      
      try {
        const fileType = file.type.toLowerCase();
        const fileName = file.name.toLowerCase();
        
        // PDF processing - prioritize this format
        if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
          textContent = await extractTextFromPDF(file);
        } 
        // Skip other formats for now to improve performance
        else {
          console.warn(`Tipo de arquivo ignorado para melhor desempenho: ${fileType}`);
        }
        
        if (textContent) {
          console.log('Texto extraído com sucesso do arquivo:', file.name);
          
          // Extract basic data points using simple regex patterns
          extractBasicDataPoints(textContent, extractedData);
          
          // Ensure we don't spend too much time on a single file
          if (Date.now() - startTime > maxProcessingTime * 0.7) {
            console.warn('Tempo de processamento quase esgotado, parando análise');
            break;
          }
        } else {
          console.warn(`Nenhum texto extraído do arquivo: ${file.name}`);
        }
      } catch (fileProcessError) {
        console.error(`Erro ao processar arquivo ${file.name}:`, fileProcessError);
        // Continue with other files
      }
      
      // Small pause between file processing
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    return extractedData;
  } catch (error) {
    console.error('Erro na extração de dados:', error);
    return { error: 'Erro ao extrair dados dos arquivos' };
  }
}

// Simplified function for extracting data points - using fewer regex patterns
function extractBasicDataPoints(text: string, extractedData: { [key: string]: any }): void {
  // Extract names with roles if possible - using a limited set of patterns
  const rolePatterns = [
    { role: 'vendedor', pattern: /vendedor[:\s]+([A-Z][a-zÀ-ÿ]+\s(?:[A-Z][a-zÀ-ÿ]+\s)*[A-Z][a-zÀ-ÿ]+)/i },
    { role: 'comprador', pattern: /comprador[:\s]+([A-Z][a-zÀ-ÿ]+\s(?:[A-Z][a-zÀ-ÿ]+\s)*[A-Z][a-zÀ-ÿ]+)/i },
    { role: 'falecido', pattern: /falecido[:\s]+([A-Z][a-zÀ-ÿ]+\s(?:[A-Z][a-zÀ-ÿ]+\s)*[A-Z][a-zÀ-ÿ]+)/i },
    { role: 'herdeiro', pattern: /herdeiro[:\s]+([A-Z][a-zÀ-ÿ]+\s(?:[A-Z][a-zÀ-ÿ]+\s)*[A-Z][a-zÀ-ÿ]+)/i },
    { role: 'inventariante', pattern: /inventariante[:\s]+([A-Z][a-zÀ-ÿ]+\s(?:[A-Z][a-zÀ-ÿ]+\s)*[A-Z][a-zÀ-ÿ]+)/i }
  ];

  // Safety check for text input
  if (!text || typeof text !== 'string') {
    console.warn('Texto inválido recebido para extração de dados');
    return;
  }

  // Use a timeout to prevent long-running regex operations
  const regexTimeout = setTimeout(() => {
    console.warn('Tempo limite para análise de regex excedido');
  }, 1000);

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

  clearTimeout(regexTimeout);

  // Ensure we have at least some basic data
  if (Object.keys(extractedData).length === 0) {
    try {
      // Extract any name-like patterns as a fallback - limit to first 2 matches
      const namePatterns = text.match(/[A-Z][a-zÀ-ÿ]+\s(?:[A-Z][a-zÀ-ÿ]+\s)+[A-Z][a-zÀ-ÿ]+/g);
      if (namePatterns && namePatterns.length > 0) {
        extractedData['nome'] = namePatterns[0].trim();
      }
    } catch (nameError) {
      console.warn('Erro ao extrair padrões de nome:', nameError);
    }
  }
}

// Updated document content generation with proper HTML formatting for all document types
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
Cartório do ${extractedData['cartorioCasamento'] || '===='};</p>

<p>1.2. Faleceu aos ${extractedData['dataFalecimento'] || '===='}, no Hospital ${extractedData['hospitalFalecimento'] || '===='}, na cidade de ${extractedData['cidadeFalecimento'] || '===='}, conforme certidão de
óbito expedida aos ${extractedData['dataExpedicaoCertidaoObito'] || '===='}, registrada sob a matrícula nº ${extractedData['matriculaObito'] || '===='}, pelo Cartório do ${extractedData['cartorioObito'] || '==='};</p>

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
