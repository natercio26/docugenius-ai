
import { DraftType } from '@/types';

// Function to read file contents
export const readFileContents = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target && typeof event.target.result === 'string') {
        resolve(event.target.result);
      } else {
        reject(new Error('Failed to read file content'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    if (file.type === 'application/pdf') {
      // For PDF files, read as array buffer (for future PDF.js processing)
      reader.readAsArrayBuffer(file);
    } else {
      // For text files, read as text
      reader.readAsText(file);
    }
  });
};

// Extract data from files based on their content
export const extractDataFromFiles = async (files: File[]): Promise<Record<string, string>> => {
  const extractedData: Record<string, string> = {};
  
  try {
    // Process each uploaded file
    for (const file of files) {
      let content = "";
      
      try {
        if (file.type === 'application/pdf' || 
            file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          // For PDFs and DOCXs, we'll use the file name for now
          // In a production app, you'd use a PDF/DOCX parsing library
          content = file.name;
        } else if (file.type.startsWith('image/')) {
          // For images, we use the file name (in production, you'd use OCR)
          content = file.name;
        } else {
          // For text files, read the content
          content = await readFileContents(file);
        }
        
        // Extract information based on content and filename
        extractDataFromFileContent(file.name, content, extractedData);
        
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }
    
    return extractedData;
  } catch (error) {
    console.error('Error extracting data from files:', error);
    return {};
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
  
  // Extract data based on filename and content patterns
  
  // RG/Identity document patterns
  if (lowerFileName.includes('identidade') || 
      lowerFileName.includes('rg') || 
      lowerContent.includes('documento de identidade') || 
      lowerContent.includes('registro geral')) {
    
    // Try to extract name pattern (usually "Nome: [name]" or similar)
    const nameMatch = content.match(/Nome:?\s+([A-Za-zÀ-ÖØ-öø-ÿ\s]+)/i);
    if (nameMatch && nameMatch[1]) {
      extractedData.nome = nameMatch[1].trim();
    }
    
    // Try to extract RG number
    const rgMatch = content.match(/RG:?\s*([\d.-]+\s*[A-Za-z/]*)/i) || 
                    content.match(/([\d]{1,2}\.[\d]{3}\.[\d]{3}-[0-9A-Za-z])/i);
    if (rgMatch && rgMatch[1]) {
      extractedData.rg = rgMatch[1].trim();
    }
    
    // Try to extract CPF number
    const cpfMatch = content.match(/CPF:?\s*([\d.-]+)/i) || 
                     content.match(/([\d]{3}\.[\d]{3}\.[\d]{3}-[\d]{2})/i);
    if (cpfMatch && cpfMatch[1]) {
      extractedData.cpf = cpfMatch[1].trim();
    }
  }
  
  // Property/Real estate document patterns
  if (lowerFileName.includes('imovel') || 
      lowerFileName.includes('matricula') || 
      lowerFileName.includes('escritura') || 
      lowerContent.includes('imóvel') ||
      lowerContent.includes('matrícula')) {
    
    // Try to extract property address
    const addressMatch = content.match(/endereço:?\s+([^,.]+(,|\.)[^,.]+)/i) ||
                         content.match(/situado\s+(?:na|no|em)\s+([^,.]+(,|\.)[^,.]+)/i);
    if (addressMatch && addressMatch[1]) {
      extractedData.enderecoImovel = addressMatch[1].trim();
    }
    
    // Try to extract property value
    const valueMatch = content.match(/valor:?\s+(R\$\s*[\d.,]+)/i) ||
                       content.match(/(R\$\s*[\d.,]+\s*(?:\(.*?\))?)/i);
    if (valueMatch && valueMatch[1]) {
      extractedData.valorImovel = valueMatch[1].trim();
    }
    
    // Try to extract property registration number
    const regMatch = content.match(/matrícula\s+(?:n[º°]|número)?\s*([\d.]+)/i);
    if (regMatch && regMatch[1]) {
      extractedData.registroImovel = `matrícula nº ${regMatch[1].trim()}`;
    }
    
    // Try to extract property area
    const areaMatch = content.match(/área\s+(?:de)?\s*([\d,.]+\s*m²)/i);
    if (areaMatch && areaMatch[1]) {
      extractedData.areaImovel = areaMatch[1].trim();
    }
  }
  
  // Purchase/Sale document patterns
  if (lowerFileName.includes('compra') || 
      lowerFileName.includes('venda') || 
      lowerContent.includes('compra e venda')) {
    
    // Try to extract seller name
    const sellerMatch = content.match(/vendedor:?\s+([A-Za-zÀ-ÖØ-öø-ÿ\s]+)/i) ||
                        content.match(/outorgante:?\s+([A-Za-zÀ-ÖØ-öø-ÿ\s]+)/i);
    if (sellerMatch && sellerMatch[1]) {
      extractedData.vendedor = sellerMatch[1].trim();
    }
    
    // Try to extract buyer name
    const buyerMatch = content.match(/comprador:?\s+([A-Za-zÀ-ÖØ-öø-ÿ\s]+)/i) ||
                       content.match(/outorgado:?\s+([A-Za-zÀ-ÖØ-öø-ÿ\s]+)/i);
    if (buyerMatch && buyerMatch[1]) {
      extractedData.nome = buyerMatch[1].trim();
    }
  }
};

// Generate document content based on template type and extracted data
export const generateDocumentContent = (
  type: DraftType, 
  data: Record<string, string>
): string => {
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
  
  switch(type) {
    case 'Escritura de Compra e Venda':
      content = `ESCRITURA PÚBLICA DE COMPRA E VENDA

SAIBAM todos quantos esta Escritura Pública de Compra e Venda virem que, aos ${formattedDate}, nesta cidade e comarca de São Paulo, Estado de São Paulo, perante mim, Tabelião, compareceram as partes entre si justas e contratadas, a saber:

OUTORGANTE VENDEDOR: ${data.vendedor || 'JOÃO DA SILVA'}, brasileiro, casado, empresário, portador da Cédula de Identidade RG nº 12.345.678-9 SSP/SP, inscrito no CPF/MF sob nº 123.456.789-00, residente e domiciliado na Rua das Flores, nº 123, Bairro Jardim, CEP 01234-567, nesta Capital;

OUTORGADO COMPRADOR: ${data.nome || 'MARIA OLIVEIRA'}, brasileira, solteira, advogada, portadora da Cédula de Identidade RG nº ${data.rg || '98.765.432-1 SSP/SP'}, inscrita no CPF/MF sob nº ${data.cpf || '987.654.321-00'}, residente e domiciliada na Avenida Central, nº 456, Bairro Centro, CEP 12345-678, nesta Capital;

Os presentes, juridicamente capazes, identificados por mim, Tabelião, conforme documentos apresentados, do que dou fé.

E, pelo OUTORGANTE VENDEDOR, me foi dito que é legítimo proprietário do seguinte imóvel:

IMÓVEL: Apartamento nº 101, localizado no 10º andar do Edifício Residencial Primavera, situado na ${data.enderecoImovel || 'Rua dos Ipês, nº 789, Bairro Jardim Paulista'}, nesta Capital, com área privativa de ${data.areaImovel || '120,00m² (cento e vinte metros quadrados)'}, área comum de 40,00m² (quarenta metros quadrados), perfazendo a área total de 160,00m² (cento e sessenta metros quadrados), correspondendo-lhe uma fração ideal no terreno de 2,5% (dois vírgula cinco por cento), registrado sob a ${data.registroImovel || 'matrícula nº 12.345 no 5º Oficial de Registro de Imóveis desta Capital'}.

TÍTULO AQUISITIVO: O referido imóvel foi adquirido pelo OUTORGANTE VENDEDOR através de Escritura Pública de Compra e Venda lavrada no 10º Tabelionato de Notas desta Capital, no Livro 500, fls. 150, em 10/05/2010, devidamente registrada na matrícula do imóvel.

E pela presente escritura e nos melhores termos de direito, o OUTORGANTE VENDEDOR vende, como de fato vendido tem, ao OUTORGADO COMPRADOR, o imóvel acima descrito e caracterizado, pelo preço certo e ajustado de ${data.valorImovel || 'R$ 800.000,00 (oitocentos mil reais)'}, que confessa e declara haver recebido, em moeda corrente nacional, dando ao OUTORGADO COMPRADOR, plena, geral e irrevogável quitação, para nada mais reclamar em tempo algum.`;
      break;
      
    case 'Inventário':
      content = `TERMO DE INVENTÁRIO E PARTILHA

Aos ${formattedDate}, na cidade de São Paulo, Estado de São Paulo, procede-se ao INVENTÁRIO E PARTILHA dos bens deixados por falecimento de ${data.falecido || 'JOSÉ SANTOS'}, falecido em ${data.dataFalecimento || '10/01/2023'}, conforme certidão de óbito apresentada.

INVENTARIANTE: ${data.inventariante || data.nome || 'MARIA OLIVEIRA'}, brasileira, ${data.estadoCivil || 'solteira'}, ${data.profissao || 'advogada'}, portadora da Cédula de Identidade RG nº ${data.rg || '98.765.432-1 SSP/SP'}, inscrita no CPF/MF sob nº ${data.cpf || '987.654.321-00'}, residente e domiciliada na ${data.endereco || 'Avenida Central, nº 456, Bairro Centro, CEP 12345-678, nesta Capital'}.

HERDEIROS:
1. ${data.herdeiro1 || 'PEDRO SANTOS'}, filho do falecido, brasileiro, solteiro, estudante, CPF nº 111.222.333-44;
2. ${data.herdeiro2 || 'ANA SANTOS'}, filha do falecido, brasileira, casada, médica, CPF nº 555.666.777-88.

BENS A SEREM PARTILHADOS:
1. IMÓVEL: ${data.descricaoImovel || data.enderecoImovel || 'Apartamento situado na Rua dos Ipês, nº 789, Bairro Jardim Paulista'}, avaliado em ${data.valorImovel || 'R$ 800.000,00 (oitocentos mil reais)'}.
2. VEÍCULO: ${data.veiculo || 'Automóvel marca Toyota, modelo Corolla, ano 2020, placa ABC-1234'}, avaliado em R$ 90.000,00 (noventa mil reais).
3. CONTAS BANCÁRIAS: Saldo em conta corrente no valor de R$ 30.000,00 (trinta mil reais).

TOTAL DO ESPÓLIO: R$ 920.000,00 (novecentos e vinte mil reais).`;
      break;
      
    case 'Doação':
      content = `ESCRITURA PÚBLICA DE DOAÇÃO DE BEM IMÓVEL

SAIBAM todos quantos esta Escritura Pública de Doação virem que, aos ${formattedDate}, nesta cidade e comarca de São Paulo, Estado de São Paulo, perante mim, Tabelião, compareceram as partes:

DOADOR: ${data.doador || data.vendedor || 'JOÃO DA SILVA'}, brasileiro, casado, empresário, portador da Cédula de Identidade RG nº 12.345.678-9 SSP/SP, inscrito no CPF/MF sob nº 123.456.789-00, residente e domiciliado na Rua das Flores, nº 123, Bairro Jardim, CEP 01234-567, nesta Capital;

DONATÁRIO: ${data.donatario || data.nome || 'MARIA OLIVEIRA'}, brasileira, solteira, advogada, portadora da Cédula de Identidade RG nº ${data.rg || '98.765.432-1 SSP/SP'}, inscrita no CPF/MF sob nº ${data.cpf || '987.654.321-00'}, residente e domiciliada na Avenida Central, nº 456, Bairro Centro, CEP 12345-678, nesta Capital;

BEM DOADO: ${data.descricaoImovel || data.enderecoImovel || 'Apartamento nº 101, localizado no 10º andar do Edifício Residencial Primavera, situado na Rua dos Ipês, nº 789, Bairro Jardim Paulista'}, avaliado em ${data.valorImovel || 'R$ 800.000,00 (oitocentos mil reais)'}.`;
      break;
    
    default:
      content = `DOCUMENTO JURÍDICO - ${type}

Documento gerado automaticamente com base nos dados fornecidos.

Nome: ${data.nome || 'Nome não fornecido'}
Endereço do imóvel: ${data.enderecoImovel || 'Endereço não fornecido'}
Valor: ${data.valorImovel || 'Valor não fornecido'}

Este é um documento modelo. Em uma aplicação real, o conteúdo completo seria gerado com base nos dados extraídos dos documentos enviados e no tipo de minuta selecionado.`;
  }
  
  return content;
};
