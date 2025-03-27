
import { DraftType } from '@/types';

// Simulate extraction of data from uploaded files
export const extractDataFromFiles = (files: File[]): Record<string, string> => {
  // In a real application, this would analyze the files using AI
  // and extract relevant information. Here we're just simulating.
  
  const extractedData: Record<string, string> = {};
  
  // Simulate data extraction based on file types and names
  files.forEach(file => {
    if (file.name.toLowerCase().includes('identidade') || file.name.toLowerCase().includes('rg')) {
      extractedData.nome = 'Maria Oliveira';
      extractedData.rg = '98.765.432-1 SSP/SP';
      extractedData.cpf = '987.654.321-00';
    } 
    else if (file.name.toLowerCase().includes('compra') || file.name.toLowerCase().includes('venda')) {
      extractedData.valorImovel = 'R$ 800.000,00 (oitocentos mil reais)';
      extractedData.enderecoImovel = 'Rua dos Ipês, nº 789, Apartamento 101, Bairro Jardim Paulista';
      extractedData.vendedor = 'João da Silva';
    }
    else if (file.name.toLowerCase().includes('matricula') || file.name.toLowerCase().includes('imovel')) {
      extractedData.areaImovel = '120,00m² (cento e vinte metros quadrados)';
      extractedData.registroImovel = 'matrícula nº 12.345 no 5º Oficial de Registro de Imóveis';
    }
  });
  
  // Add default values if nothing was extracted
  if (Object.keys(extractedData).length === 0) {
    extractedData.nome = 'Maria Oliveira';
    extractedData.enderecoImovel = 'Rua dos Ipês, nº 789, Apartamento 101, Bairro Jardim Paulista';
  }
  
  return extractedData;
};

// Generate document content based on template type and extracted data
export const generateDocumentContent = (
  type: DraftType, 
  data: Record<string, string>
): string => {
  let content = '';
  
  switch(type) {
    case 'Escritura de Compra e Venda':
      content = `ESCRITURA PÚBLICA DE COMPRA E VENDA

SAIBAM todos quantos esta Escritura Pública de Compra e Venda virem que, aos ${new Date().getDate()} (${new Date().toLocaleString('pt-BR', {day: 'long'})}) dias do mês de ${new Date().toLocaleString('pt-BR', {month: 'long'})} do ano de ${new Date().getFullYear()} (${new Date().getFullYear()} por extenso), nesta cidade e comarca de São Paulo, Estado de São Paulo, perante mim, Tabelião, compareceram as partes entre si justas e contratadas, a saber:

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

Aos ${new Date().getDate()} dias do mês de ${new Date().toLocaleString('pt-BR', {month: 'long'})} de ${new Date().getFullYear()}, na cidade de São Paulo, Estado de São Paulo, procede-se ao INVENTÁRIO E PARTILHA dos bens deixados por falecimento de ${data.falecido || 'JOSÉ SANTOS'}, falecido em ${data.dataFalecimento || '10/01/2023'}, conforme certidão de óbito apresentada.

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

SAIBAM todos quantos esta Escritura Pública de Doação virem que, aos ${new Date().getDate()} dias do mês de ${new Date().toLocaleString('pt-BR', {month: 'long'})} do ano de ${new Date().getFullYear()}, nesta cidade e comarca de São Paulo, Estado de São Paulo, perante mim, Tabelião, compareceram as partes:

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
