import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Download, Copy } from "lucide-react";
import { jsPDF } from "jspdf";

import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useProtocolo } from "@/contexts/ProtocoloContext";
import { RegistrationData } from "@/types";
import { FormData } from "@/components/review/types";

const ProtocoloGerado: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const protocolo = useProtocolo();
  const [protocoloNumero, setProtocoloNumero] = useState<string>("");
  
  const formData = location.state?.formData as FormData;
  
  useEffect(() => {
    if (!formData) {
      toast({
        title: "Dados não encontrados",
        description: "Por favor, preencha o formulário novamente.",
        variant: "destructive"
      });
      
      if (formData?.estadoCivil === "Casado(a)") {
        navigate('/cadastro/casado');
      } else {
        navigate('/cadastro/solteiro');
      }
      return;
    }
    
    if (!protocoloNumero) {
      try {
        const protocoloData = prepareProtocoloData();
        
        if (!protocoloData) {
          throw new Error("Falha ao preparar dados do protocolo");
        }
        
        const novoProtocolo = protocolo.saveNewProtocolo({
          nome: formData.nome,
          cpf: formData.cpf,
          conteudo: protocoloData.documentoTexto,
          registrationData: protocoloData.registrationData,
          textoQualificacao: protocoloData.documentoTexto
        });
        
        setProtocoloNumero(novoProtocolo.numero);
        
        toast({
          title: "Protocolo gerado",
          description: "Seu documento recebeu um número de protocolo."
        });
      } catch (error) {
        console.error("Erro ao gerar protocolo:", error);
        toast({
          title: "Erro ao gerar protocolo",
          description: "Não foi possível gerar o protocolo para este documento.",
          variant: "destructive"
        });
      }
    }
  }, [formData, navigate, toast, protocolo, protocoloNumero]);

  const formatCPF = (cpf: string): string => {
    const cleanCPF = cpf.replace(/\D/g, '');
    
    if (cleanCPF.length === 11) {
      return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    
    return cpf;
  };

  const formatarDataPorExtenso = (data: Date | string | undefined) => {
    if (!data) return "Não informada";
    
    try {
      if (typeof data === 'string') {
        if (data === '00/00/0000' || data === '') return "Não informada";
        
        const parts = data.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          
          if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            const dateObj = new Date(year, month, day);
            if (isNaN(dateObj.getTime())) {
              console.log(`Data inválida: ${data}, convertida para: ${dateObj}`);
              return "Não informada";
            }
            return format(dateObj, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
          }
        }
      }
      
      const dateObj = new Date(data);
      if (isNaN(dateObj.getTime())) {
        console.log(`Data inválida: ${data}, convertida para: ${dateObj}`);
        return "Não informada";
      }
      
      return format(dateObj, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch (error) {
      console.error("Erro ao formatar data por extenso:", error, data);
      return "Não informada";
    }
  };
  
  const formatarData = (data: Date | string | undefined) => {
    if (!data) return "Não informada";
    
    try {
      if (typeof data === 'string') {
        if (data === '00/00/0000' || data === '') return "Não informada";
        
        const parts = data.split('/');
        if (parts.length === 3) {
          return data;
        }
      }
      
      const dateObj = typeof data === 'string' ? new Date(data) : data;
      if (isNaN(dateObj.getTime())) {
        console.log(`Data inválida ao formatar data: ${data}`);
        return "Não informada";
      }
      
      return format(dateObj, "dd/MM/yyyy");
    } catch (error) {
      console.error("Erro ao formatar data:", error, data);
      return "Não informada";
    }
  };
  
  const formatPropertyRegime = (regime: string): string => {
    if (!regime) return "comunhão parcial de bens";
    
    const regimeMap: Record<string, string> = {
      "comunhao_parcial": "comunhão parcial de bens",
      "comunhao_universal": "comunhão universal de bens",
      "separacao_total": "separação total de bens",
      "separacao_obrigatoria": "separação obrigatória de bens",
      "participacao_final_aquestos": "participação final nos aquestos",
    };
    
    if (regime.includes(" ")) {
      return regime.toLowerCase();
    }
    
    return regimeMap[regime] || regime.replace("_", " ").toLowerCase();
  };
  
  const getDocumentoTexto = (data: FormData): string => {
    if (!data) return "";
    
    try {
      if (data.estadoCivil === "Casado(a)" && data.nomeConjuge) {
        const propertyRegime = formatPropertyRegime(data.regimeBens || "");
        
        return `${data.nome}, ${data.nacionalidade || "brasileiro"}, nascido na cidade de ${data.naturalidade}-${data.uf}, aos ${formatarData(data.dataNascimento)}, filho de ${data.filiacao}, profissão ${data.profissao}, portador da Cédula de Identidade nº ${data.rg}-${data.orgaoExpedidor} e inscrito no CPF/MF sob o nº ${data.cpf}, endereço eletrônico: ${data.email}, casado, desde ${formatarData(data.dataCasamento)}, sob o regime da ${propertyRegime}, na vigência da Lei nº 6.515/77, com ${data.nomeConjuge}, ${data.nacionalidade || "brasileira"}, nascida na cidade de ${data.naturalidadeConjuge}-${data.ufConjuge}, aos ${formatarData(data.dataNascimentoConjuge)}, filha de ${data.filiacaoConjuge}, profissão ${data.profissaoConjuge}, portadora da Cédula de Identidade nº ${data.rgConjuge}-${data.orgaoExpedidorConjuge} e inscrita no CPF/MF sob o nº ${data.cpfConjuge}, endereço eletrônico: ${data.emailConjuge}, residentes e domiciliados na ${data.endereco};`;
      } else {
        return `${data.nome}, ${data.nacionalidade ? data.nacionalidade : "brasileiro(a)"}, natural de ${data.naturalidade}-${data.uf}, nascido(a) aos ${formatarDataPorExtenso(data.dataNascimento)}, filho(a) de ${data.filiacao}, profissão ${data.profissao}, estado civil ${data.estadoCivil}, portador(a) da Cédula de Identidade nº ${data.rg}-${data.orgaoExpedidor} e inscrito(a) no CPF/MF sob o nº ${data.cpf}, endereço eletrônico: ${data.email}, residente e domiciliado(a) na ${data.endereco};`;
      }
    } catch (error) {
      console.error("Erro ao gerar texto do documento:", error);
      return "Erro ao gerar texto do documento. Por favor, tente novamente.";
    }
  };

  const copiarTexto = () => {
    const texto = document.getElementById('documento-texto')?.innerText;
    if (texto) {
      navigator.clipboard.writeText(texto).then(() => {
        toast({
          title: "Texto copiado",
          description: "O texto foi copiado para a área de transferência."
        });
      }).catch(() => {
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar o texto.",
          variant: "destructive"
        });
      });
    }
  };

  const renderDadosPessoaisPDF = (doc: jsPDF, startY: number): number => {
    let y = startY;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("DADOS PESSOAIS", 20, y);
    y += 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    doc.text(`Nome: ${formData.nome}`, 20, y);
    y += 8;
    doc.text(`CPF: ${formatCPF(formData.cpf)}`, 20, y);
    y += 8;
    doc.text(`RG: ${formData.rg} - ${formData.orgaoExpedidor}`, 20, y);
    y += 8;
    doc.text(`Data de Nascimento: ${formatarData(formData.dataNascimento)}`, 20, y);
    y += 8;
    doc.text(`Naturalidade: ${formData.naturalidade}-${formData.uf}`, 20, y);
    y += 8;
    doc.text(`Filiação: ${formData.filiacao}`, 20, y);
    y += 8;
    doc.text(`Profissão: ${formData.profissao}`, 20, y);
    y += 8;
    doc.text(`Estado Civil: ${formData.estadoCivil}`, 20, y);
    y += 8;
    doc.text(`E-mail: ${formData.email}`, 20, y);
    y += 8;
    doc.text(`Endereço: ${formData.endereco}`, 20, y);
    y += 8;

    if (formData.estadoCivil === "Casado(a)" && formData.nomeConjuge) {
      y += 10;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("DADOS DO CÔNJUGE", 20, y);
      y += 10;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);

      doc.text(`Nome: ${formData.nomeConjuge}`, 20, y);
      y += 8;
      doc.text(`CPF: ${formatCPF(formData.cpfConjuge)}`, 20, y);
      y += 8;
      doc.text(`RG: ${formData.rgConjuge} - ${formData.orgaoExpedidorConjuge}`, 20, y);
      y += 8;
      doc.text(`Data de Nascimento: ${formatarData(formData.dataNascimentoConjuge)}`, 20, y);
      y += 8;
      doc.text(`Naturalidade: ${formData.naturalidadeConjuge}-${formData.ufConjuge}`, 20, y);
      y += 8;
      doc.text(`Filiação: ${formData.filiacaoConjuge}`, 20, y);
      y += 8;
      doc.text(`Profissão: ${formData.profissaoConjuge}`, 20, y);
      y += 8;
      doc.text(`E-mail: ${formData.emailConjuge}`, 20, y);
      y += 8;
      doc.text(`Data do Casamento: ${formatarData(formData.dataCasamento)}`, 20, y);
      y += 8;
      doc.text(`Regime de Bens: ${formatPropertyRegime(formData.regimeBens || "")}`, 20, y);
      y += 8;
    }

    return y;
  };

  const baixarDocumento = () => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`Protocolo: ${protocoloNumero}`, 20, 20);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      
      const texto = document.getElementById('documento-texto')?.innerText || "";
      
      const margemEsquerda = 20;
      let margemSuperior = 35;
      const larguraUtil = doc.internal.pageSize.width - 40;
      
      doc.text("QUALIFICAÇÃO COMPLETA:", margemEsquerda, margemSuperior);
      margemSuperior += 10;
      
      doc.text(texto, margemEsquerda, margemSuperior, { 
        maxWidth: larguraUtil,
        align: "justify"
      });
      
      doc.addPage();
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`Protocolo: ${protocoloNumero}`, 20, 20);
      doc.text("DADOS CADASTRAIS", 20, 30);
      doc.setDrawColor(100, 100, 100);
      doc.line(20, 32, doc.internal.pageSize.width - 20, 32);
      
      renderDadosPessoaisPDF(doc, 40);
      
      const nomeArquivo = `documento_${protocoloNumero.replace(/-/g, '_').toLowerCase()}.pdf`;
      
      doc.save(nomeArquivo);
      
      toast({
        title: "Download concluído",
        description: "O documento foi baixado com sucesso."
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro ao baixar",
        description: "Não foi possível gerar o documento PDF.",
        variant: "destructive"
      });
    }
  };

  const voltarParaDocumento = () => {
    navigate('/cadastro/documento', { state: { formData } });
  };

  const prepareProtocoloData = () => {
    if (!formData) return null;
    
    let documentoTexto;
    try {
      documentoTexto = getDocumentoTexto(formData);
    } catch (error) {
      console.error("Erro ao gerar texto do documento:", error);
      documentoTexto = "Erro ao gerar documento. Por favor, verifique os dados informados.";
    }
    
    sessionStorage.setItem('documentoGeradoTexto', documentoTexto);
    console.log("Qualificação completa armazenada do protocolo:", documentoTexto);
    
    const registrationData: RegistrationData = {
      type: formData.estadoCivil === "Casado(a)" ? 'casado' : 'solteiro',
      personalInfo: {
        name: formData.nome,
        birthDate: formatarData(formData.dataNascimento),
        cpf: formData.cpf,
        rg: formData.rg,
        address: formData.endereco,
        email: formData.email,
        phone: "",
        naturality: formData.naturalidade,
        uf: formData.uf,
        filiation: formData.filiacao,
        profession: formData.profissao,
        civilStatus: formData.estadoCivil,
        issuer: formData.orgaoExpedidor,
        nationality: formData.nacionalidade || "Brasileiro(a)"
      }
    };
    
    if (formData.estadoCivil === "Casado(a)" && formData.nomeConjuge) {
      const spouseBirthDate = formatarData(formData.dataNascimentoConjuge);
      const marriageDate = formatarData(formData.dataCasamento);
      
      registrationData.spouseInfo = {
        name: formData.nomeConjuge || "",
        birthDate: spouseBirthDate,
        cpf: formData.cpfConjuge || "",
        rg: formData.rgConjuge || "",
        naturality: formData.naturalidadeConjuge || "",
        uf: formData.ufConjuge || "",
        filiation: formData.filiacaoConjuge || "",
        profession: formData.profissaoConjuge || "",
        issuer: formData.orgaoExpedidorConjuge || "",
        email: formData.emailConjuge || "",
        marriageDate: marriageDate,
        propertyRegime: formData.regimeBens || ""
      };
    }
    
    return {
      documentoTexto,
      registrationData
    };
  };

  if (!formData) return null;

  const documentoTexto = getDocumentoTexto(formData);

  return (
    <>
      <Navbar />
      <div className="container py-8 max-w-4xl mx-auto">
        <Card className="shadow-md">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-2xl font-serif">Documento com Protocolo</CardTitle>
          </CardHeader>
          
          <CardContent className="py-6">
            <div className="mb-6 bg-blue-50 p-4 rounded-md border border-blue-100">
              <h3 className="text-lg font-medium mb-2 text-blue-800">Protocolo de Registro</h3>
              <p className="text-2xl font-mono font-bold">{protocoloNumero}</p>
              <p className="text-sm text-blue-600 mt-2">Este protocolo identifica unicamente seu documento no sistema.</p>
            </div>
            
            <div className="bg-white p-6 border rounded-md">
              <p id="documento-texto" className="text-justify leading-relaxed whitespace-pre-line">
                {documentoTexto}
              </p>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between border-t bg-slate-50 p-4">
            <Button 
              variant="outline" 
              onClick={voltarParaDocumento}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={copiarTexto}
                className="gap-2"
              >
                <Copy className="h-4 w-4" />
                Copiar Texto
              </Button>
              <Button 
                onClick={baixarDocumento}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Baixar Documento
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  );
};

export default ProtocoloGerado;
