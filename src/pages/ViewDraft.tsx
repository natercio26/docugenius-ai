
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import DraftViewer from '@/components/DraftViewer';
import { Draft, DraftType } from '@/types';
import { Download, Edit, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const sampleContent = `ESCRITURA PÚBLICA DE COMPRA E VENDA

SAIBAM todos quantos esta Escritura Pública de Compra e Venda virem que, aos 15 (quinze) dias do mês de setembro do ano de 2023 (dois mil e vinte e três), nesta cidade e comarca de São Paulo, Estado de São Paulo, perante mim, Tabelião, compareceram as partes entre si justas e contratadas, a saber:

OUTORGANTE VENDEDOR: JOÃO DA SILVA, brasileiro, casado, empresário, portador da Cédula de Identidade RG nº 12.345.678-9 SSP/SP, inscrito no CPF/MF sob nº 123.456.789-00, residente e domiciliado na Rua das Flores, nº 123, Bairro Jardim, CEP 01234-567, nesta Capital;

OUTORGADO COMPRADOR: MARIA OLIVEIRA, brasileira, solteira, advogada, portadora da Cédula de Identidade RG nº 98.765.432-1 SSP/SP, inscrita no CPF/MF sob nº 987.654.321-00, residente e domiciliada na Avenida Central, nº 456, Bairro Centro, CEP 12345-678, nesta Capital;

Os presentes, juridicamente capazes, identificados por mim, Tabelião, conforme documentos apresentados, do que dou fé.

E, pelo OUTORGANTE VENDEDOR, me foi dito que é legítimo proprietário do seguinte imóvel:

IMÓVEL: Apartamento nº 101, localizado no 10º andar do Edifício Residencial Primavera, situado na Rua dos Ipês, nº 789, Bairro Jardim Paulista, nesta Capital, com área privativa de 120,00m² (cento e vinte metros quadrados), área comum de 40,00m² (quarenta metros quadrados), perfazendo a área total de 160,00m² (cento e sessenta metros quadrados), correspondendo-lhe uma fração ideal no terreno de 2,5% (dois vírgula cinco por cento), registrado sob a matrícula nº 12.345 no 5º Oficial de Registro de Imóveis desta Capital.

TÍTULO AQUISITIVO: O referido imóvel foi adquirido pelo OUTORGANTE VENDEDOR através de Escritura Pública de Compra e Venda lavrada no 10º Tabelionato de Notas desta Capital, no Livro 500, fls. 150, em 10/05/2010, devidamente registrada na matrícula do imóvel.

E pela presente escritura e nos melhores termos de direito, o OUTORGANTE VENDEDOR vende, como de fato vendido tem, ao OUTORGADO COMPRADOR, o imóvel acima descrito e caracterizado, pelo preço certo e ajustado de R$ 800.000,00 (oitocentos mil reais), que confessa e declara haver recebido, em moeda corrente nacional, dando ao OUTORGADO COMPRADOR, plena, geral e irrevogável quitação, para nada mais reclamar em tempo algum.

O OUTORGANTE VENDEDOR declara, sob responsabilidade civil e criminal, que:

a) Não existem débitos fiscais, condominiais ou de qualquer outra natureza que recaiam sobre o imóvel;
b) Não existem ações reais ou pessoais reipersecutórias relativas ao imóvel;
c) O imóvel encontra-se livre e desembaraçado de quaisquer ônus, dívidas, hipotecas legais, judiciais ou convencionais, bem como livre de penhoras, arrestos, sequestros ou qualquer outro gravame.

O OUTORGADO COMPRADOR declara conhecer o imóvel em todas as suas características, dimensões e confrontações, aceitando-o no estado em que se encontra.

As partes convencionam que, a partir desta data, são transferidos ao OUTORGADO COMPRADOR todos os direitos, domínio, posse, ação e responsabilidades sobre o imóvel, respondendo o OUTORGANTE VENDEDOR pela evicção de direito.

As partes responsabilizam-se por todas as declarações feitas neste instrumento, ficando cientes de que, se comprovada a falsidade de qualquer delas, será considerado crime de falsidade ideológica, nos termos do art. 299 do Código Penal.

Foram-me apresentadas e ficam arquivadas neste Tabelionato as certidões exigidas por lei, a saber: Certidão Negativa de Débitos Relativos aos Tributos Federais e à Dívida Ativa da União; Certidão Negativa de Débitos Tributários Estaduais; Certidão Negativa de Débitos Tributários Municipais; Certidão Negativa de Débitos Condominiais; e Certidão Negativa de Ônus Reais, Ações Reais e Pessoais Reipersecutórias extraída da matrícula do imóvel.

Declaram as partes, sob responsabilidade civil e criminal, que o preço atribuído ao imóvel nesta escritura é real e efetivamente pago, não havendo qualquer simulação ou dissimulação.

Declaram, ainda, estarem de acordo com os termos desta escritura, bem como cientes de que este ato está sujeito ao Imposto sobre Transmissão de Bens Imóveis - ITBI, já recolhido mediante guia nº 123456, no valor de R$ 24.000,00 (vinte e quatro mil reais).

Emitida a Declaração de Operação Imobiliária - DOI, conforme Instrução Normativa da Receita Federal do Brasil.

E, assim, lida em voz alta e clara esta escritura às partes e achada conforme, outorgam, aceitam e assinam.

Eu, Tabelião, lavrei a presente escritura, conferi, dou fé e assino.`;

const inventarioSampleContent = `AUTO DE ABERTURA DE INVENTÁRIO

Aos 20 (vinte) dias do mês de março do ano de 2023 (dois mil e vinte e três), nesta cidade e comarca de São Paulo, Estado de São Paulo, perante o MM. Juiz de Direito da 2ª Vara de Família e Sucessões, Dr. Paulo Ferreira Lima, compareceu ROBERTO SANTOS, brasileiro, viúvo, engenheiro, portador da Cédula de Identidade RG nº 23.456.789-0 SSP/SP, inscrito no CPF/MF sob nº 234.567.890-12, residente e domiciliado na Rua das Palmeiras, nº 456, Bairro Jardim América, CEP 01456-789, nesta Capital, para requerer a abertura de inventário dos bens deixados por MARIA HELENA SANTOS, falecida em 15/01/2023, conforme certidão de óbito anexa.

O requerente declara, sob as penas da lei, que a falecida não deixou testamento, sendo seus herdeiros:

1. ROBERTO SANTOS, já qualificado, cônjuge sobrevivente, casado sob o regime de comunhão parcial de bens;
2. CARLOS EDUARDO SANTOS, brasileiro, solteiro, estudante, portador da Cédula de Identidade RG nº 34.567.890-1 SSP/SP, inscrito no CPF/MF sob nº 345.678.901-23, residente e domiciliado no mesmo endereço do inventariante, filho da falecida;
3. ANA PAULA SANTOS, brasileira, solteira, médica, portadora da Cédula de Identidade RG nº 45.678.901-2 SSP/SP, inscrita no CPF/MF sob nº 456.789.012-34, residente e domiciliada na Avenida Paulista, nº 789, Apto. 1001, Bairro Bela Vista, CEP 01310-300, nesta Capital, filha da falecida.

O requerente indica como bens do espólio:

1. Um apartamento situado na Rua das Palmeiras, nº 456, Apto. 701, Edifício Orquídeas, Bairro Jardim América, CEP 01456-789, nesta Capital, com área privativa de 150,00m² (cento e cinquenta metros quadrados), registrado sob a matrícula nº 54.321 no 4º Oficial de Registro de Imóveis desta Capital, avaliado em R$ 1.200.000,00 (um milhão e duzentos mil reais);
2. Um veículo marca Toyota, modelo Corolla, ano 2020, placa ABC-1234, RENAVAM 12345678901, avaliado em R$ 90.000,00 (noventa mil reais);
3. Saldos em contas bancárias no valor aproximado de R$ 150.000,00 (cento e cinquenta mil reais);
4. Aplicações financeiras no valor aproximado de R$ 300.000,00 (trezentos mil reais).

Face ao exposto, requer a V. Exa. a abertura do inventário, nomeando-o como inventariante, comprometendo-se a apresentar as primeiras declarações no prazo legal.

Nestes termos, pede deferimento.

São Paulo, 20 de março de 2023.

Roberto Santos
Inventariante

Dr. Fernando Mello Barros
OAB/SP 123.456
Advogado`;

const newDraft: Draft = {
  id: 'new',
  title: 'Escritura de Compra e Venda - Apartamento',
  type: 'Escritura de Compra e Venda',
  content: sampleContent,
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockDrafts: Draft[] = [
  {
    id: '1',
    title: 'Escritura de Compra e Venda - Imóvel Residencial',
    type: 'Escritura de Compra e Venda',
    content: sampleContent,
    createdAt: new Date('2023-09-15T10:30:00'),
    updatedAt: new Date('2023-09-15T10:30:00')
  },
  {
    id: '2',
    title: 'Inventário - Espólio de João da Silva',
    type: 'Inventário',
    content: inventarioSampleContent,
    createdAt: new Date('2023-09-10T14:45:00'),
    updatedAt: new Date('2023-09-12T09:20:00')
  }
];

const defaultNewDrafts: Record<DraftType, Draft> = {
  'Escritura de Compra e Venda': {
    id: 'new',
    title: 'Escritura de Compra e Venda - Apartamento',
    type: 'Escritura de Compra e Venda',
    content: sampleContent,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  'Inventário': {
    id: 'new',
    title: 'Inventário - Processo de Sucessão',
    type: 'Inventário',
    content: inventarioSampleContent,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  'Doação': {
    id: 'new',
    title: 'Escritura de Doação',
    type: 'Doação',
    content: "Conteúdo da escritura de doação...",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  'União Estável': {
    id: 'new',
    title: 'Contrato de União Estável',
    type: 'União Estável',
    content: "Conteúdo do contrato de união estável...",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  'Procuração': {
    id: 'new',
    title: 'Procuração Pública',
    type: 'Procuração',
    content: "Conteúdo da procuração pública...",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  'Testamento': {
    id: 'new',
    title: 'Testamento Público',
    type: 'Testamento',
    content: "Conteúdo do testamento público...",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  'Contrato de Aluguel': {
    id: 'new',
    title: 'Contrato de Locação Residencial',
    type: 'Contrato de Aluguel',
    content: "Conteúdo do contrato de locação...",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  'Contrato Social': {
    id: 'new',
    title: 'Contrato Social - Sociedade Limitada',
    type: 'Contrato Social',
    content: "Conteúdo do contrato social...",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  'Outro': {
    id: 'new',
    title: 'Documento Jurídico',
    type: 'Outro',
    content: "Conteúdo do documento jurídico...",
    createdAt: new Date(),
    updatedAt: new Date()
  }
};

interface ExtendedDraft extends Draft {
  extractedData?: Record<string, string>;
}

const ViewDraft: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [draft, setDraft] = useState<ExtendedDraft | null>(null);
  
  useEffect(() => {
    if (id === 'new') {
      const storedDraft = sessionStorage.getItem('generatedDraft');
      if (storedDraft) {
        try {
          const parsedDraft = JSON.parse(storedDraft);
          
          // Convert ISO strings back to Date objects
          if (typeof parsedDraft.createdAt === 'string') {
            parsedDraft.createdAt = new Date(parsedDraft.createdAt);
          }
          
          if (typeof parsedDraft.updatedAt === 'string') {
            parsedDraft.updatedAt = new Date(parsedDraft.updatedAt);
          }
          
          setDraft(parsedDraft);
        } catch (error) {
          console.error('Error parsing stored draft:', error);
          // If there was an error parsing, use a default draft
          const defaultType: DraftType = 'Escritura de Compra e Venda';
          setDraft(defaultNewDrafts[defaultType]);
        }
      } else {
        // Default to Compra e Venda if no draft is stored
        setDraft(defaultNewDrafts['Escritura de Compra e Venda']);
      }
    } else {
      const foundDraft = mockDrafts.find(d => d.id === id);
      setDraft(foundDraft || null);
    }
  }, [id]);
  
  const handleDownload = () => {
    toast({
      title: "Download iniciado",
      description: "Seu documento será baixado em instantes."
    });
  };
  
  const handleApprove = () => {
    toast({
      title: "Minuta aprovada",
      description: "A minuta foi aprovada e armazenada com sucesso."
    });
    sessionStorage.removeItem('generatedDraft');
    navigate('/');
  };

  if (!draft) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="page-container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="heading-1 mb-4">Minuta não encontrada</h1>
            <p className="text-muted-foreground mb-6">
              A minuta solicitada não foi encontrada no sistema.
            </p>
            <button 
              onClick={() => navigate('/')}
              className="button-primary"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="page-container">
        <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between animate-slide-in">
          <h1 className="heading-1">Minuta Gerada</h1>
          <div className="flex space-x-3">
            <button 
              onClick={() => navigate(`/edit/${draft.id}`)}
              className="button-outline flex items-center space-x-2"
            >
              <Edit className="h-4 w-4" />
              <span>Editar Manualmente</span>
            </button>
            <button 
              onClick={handleDownload}
              className="button-outline flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Baixar PDF</span>
            </button>
            <button 
              onClick={handleApprove}
              className="button-primary flex items-center space-x-2"
            >
              <Check className="h-4 w-4" />
              <span>Aprovar</span>
            </button>
          </div>
        </div>
        
        <div className="animate-scale-in" style={{ animationDelay: '100ms' }}>
          <DraftViewer 
            draft={draft} 
            extractedData={draft.extractedData}
          />
        </div>
      </main>
    </div>
  );
};

export default ViewDraft;
