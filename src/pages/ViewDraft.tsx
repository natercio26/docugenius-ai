import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import DraftViewer from '@/components/DraftViewer';
import { Draft, DraftType } from '@/types';
import { Download, Edit, Check, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const sampleContent = `ESCRITURA PÚBLICA DE COMPRA E VENDA

SAIBAM todos quantos esta Escritura Pública de Compra e Venda virem que, aos 15 (quinze) dias do mês de setembro do ano de 2023 (dois mil e vinte e três), nesta cidade e comarca de São Paulo, Estado de São Paulo, perante
mim, Tabelião, compareceram as partes entre si justas e contratadas, a saber:

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

Foram-me apresentadas e ficam arquivadas neste Tabelionato as certidões exigidas por lei, a saber: Certidão Negativa de Débitos Relativos aos Tributos Federais e à Dívida Ativa da União; Certidão Negativa de D��bitos Tributários Estaduais; Certidão Negativa de Débitos Tributários Municipais; Certidão Negativa de Débitos Condominiais; e Certidão Negativa de Ônus Reais, Ações Reais e Pessoais Reipersecutórias extraída da matrícula do imóvel.

Declaram as partes, sob responsabilidade civil e criminal, que o preço atribuído ao imóvel nesta escritura é real e efetivamente pago, não havendo qualquer simulação ou dissimulação.

Declaram, ainda, estarem de acordo com os termos desta escritura, bem como cientes de que este ato está sujeito ao Imposto sobre Transmissão de Bens Imóveis - ITBI, já recolhido mediante guia nº 123456, no valor de R$ 24.000,00 (vinte e quatro mil reais).

Emitida a Declaração de Operação Imobiliária - DOI, conforme Instrução Normativa da Receita Federal do Brasil.

E, assim, lida em voz alta e clara esta escritura às partes e achada conforme, outorgam, aceitam e assinam.

Eu, Tabelião, lavrei a presente escritura, conferi, dou fé e assino.`;

const inventarioSampleContent = `ESCRITURA PÚBLICA DE INVENTÁRIO E PARTILHA, na forma abaixo:
S A I B A M = quantos esta virem que, æData_lav1> , nesta cidade de Brasília,
Distrito Federal, Capital da República Federativa do Brasil, nesta Serventia,
perante mim, Escrevente, compareceram como Outorgantes e reciprocamente
Outorgados, na qualidade de viúvo(a)-meeiro(a): ¿qualificacao_do(a)_viuvo(a)>
e, na qualidade de §2herdeiro§-§2filho§: ¿qualificacao_do(a)(s)_herdeiro(a)(s)>
e, na qualidade de advogado(a), ¿nome_do_advogado>
Todos os presentes foram reconhecidos e identificados como os próprios de que
trato, pelos documentos apresentados, cuja capacidade jurídica reconheço e dou
fé. E, pelos Outorgantes e reciprocamente Outorgados, devidamente orientados
pelo(a) advogado(a), acima nomeado e qualificado, legalmente constituído(a)
para este ato, me foi requerida a lavratura do inventário e partilha amigável
dos bens e direitos deixados pelo falecimento de
¿nome_do_"de_cujus"> ,
conforme dispõe na Lei nº 13.105/2015, regulamentada pela Resolução nº 35 de
24 abril de 2007, do Conselho Nacional de Justiça, nos seguintes termos e
condições:
1. DO(A) AUTOR(A) DA HERANÇA - O autor da herança,
¿nome_do_autor_da_heranca> , quando em vida era
¿qualificacao_do_autor_da_heranca>
1.1. Foi casado(a) com o(a) viúvo(a)-meeiro(a), ¿nome_do(a)_viuva(o)-
meeira(o)> sob o regime da ¿regime> , desde ¿data_do_casamento> ,conforme
certidão de casamento expedida aos ¿data_de_expedicao> , registrada sob a
matrícula nº ¿nº_da_matricula_da_cert._obito> , pelo Cartório do
¿oficio_do_cartorio> ;
1.2. Faleceu aos ¿data_do_falecimento> , no Hospital ¿nome_do_hospital> ,
na cidade de ¿cidade> , conforme certidão de óbito expedida aos
¿data_de_expedicao> , registrada sob a matrícula nº
¿nº_da_matricula_da_cert._obito> , pelo Cartório do ¿oficio_do_cartorio>
ou--------- conforme certidão de óbito registrada sob o termo nº ¿nº_do_termo> ,
do Livro nº ¿livro> , às fls. ¿fls> , do Cartório do ¿cartorio> , expedida aos
¿data_de_expedicao> ;
1.3. Do relacionamento do(a) autor(a) da herança com o(a) ora viúvo(a)-
meeiro(a) nasceram ¿quantidade_de_filhos> , todos maiores e capazes, a saber:
¿nome_dos_filhos> , declarando os presentes que desconhece(m) a existência
de outros herdeiros, a não ser o(s) mencionado(s) no presente ato.
2. DAS DECLARAÇÕES DAS PARTES - As partes declaram sob as penas da
lei, que:
a) o(a) autor(a) da herança não deixou testamento conhecido, por qualquer
natureza;
CASO TENHA DEIXADO TESTAMENTO - CONSTAR O SEGUINTE TEXTO:
a) §1o§ §1falecido§ deixou testamento que foi aberto nos autos do processo nº-
------------------------------------------- e teve autorização expressa para realização
do inventário por meio de Escritura Pública emanada pelo (a) Juiz (a) --------
-----------------------------, em---------------------------------------, tudo conforme o
estabelecido no artigo 12-B da resolução 35 do Conselho Nacional de Justiça.
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
Outorgados, de comum acordo, nomeiam como inventariante do espólio,
¿nome_do_inventariante> , conferindo-lhe todos os poderes que se fizerem
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
4.1. IMÓVEL ¿DESCRICAO_DO(S)_BEM(NS)> , melhor descrito e
caracterizado na Matrícula nº ¿MATRICULA_Nº> , do ¿nº_do_cartorio> Ofício
do Registro de Imóveis do ¿cidade> ; havido: ¿modo_de_aquisicao> ,
devidamente registrado sob o nº R-¿REGISTRO_Nº> , na matrícula nº
¿MATRICULA-> , do mencionado registro imobiliário, para o qual as partes
atribuem o valor de ¿valor> avaliado para fins fiscais no valor de
¿VALOR_R$> ;
VEÍCULO marca ¿marca> , cor ¿cor> , categoria ¿categoria> , combustível
¿alcool/gasolina> , placa ¿placa> , chassi nº ¿chassi> , ano ¿ano> , modelo
¿modelo> , renavam ¿renavam> , para o qual as partes atribuem o valor de
¿valor> , avaliado para fins fiscais no valor de ¿VALOR_R$> ;
SALDO EM CONTA Saldo em Conta ¿corrente_ou_poupanca> nº ¿numero>
, Agência nº ¿agencia> , junto ao Banco ¿nome_do_banco> , no valor de
¿valor> e acréscimos ou deduções se houver;
===QUANTIDADE=== cotas de Capital Social da Empresa ===NOME===,
inscrita no CNPJ sob o nº ======, correspondente a ===PERCENTUAL===
do patrimônio liquido. As partes atribuem o valor de R$========, para fins de
partilha. Conforme Contrato Social o valor do capital social é de R$ ======,
conforme balanço patrimonial o valor do patrimônio líquido é de R$ ======;
5. DA PARTILHA - O(s) bem(s) constante(s) do item "4." da presente, soma(m)
¿monte_mor> , e será(ão) partilhado(s) da seguinte forma:
5.1. Caberá ao(a) viúvo(a)-meeiro(a), ¿nome_do(a)_viuvo(a)> , em razão de sua
meação, 50% (cinquenta por cento) de todos os bens descritos e caracterizados
no item "4." da presente, correspondendo ao valor de ¿valor_da_meacao> ;
5.2. Caberá a cada um do(s) herdeiro(s), ¿incluir_o_nome_dos_herdeiros> ,
em razão da sucessão legítima, ¿incluir_o_percentual> , de todos o(s) bem(s)
descrito(s) e caracterizados no item "4." da presente, correspondendo ao valor
unitário de ¿incluir_valor_que_pertence_a_cada_herdeiro> .
6. DAS CERTIDÕES E DOCUMENTOS APRESENTADOS - Foram-me
apresentados e aqui arquivados os seguintes documentos e certidões para esta:
a) Os documentos mencionados no artigo 22 da Resolução nº 35 do Conselho
Nacional de Justiça, de 24 de abril de 2007, bem como os especificados na lei
7.433/85, regulamentada pelo Decreto-Lei 93.240/86;
b) Certidão de matrícula e ônus reais e pessoais reipersecutórias, relativa(s)
ao(s) imóvel(s) objeto(s) desta escritura, bem como os documentos
comprobatórios dos demais bens descritos e caracterizados no item "4." da
presente;
c) Certidão Negativa de Débitos relativos aos Tributos Federais e à Dívida Ativa
da União, expedida pela Procuradoria-Geral da Fazenda Nacional e Secretaria
da Receita Federal sob o nº ¿nº__da_certidao> , emitida aos
¿data_da_emissao> , às ¿incluir_hora_de_emissao> , válida até ¿validade> ,
em nome e CPF do(a) falecido(a);
d) Certidão Negativa de Débitos, expedida pelo GDF sob o nº ¿nº_da_certidao>
, emitida aos ¿data_de_emissao> , válida até ¿validade> , em nome e CPF
do(a) falecido(a);
e) Certidão Negativa de Débitos de Tributos Imobiliários, expedida pelo GDF sob
o nº ¿cnd_de_iptu> , emitida aos ¿data_de_expedicao> , válida até ¿validade>
, referente ao imóvel descrito no subitem ¿item_do_imovel> , inscrição nº
¿inscricao_do_GDF> ;
f) Certidão Negativa de Testamento, emitida pela Central de Serviços Eletrônicos
Compartilhados - CENSEC, em nome do(a)(s) autor(a)(es) da herança.
SE TIVER IMÓVEL DE OUTRO ESTADO INCLUIR O ITEM G
g) Certidão Negativa de Débitos, expedida pela Prefeitura de ======= sob o nº
=====, emitida aos ====, válida até =======, em nome e CPF do(a) falecido(a);
SE HOUVER IMÓVEL RURAL
g) Certificado de Cadastro de Imóvel Rural - CCIR, sob o nº ¿numero> , código
do imóvel rural ¿codigo> , referente ao exercício de ¿numero_do_exercicio> ,
com as seguintes medidas: área total ¿area_total> , denominação do imóvel:
¿nome_da_fazenda> , indicações para localização do imóvel:
¿verificar_no_CCIR> , município sede do imóvel: ¿cidade]> , classificação
fundiária ¿verificar_no_CCIR> , nºs. de módulos fiscais ¿nº> , fração mínima
de parcelamento ¿fracao_minima> , área registrada ¿area_registrada> , posse
a justo título ¿verificar_no_CCIR> , em relação ao imóvel descrito e
caracterizado no subitem ¿item_do_imovel> ;
h) Certidão Negativa de Débitos Relativos ao Imposto sobre a Propriedade
Territorial Rural, expedida pela SRFB, sob o nº ¿numero> , emitida às
¿hora_da_emissao> horas, dia ¿data> , válida até ¿data> , NIRF ¿nirf> , em
relação ao imóvel descrito e caracterizado no subitem ¿item_do_imovel> ;
i) Certidão Negativa de Débitos - Ministério do Meio Ambiente - MMA - Instituto
Brasileiro do Meio Ambiente e dos Recursos Naturais Renováveis - IBAMA, sob
os nº ¿numero> , expedida em ¿data> , válida até ¿data> , em nome do autor
da herança.
7. DO IMPOSTO DE TRANSMISSÃO "CAUSA MORTIS" E DOAÇÃO - Guia de
transmissão causa mortis e doação de quaisquer bens e direitos - ITCMD,
expedida pela Secretaria de Estado da Fazenda do Distrito Federal sob o nº
¿nº_da_guia> , no valor de ¿valor> , paga aos ¿data_de_pagamento> , no
mesmo valor, sob a alíquota de 4% sobre o valor total tributável de
¿valor_tributavel> , em relação à sucessão legítima.
8. DAS DECLARAÇÕES DO(A) ADVOGADO(A) - Pelo(a) advogado(a) me foi
dito que, na qualidade de advogado(a) das partes, assessorou e aconselhou
seus constituintes, tendo conferido a correção da partilha e seus valores de
acordo com a Lei.
9. DAS DECLARAÇÕES FINAIS - Os comparecentes requerem e autorizam ao
Cartório do Registro de Imóveis competente ¿citar_demais_orgaos> ----------e
demais órgãos, a praticar(em) todos os atos que se fizerem necessários ao
cumprimento da presente escritura;
9.1. Os comparecentes que figuram neste instrumento declaram estar cientes da
responsabilidade civil e criminal, pelas declarações de bens e pela inexistência
de outros herdeiros conhecidos e pela veracidade de todos os fatos relatados
neste instrumento de Inventário e Partilha;
9.2. Declaram, ainda, que em relação ao(s) imóvel(s) descrito(s) e
caracterizado(s) no item 4, encontram-se quites com suas obrigações
condominiais;
9.3. ¿quando_feito_por_procuracao> Pelo(s) mandatário(s) foi declarado sob
responsabilidade civil e penal, que não ocorreram quaisquer das causas de
extinção do mandato, tratadas no artigo 682, do Código Civil brasileiro.
9.4. As partes declaram-se cientes sobre a possibilidade de obtenção prévia das
certidões de feitos ajuizados expedidas pela Justiça do Distrito Federal e dos
Territórios ou Estadual, Justiça Federal e Justiça do Trabalho, em nome do(s)
autor(es) da herança, em atendimento ao disposto no artigo 45, § 6º do
Provimento Geral da Corregedoria da Justiça do Distrito Federal e dos Territórios,
inclusive Certidão Negativa de Débitos Trabalhistas - CNDT, expedida pelo TST
- Tribunal Superior do Trabalho. Demais taxas, certidões e impostos serão
apresentados por ocasião do registro.
As partes declaram ter conhecimento de que outros documentos poderão ser
solicitados por ocasião do registro da presente escritura no Cartório de Registro
de Imóveis competente. Certifica que, foi feita a consulta prévia junto a Central
Nacional de Indisponibilidade de Bens - CNIB, no(s) CPF do(a) autor(a) da
herança, conforme código hash nº ¿codigo_hash> , com o resultado ¿resultado>
NEGATIVO, conforme dispõe o artigo 7º, do Provimento nº 39/2014, da
Corregedoria Nacional de Justiça, datado de 25 de Julho de 2014.
¿ATENCAO_-_SOMENTE_QUANDO_TIVER_IMOVEL> Emitida a DOI -
Declaração sobre operação imobiliária, conforme instrução normativa da Receita
Federal do Brasil. Ficam ressalvados eventuais erros, omissões ou direitos de
terceiros porventura existentes. Assim o disseram, pediram-me e eu Escrevente
lhes lavrei a presente escritura, que feita e lhes sendo lida, foi achada em tudo
conforme, aceitam e assinam.`;

const sampleExtractedData = {
  falecido: "João Silva",
  profissao: "comerciante",
  estadoCivil: "casado",
  nacionalidade: "brasileiro",
  conjuge: "Maria Silva",
  viuva: "Maria Silva",
  dataCasamento: "10/05/1980",
  regimeBens: "Comunhão parcial de bens",
  dataFalecimento: "10/01/2023",
  hospitalFalecimento: "Hospital Santa Lúcia",
  cidadeFalecimento: "Brasília",
  numeroFilhos: "2",
  nomesFilhos: "José Silva, Paula Silva",
  herdeiro1: "José Silva",
  herdeiro2: "Paula Silva",
  inventariante: "Maria Silva",
  advogado: "Dr. Antônio Ferreira",
  oabAdvogado: "12.345 OAB/DF",
  blocoApartamento: "A",
  quadraApartamento: "SQS 308",
  numeroApartamento: "101",
  matriculaImovel: "123456",
  inscricaoGDF: "12345678",
  descricaoAdicionalImovel: "Apartamento residencial com vaga de garagem",
  cartorioImovel: "2º Ofício do Registro de Imóveis do Distrito Federal",
  valorTotalBens: "R$ 1.200.000,00",
  valorTotalMeacao: "R$ 600.000,00",
  valorPorHerdeiro: "R$ 300.000,00",
  percentualHerdeiro: "25%",
  numeroITCMD: "123456789",
  valorITCMD: "R$ 24.000,00",
  matriculaObito: "987654321098765",
  cartorioObito: "2º Ofício de Registro Civil de Brasília-DF",
  cartorioCasamento: "1º Ofício de Registro Civil de Brasília-DF",
  cpf: "476.454.821-68",
  rg: "1015311127"
};

const defaultNewDrafts: Record<DraftType, Draft> = {
  'Inventário': {
    id: 'new',
    title: 'Inventário - Espólio',
    type: 'Inventário',
    content: inventarioSampleContent,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  'Escritura de Compra e Venda': {
    id: 'new',
    title: 'Escritura de Compra e Venda - Imóvel',
    type: 'Escritura de Compra e Venda',
    content: sampleContent,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  'Doação': {
    id: 'new',
    title: 'Escritura de Doação',
    type: 'Doação',
    content: '',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  'União Estável': {
    id: 'new',
    title: 'Declaração de União Estável',
    type: 'União Estável',
    content: '',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  'Procuração': {
    id: 'new',
    title: 'Procuração',
    type: 'Procuração',
    content: '',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  'Testamento': {
    id: 'new',
    title: 'Testamento',
    type: 'Testamento',
    content: '',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  'Contrato de Aluguel': {
    id: 'new',
    title: 'Contrato de Aluguel',
    type: 'Contrato de Aluguel',
    content: '',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  'Contrato Social': {
    id: 'new',
    title: 'Contrato Social',
    type: 'Contrato Social',
    content: '',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  'Outro': {
    id: 'new',
    title: 'Documento',
    type: 'Outro',
    content: '',
    createdAt: new Date(),
    updatedAt: new Date()
  }
};

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

interface ExtendedDraft extends Draft {
  extractedData?: Record<string, string>;
  protocoloInfo?: {
    numero: string;
    nome: string;
    cpf: string;
    dataGeracao: Date;
  };
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
          const parsedDraft = JSON.parse(storedDraft) as ExtendedDraft;
          
          if (typeof parsedDraft.createdAt === 'string') {
            parsedDraft.createdAt = new Date(parsedDraft.createdAt);
          }
          
          if (typeof parsedDraft.updatedAt === 'string') {
            parsedDraft.updatedAt = new Date(parsedDraft.updatedAt);
          }
          
          if (parsedDraft.protocoloInfo && typeof parsedDraft.protocoloInfo.dataGeracao === 'string') {
            parsedDraft.protocoloInfo.dataGeracao = new Date(parsedDraft.protocoloInfo.dataGeracao);
          }
          
          if (parsedDraft.type === 'Inventário') {
            parsedDraft.extractedData = sampleExtractedData;
          }
          
          setDraft(parsedDraft);
        } catch (error) {
          console.error('Error parsing stored draft:', error);
          const defaultType: DraftType = 'Inventário';
          const defaultExtendedDraft = {...defaultNewDrafts[defaultType]} as ExtendedDraft;
          
          if (defaultType === 'Inventário') {
            defaultExtendedDraft.extractedData = sampleExtractedData;
          }
          
          setDraft(defaultExtendedDraft);
        }
      } else {
        const defaultDraft = {...defaultNewDrafts['Inventário']} as ExtendedDraft;
        defaultDraft.extractedData = sampleExtractedData;
        setDraft(defaultDraft);
      }
    } else {
      const foundDraft = mockDrafts.find(d => d.id === id);
      
      if (foundDraft) {
        if (foundDraft.type === 'Inventário') {
          const extendedDraft: ExtendedDraft = {
            ...foundDraft, 
            extractedData: sampleExtractedData
          };
          setDraft(extendedDraft);
        } else {
          setDraft(foundDraft);
        }
      } else {
        setDraft(null);
      }
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
        
        {draft.protocoloInfo && (
          <div className="max-w-4xl mx-auto mb-6 p-4 bg-blue-50 border border-blue-100 rounded-md animate-fade-in">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h2 className="text-lg font-medium text-blue-800">Protocolo associado</h2>
                <p className="text-sm text-blue-600">
                  Esta minuta foi gerada a partir do protocolo <span className="font-mono font-bold">{draft.protocoloInfo.numero}</span>
                </p>
                <div className="mt-1 text-xs text-blue-500">
                  <p>Nome: {draft.protocoloInfo.nome} • CPF: {draft.protocoloInfo.cpf}</p>
                  <p>Data de geração: {format(new Date(draft.protocoloInfo.dataGeracao), 'dd/MM/yyyy', { locale: ptBR })}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
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
