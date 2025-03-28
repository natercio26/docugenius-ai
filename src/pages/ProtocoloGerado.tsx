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

interface FormData {
  nome: string;
  naturalidade: string;
  uf: string;
  dataNascimento: Date;
  filiacao: string;
  profissao: string;
  estadoCivil: string;
  rg: string;
  orgaoExpedidor: string;
  cpf: string;
  email: string;
  endereco: string;
  nacionalidade?: string;
  // Campos específicos para pessoa casada
  nomeConjuge?: string;
  naturalidadeConjuge?: string;
  ufConjuge?: string;
  dataNascimentoConjuge?: Date;
  filiacaoConjuge?: string;
  profissaoConjuge?: string;
  rgConjuge?: string;
  orgaoExpedidorConjuge?: string;
  cpfConjuge?: string;
  emailConjuge?: string;
  dataCasamento?: Date;
  regimeBens?: string;
}

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

  const formatarDataPorExtenso = (data: Date) => {
    if (!data) return "";
    return format(data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };
  
  const formatarData = (data: Date) => {
    if (!data) return "";
    return format(data, "dd/MM/yyyy");
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
    if (data.estadoCivil === "Casado(a)" && data.nomeConjuge) {
      const propertyRegime = formatPropertyRegime(data.regimeBens || "");
      
      return `${data.nome}, ${data.nacionalidade || "brasileiro"}, nascido na cidade de ${data.naturalidade}-${data.uf}, aos ${formatarData(data.dataNascimento)}, filho de ${data.filiacao}, profissão ${data.profissao}, portador da Cédula de Identidade nº ${data.rg}-${data.orgaoExpedidor} e inscrito no CPF/MF sob o nº ${data.cpf}, endereço eletrônico: ${data.email}, casado, desde ${formatarData(data.dataCasamento!)}, sob o regime da ${propertyRegime}, na vigência da Lei nº 6.515/77, com ${data.nomeConjuge}, ${data.nacionalidade || "brasileira"}, nascida na cidade de ${data.naturalidadeConjuge}-${data.ufConjuge}, aos ${formatarData(data.dataNascimentoConjuge!)}, filha de ${data.filiacaoConjuge}, profissão ${data.profissaoConjuge}, portadora da Cédula de Identidade nº ${data.rgConjuge}-${data.orgaoExpedidorConjuge} e inscrita no CPF/MF sob o nº ${data.cpfConjuge}, endereço eletrônico: ${data.emailConjuge}, residentes e domiciliados na ${data.endereco};`;
    } else {
      return `${data.nome}, ${data.nacionalidade ? data.nacionalidade : "brasileiro(a)"}, natural de ${data.naturalidade}-${data.uf}, nascido(a) aos ${formatarDataPorExtenso(data.dataNascimento)}, filho(a) de ${data.filiacao}, profissão ${data.profissao}, estado civil ${data.estadoCivil}, portador(a) da Cédula de Identidade nº ${data.rg}-${data.orgaoExpedidor} e inscrito(a) no CPF/MF sob o nº ${data.cpf}, endereço eletrônico: ${data.email}, residente e domiciliado(a) na ${data.endereco};`;
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
      const margemSuperior = 35;
      const larguraUtil = doc.internal.pageSize.width - 40;
      
      doc.text(texto, margemEsquerda, margemSuperior, { 
        maxWidth: larguraUtil,
        align: "justify"
      });
      
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
    
    const documentoTexto = getDocumentoTexto(formData);
    
    sessionStorage.setItem('documentoGeradoTexto', documentoTexto);
    console.log("Qualificação completa armazenada do protocolo:", documentoTexto);
    
    const registrationData: RegistrationData = {
      type: formData.estadoCivil === "Casado(a)" ? 'casado' : 'solteiro',
      personalInfo: {
        name: formData.nome,
        birthDate: formData.dataNascimento.toISOString(),
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
      registrationData.spouseInfo = {
        name: formData.nomeConjuge || "",
        birthDate: formData.dataNascimentoConjuge?.toISOString() || "",
        cpf: formData.cpfConjuge || "",
        rg: formData.rgConjuge || "",
        naturality: formData.naturalidadeConjuge || "",
        uf: formData.ufConjuge || "",
        filiation: formData.filiacaoConjuge || "",
        profession: formData.profissaoConjuge || "",
        issuer: formData.orgaoExpedidorConjuge || "",
        email: formData.emailConjuge || "",
        marriageDate: formData.dataCasamento?.toISOString() || "",
        propertyRegime: formData.regimeBens || ""
      };
    }
    
    return {
      documentoTexto,
      registrationData
    };
  };

  if (!formData) return null;

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
                {getDocumentoTexto(formData)}
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
