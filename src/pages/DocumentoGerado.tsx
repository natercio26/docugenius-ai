
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Copy, FileText } from "lucide-react";

import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

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

const DocumentoGerado: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
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
    }
    
    // Prevenir rolagem automática da página
    const preventScroll = (e: Event) => {
      // Prevenir a rolagem automática apenas se não for iniciada pelo usuário
      if (!e.isTrusted) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('scroll', preventScroll, { passive: false });
    
    return () => {
      document.removeEventListener('scroll', preventScroll);
    };
  }, [formData, navigate, toast]);

  // Função para formatar a data por extenso
  const formatarDataPorExtenso = (data: Date) => {
    return format(data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  // Função para gerar a qualificação completa da pessoa
  const gerarQualificacaoCompleta = () => {
    if (!formData) return "";
    
    let qualificacao = `${formData.nome}, `;
    
    // Adicionar nacionalidade se existir, ou padrão 'brasileiro(a)'
    qualificacao += formData.nacionalidade ? `${formData.nacionalidade}, ` : "brasileiro(a), ";
    
    qualificacao += `natural de ${formData.naturalidade}-${formData.uf}, nascido(a) aos ${formatarDataPorExtenso(formData.dataNascimento)}, filho(a) de ${formData.filiacao}, profissão ${formData.profissao}, estado civil ${formData.estadoCivil}, portador(a) da Cédula de Identidade nº ${formData.rg}-${formData.orgaoExpedidor} e inscrito(a) no CPF/MF sob o nº ${formData.cpf}, endereço eletrônico: ${formData.email}, residente e domiciliado(a) na ${formData.endereco};`;
    
    // Armazenar a qualificação no sessionStorage para uso na minuta de inventário
    sessionStorage.setItem('documentoGeradoTexto', qualificacao);
    console.log("Qualificação completa armazenada:", qualificacao);
    
    return qualificacao;
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

  // Função para gerar protocolo
  const gerarProtocolo = () => {
    // Armazenar a qualificação no sessionStorage antes de navegar
    gerarQualificacaoCompleta();
    navigate('/cadastro/protocolo', { state: { formData } });
  };

  // Função para voltar à página de revisão
  const voltarParaRevisao = () => {
    navigate('/cadastro/revisar', { state: { formData } });
  };

  if (!formData) return null;

  return (
    <>
      <Navbar />
      <div className="container py-8 max-w-4xl mx-auto">
        <Card className="shadow-md">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-2xl font-serif">Documento Gerado</CardTitle>
          </CardHeader>
          <CardContent className="py-6">
            <ScrollArea className="bg-white p-6 border rounded-md h-[50vh]">
              <p id="documento-texto" className="text-justify leading-relaxed whitespace-pre-line">
                {gerarQualificacaoCompleta()}
              </p>
            </ScrollArea>
          </CardContent>
          <CardFooter className="flex justify-between border-t bg-slate-50 p-4">
            <Button 
              variant="outline" 
              onClick={voltarParaRevisao}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para Revisão
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
                onClick={gerarProtocolo}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Gerar N.º de Protocolo
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  );
};

export default DocumentoGerado;
