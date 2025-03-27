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

OUTORGADO COMPRADOR: MARIA OLIVEIRA, brasileira, solteira, advogada, portadora da Cédula de Identidade RG nº 98.765.432-1 SSP/SP, inscrito no CPF/MF sob nº 987.654.321-00, residente e domiciliada na Avenida Central, nº 456, Bairro Centro, CEP 12345-678, nesta Capital;

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

const inventarioSampleContent = `<h1>ESCRITURA PÚBLICA DE INVENTÁRIO E PARTILHA</h1>
        
<p><strong>= S A I B A M =</strong> quantos esta virem que, aos vinte dias do mês de março do ano de dois mil e vinte e três, nesta cidade de Brasília, Distrito
Federal, Capital da República Federativa do Brasil, nesta Serventia, perante
mim, Escrevente, compareceram como Outorgantes e reciprocamente
Outorgados, na qualidade de viúvo(a)-meeiro(a):</p>
<p>MARIA SILVA, brasileira, viúva, aposentada, portadora da cédula de identidade RG nº 1.234.567 SSP/DF, inscrita no CPF/MF sob nº 123.456.789-00, residente e domiciliada na QI 5, Conjunto 7, Casa 15, Lago Sul, Brasília-DF</p>

<p>e, na qualidade de herdeiros-filhos:</p>
<p>JOSÉ SILVA, brasileiro, casado, engenheiro, portador da cédula de identidade RG nº 2.345.678 SSP/DF, inscrito no CPF/MF sob nº 234.567.890-00, residente e domiciliado na SQSW 304, Bloco C, Apto. 204, Sudoeste, Brasília-DF</p>
<p>PAULA SILVA, brasileira, solteira, médica, portadora da cédula de identidade RG nº 3.456.789 SSP/DF, inscrita no CPF/MF sob nº 345.678.901-00, residente e domiciliada na SQN 107, Bloco H, Apto. 404, Asa Norte, Brasília-DF</p>

<p>e, na qualidade de advogado:</p>
<p>DR. ANTÔNIO FERREIRA, brasileiro, casado, advogado, inscrito na OAB/DF sob nº 12.345, com escritório profissional na SCN Quadra 1, Bloco F, Sala 1505, Asa Norte, Brasília-DF</p>

<p>Todos os presentes foram reconhecidos e identificados como os próprios de que
trato, pelos documentos apresentados, cuja capacidade jurídica reconheço e dou
fé. E, pelos Outorgantes e reciprocamente Outorgados, devidamente orientados
pelo(a) advogado(a), acima nomeado e qualificado, legalmente constituído(a)
para este ato, me foi requerida a lavratura do inventário e partilha amigável
dos bens e direitos deixados pelo falecimento de JOÃO SILVA, conforme dispõe na Lei
nº 13.105/2015, regulamentada pela Resolução nº 35 de 24 abril de 2007, do
Conselho Nacional de Justiça, nos seguintes termos e condições:</p>

<p><strong>1. DO(A) AUTOR(A) DA HERANÇA</strong> – O(A) autor(a) da herança,</p>
<p>1.1. Foi casado com o(a) viúvo(a)-meeiro(a), MARIA SILVA, já anteriormente
qualificado(a), desde 10/05/1980, sob o regime de comunhão parcial de bens, conforme certidão
de casamento expedida aos 15/05/1980, registrada sob a matrícula nº 123456789012345, pelo
Cartório do 1º Ofício de Registro Civil de Brasília-DF;</p>

<p>1.2. Faleceu aos 10/01/2023, no Hospital Santa Lúcia, na cidade de Brasília-DF, conforme certidão de
óbito expedida aos 12/01/2023, registrada sob a matrícula nº 987654321098765, pelo Cartório do 2º Ofício de Registro Civil de Brasília-DF;</p>

<p>1.3. Do relacionamento do(a) autor(a) da herança com o(a) ora viúvo(a)-
meeiro(a) nasceram 2 filhos, todos maiores e capazes, a saber:
JOSÉ SILVA e PAULA SILVA, declarando os presentes que desconhece(m) a existência de
outros herdeiros, a não ser o(s) mencionado(s) no presente ato.</p>

<p><strong>DAS DECLARAÇÕES DAS PARTES</strong> - As partes declaram sob as penas da lei,
que:</p>
<p>a) o(a) autor(a) da herança não deixou testamento conhecido, por qualquer
natureza;</p>

<p><strong>3. DA NOMEAÇÃO DE INVENTARIANTE</strong> - Os Outorgantes e reciprocamente
Outorgados, de comum acordo, nomeiam como inventariante do espólio, MARIA SILVA, já anteriormente qualificado(a), conferindo-lhe todos os poderes que se fizerem
necessários para representar o espólio em Juízo ou fora dele; podendo ainda,
praticar todos os atos de administração dos bens, constituir advogado(a) em
nome do espólio, ingressar em juízo, ativa ou passivamente; podendo enfim
praticar todos os atos que se fizerem necessários em defesa do espólio e ao
cumprimento de suas eventuais obrigações;</p>

<p><strong>4. DOS BENS E SEUS VALORES</strong> - O(A) autor(a) da herança deixou, por
ocasião da abertura da sucessão, o(s) seguinte(s) bem(s):</p>
<p>4.1. Apartamento nº 101, do Bloco "A", da SQS 308, desta Capital,
com direito a vaga na garagem, melhor descrito e caracterizado na
matrícula nº 123456, do 2º Ofício do Registro de Imóveis do
Distrito Federal. Inscrição do imóvel junto ao GDF sob o nº 12345678</p>

<p><strong>5. DA PARTILHA</strong> - O(s) bem(s) constante(s) do item "4." da presente, soma(m)
ou valor de R$ 1.200.000,00 e será(ão) partilhado(s) da seguinte forma:</p>
<p>5.1. Caberá ao(a) viúvo(a)-meeiro(a), MARIA SILVA, em razão de sua meação, 50%
(cinquenta por cento) de todos os bens descritos e caracterizados no item "4."
da presente, correspondendo ao valor de R$ 600.000,00;</p>
<p>5.2. Caberá a cada um do(s) herdeiro(s), JOSÉ SILVA e PAULA SILVA, em razão da sucessão legítima,
25% cada, de todos o(s) bem(s) descrito(s) e caracterizados no item "4." da presente,
correspondendo ao valor unitário de R$ 300.000,00.</p>

<p><strong>7. DO IMPOSTO DE TRANSMISSÃO "CAUSA MORTIS" E DOAÇÃO</strong> - Guia de
transmissão causa mortis e doação de quaisquer bens e direitos - ITCMD,
expedida pela Secretaria de Estado da Fazenda do Distrito Federal sob o nº
123456789, no valor de R$ 24.000,00</p>

<p>Certifica que, foi feita a consulta prévia junto a Central Nacional de Indisponibilidade de Bens - CNIB, no(s) CPF do(a) autor(a) da herança, conforme código hash sob o nº A1B2C3D4E5F6, com o resultado NEGATIVO.</p>

<p>Assim o disseram, pediram-me e eu Escrevente lhes lavrei a presente escritura, que feita e lhes sendo lida, foi achada em tudo conforme, aceitam e assinam.</p>`;

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
