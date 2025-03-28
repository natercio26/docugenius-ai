import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Save, FileDown, File } from 'lucide-react';

import Navbar from '@/components/Navbar';
import DraftViewer from '@/components/DraftViewer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Draft } from '@/types';
import { getProtocoloByNumero } from '@/utils/protocoloStorage';

// Template de minuta para inventário
const INVENTARIO_TEMPLATE = `ESCRITURA PÚBLICA DE INVENTÁRIO E PARTILHA, na forma abaixo:
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
SALDO EM CONTA Saldo em Conta ¿corrente_ou_poupanca> nº ¿numero> ,
Agência nº ¿agencia> , junto ao Banco ¿nome_do_banco> , no valor de
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

const ViewDraft: React.FC = () => {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  // Prevenir rolagem automática da página - aplica diretamente no document
  useEffect(() => {
    const preventScroll = (e: Event) => {
      // Prevenir a rolagem automática apenas se não for iniciada pelo usuário
      if (!e.isTrusted) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Aplicar em todo o documento para garantir que a rolagem não aconteça
    document.addEventListener('scroll', preventScroll, { passive: false });
    
    return () => {
      document.removeEventListener('scroll', preventScroll);
    };
  }, []);

  useEffect(() => {
    if (isNew) {
      // Verificar se existe um rascunho no sessionStorage
      const draftFromSession = sessionStorage.getItem('generatedDraft');
      if (draftFromSession) {
        try {
          const parsedDraft = JSON.parse(draftFromSession);
          
          // Se for um rascunho de inventário, usar o template específico
          if (parsedDraft.type === 'Inventário' && (!parsedDraft.content || parsedDraft.content.trim() === '')) {
            parsedDraft.content = INVENTARIO_TEMPLATE;
          }
          
          // Converter as strings de data para objetos Date
          const draftWithDates = {
            ...parsedDraft,
            createdAt: new Date(parsedDraft.createdAt),
            updatedAt: new Date(parsedDraft.updatedAt),
            protocoloInfo: parsedDraft.protocoloInfo ? {
              ...parsedDraft.protocoloInfo,
              dataGeracao: new Date(parsedDraft.protocoloInfo.dataGeracao)
            } : undefined
          };
          
          console.log("Carregando rascunho com dados:", draftWithDates);
          
          // Verificar se existe texto de qualificação no sessionStorage
          const qualificacaoTexto = sessionStorage.getItem('documentoGeradoTexto');
          if (qualificacaoTexto) {
            console.log("Texto de qualificação encontrado no sessionStorage:", qualificacaoTexto);
            
            // Adicionar ao extractedData do rascunho
            if (!draftWithDates.extractedData) {
              draftWithDates.extractedData = {};
            }
            
            draftWithDates.extractedData.qualificacaoCompleta = qualificacaoTexto;
          }
          
          // Se tiver protocoloInfo, verificar e carregar os dados completos do protocolo do storage
          if (draftWithDates.protocoloInfo && draftWithDates.protocoloInfo.numero) {
            const protocolo = getProtocoloByNumero(draftWithDates.protocoloInfo.numero);
            if (protocolo && protocolo.registrationData) {
              console.log("Protocolo encontrado com dados de registro:", protocolo.registrationData);
              
              // Adicionar os dados de registro completos para uso na qualificação
              if (!draftWithDates.extractedData) {
                draftWithDates.extractedData = {};
              }
              
              // Mapear dados do registro para o formato esperado pelos placeholders
              if (protocolo.registrationData.personalInfo) {
                const personalInfo = protocolo.registrationData.personalInfo;
                
                // Mapear os dados principais para o formato de extractedData
                draftWithDates.extractedData = {
                  ...draftWithDates.extractedData,
                  nome: personalInfo.name,
                  nacionalidade: personalInfo.nationality || "brasileiro(a)",
                  naturalidade: personalInfo.naturality,
                  uf: personalInfo.uf,
                  dataNascimento: personalInfo.birthDate,
                  filiacao: personalInfo.filiation,
                  profissao: personalInfo.profession,
                  estadoCivil: personalInfo.civilStatus,
                  rg: personalInfo.rg,
                  orgaoExpedidor: personalInfo.issuer,
                  cpf: personalInfo.cpf,
                  email: personalInfo.email,
                  endereco: personalInfo.address,
                  // Adicionar versões alternativas com nomes em inglês para compatibilidade
                  name: personalInfo.name,
                  nationality: personalInfo.nationality,
                  naturality: personalInfo.naturality,
                  birthDate: personalInfo.birthDate,
                  filiation: personalInfo.filiation,
                  profession: personalInfo.profession,
                  civilStatus: personalInfo.civilStatus,
                  issuer: personalInfo.issuer,
                  address: personalInfo.address,
                  
                  // Gerar o texto de qualificação completo para uso direto
                  qualificacaoCompleta: protocolo.conteudo || qualificacaoTexto,
                  herdeiro1: personalInfo.name // Assumir que o primeiro herdeiro é a pessoa do protocolo
                };
                
                console.log("Dados extraídos mapeados do protocolo:", draftWithDates.extractedData);
              }
            }
          }
          
          setDraft(draftWithDates);
          setEditedTitle(draftWithDates.title);
        } catch (error) {
          console.error('Erro ao analisar rascunho da sessão:', error);
          toast.error('Erro ao carregar o rascunho');
          navigate('/');
        }
      } else {
        toast.error('Nenhum rascunho foi gerado');
        navigate('/');
      }
    } else {
      // Implementar a recuperação de rascunhos existentes quando houver persistência
      toast.error('Funcionalidade para carregar rascunhos salvos ainda não foi implementada');
      navigate('/');
    }
  }, [id, isNew, navigate]);

  const handleSave = () => {
    if (draft) {
      // Atualizar o título
      const updatedDraft = {
        ...draft,
        title: editedTitle,
        updatedAt: new Date()
      };
      setDraft(updatedDraft);
      
      // Salvar no sessionStorage para persistência temporária
      sessionStorage.setItem('generatedDraft', JSON.stringify(updatedDraft));
      
      setIsEditing(false);
      toast.success('Minuta salva com sucesso');
    }
  };

  const handleExport = () => {
    if (draft) {
      // Lógica para exportar o rascunho
      toast.success('Exportação concluída');
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  if (!draft) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="page-container py-8">
          <div className="flex justify-center items-center h-64">
            <p className="text-muted-foreground">Carregando minuta...</p>
          </div>
        </main>
      </div>
    );
  }

  // Para rascunhos novos, usar também os dados do documento gerado no cadastro se disponíveis
  const extractedDataToPass = {
    ...draft.extractedData,
    // Adicionar dados da sessão se existirem e garantir prioridade para qualificacaoCompleta
    ...(sessionStorage.getItem('documentoGeradoTexto') ? 
      { qualificacaoCompleta: sessionStorage.getItem('documentoGeradoTexto') } : {})
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="page-container py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="max-w-sm"
                  />
                  <Button size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                </div>
              ) : (
                <h1 className="text-2xl font-serif">
                  {draft.title}
                </h1>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport}>
                <FileDown className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button onClick={() => setIsEditing(!isEditing)}>
                <File className="h-4 w-4 mr-2" />
                {isEditing ? 'Cancelar' : 'Editar Título'}
              </Button>
            </div>
          </div>
          
          <DraftViewer 
            draft={draft} 
            extractedData={extractedDataToPass} 
          />
        </div>
      </main>
    </div>
  );
};

export default ViewDraft;
