
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
}

const ProtocoloGerado: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const protocolo = useProtocolo();
  const [protocoloNumero, setProtocoloNumero] = useState<string>("");
  
  // Recuperar os dados do estado da navegação
  const formData = location.state?.formData as FormData;
  
  // Se não houver dados, redirecionar para o formulário
  useEffect(() => {
    if (!formData) {
      toast({
        title: "Dados não encontrados",
        description: "Por favor, preencha o formulário novamente.",
        variant: "destructive"
      });
      navigate('/cadastro/solteiro');
      return;
    }
    
    // Gerar protocolo na primeira renderização apenas se não tiver protocolo
    if (!protocoloNumero) {
      try {
        // Preparar dados para o protocolo
        const documentoTexto = getDocumentoTexto(formData);
        
        // Converter formData para o formato de RegistrationData
        const registrationData: RegistrationData = {
          type: 'solteiro',
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
        
        // Salvar o novo protocolo com os dados de registro
        const novoProtocolo = protocolo.saveNewProtocolo({
          nome: formData.nome,
          cpf: formData.cpf,
          conteudo: documentoTexto,
          registrationData: registrationData
        });
        
        // Atualizar o estado com o número do protocolo gerado
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

  // Função para formatar a data por extenso
  const formatarDataPorExtenso = (data: Date) => {
    return format(data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };
  
  // Função para obter o texto completo do documento
  const getDocumentoTexto = (data: FormData): string => {
    return `${data.nome}, ${data.nacionalidade || "brasileiro(a)"}, natural de ${data.naturalidade}-${data.uf}, nascido(a) aos ${formatarDataPorExtenso(data.dataNascimento)}, filho(a) de ${data.filiacao}, profissão ${data.profissao}, estado civil ${data.estadoCivil}, portador(a) da Cédula de Identidade nº ${data.rg}-${data.orgaoExpedidor} e inscrito(a) no CPF/MF sob o nº ${data.cpf}, endereço eletrônico: ${data.email}, residente e domiciliado(a) na ${data.endereco};`;
  };

  // Função para copiar o texto para a área de transferência
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

  // Função para baixar o documento como PDF
  const baixarDocumento = () => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });
      
      // Configurações do documento
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      
      // Adicionar número de protocolo
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`Protocolo: ${protocoloNumero}`, 20, 20);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      
      // Obter o texto do documento
      const texto = document.getElementById('documento-texto')?.innerText || "";
      
      // Adicionar o texto ao PDF, com quebra de linhas automática
      const margemEsquerda = 20;
      const margemSuperior = 35; // Aumenta a margem superior para acomodar o protocolo
      const larguraUtil = doc.internal.pageSize.width - 40; // 20mm de margem em cada lado
      
      doc.text(texto, margemEsquerda, margemSuperior, { 
        maxWidth: larguraUtil,
        align: "justify"
      });
      
      // Nome do arquivo baseado no número de protocolo
      const nomeArquivo = `documento_${protocoloNumero.replace(/-/g, '_').toLowerCase()}.pdf`;
      
      // Salvar o PDF
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

  // Função para voltar à página anterior
  const voltarParaDocumento = () => {
    navigate('/cadastro/documento', { state: { formData } });
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
