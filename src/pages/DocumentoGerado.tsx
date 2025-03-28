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

const DocumentoGerado: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
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
    }
    
    const preventScroll = (e: Event) => {
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

  const gerarQualificacaoCompleta = () => {
    if (!formData) return "";
    
    let qualificacao = "";
    
    if (formData.estadoCivil === "Casado(a)" && formData.nomeConjuge) {
      const propertyRegime = formatPropertyRegime(formData.regimeBens || "");
      
      qualificacao = `${formData.nome}, ${formData.nacionalidade || "brasileiro"}, nascido na cidade de ${formData.naturalidade}-${formData.uf}, aos ${formatarData(formData.dataNascimento)}, filho de ${formData.filiacao}, profissão ${formData.profissao}, portador da Cédula de Identidade nº ${formData.rg}-${formData.orgaoExpedidor} e inscrito no CPF/MF sob o nº ${formData.cpf}, endereço eletrônico: ${formData.email}, casado, desde ${formatarData(formData.dataCasamento!)}, sob o regime da ${propertyRegime}, na vigência da Lei nº 6.515/77, com ${formData.nomeConjuge}, ${formData.nacionalidade || "brasileira"}, nascida na cidade de ${formData.naturalidadeConjuge}-${formData.ufConjuge}, aos ${formatarData(formData.dataNascimentoConjuge!)}, filha de ${formData.filiacaoConjuge}, profissão ${formData.profissaoConjuge}, portadora da Cédula de Identidade nº ${formData.rgConjuge}-${formData.orgaoExpedidorConjuge} e inscrita no CPF/MF sob o nº ${formData.cpfConjuge}, endereço eletrônico: ${formData.emailConjuge}, residentes e domiciliados na ${formData.endereco};`;
    } else {
      qualificacao = `${formData.nome}, ${formData.nacionalidade ? formData.nacionalidade : "brasileiro(a)"}, natural de ${formData.naturalidade}-${formData.uf}, nascido(a) aos ${formatarDataPorExtenso(formData.dataNascimento)}, filho(a) de ${formData.filiacao}, profissão ${formData.profissao}, estado civil ${formData.estadoCivil}, portador(a) da Cédula de Identidade nº ${formData.rg}-${formData.orgaoExpedidor} e inscrito(a) no CPF/MF sob o nº ${formData.cpf}, endereço eletrônico: ${formData.email}, residente e domiciliado(a) na ${formData.endereco};`;
    }
    
    if (qualificacao && qualificacao.trim() !== '') {
      sessionStorage.setItem('documentoGeradoTexto', qualificacao);
      console.log("Qualificação completa armazenada:", qualificacao);
    }
    
    return qualificacao;
  };

  useEffect(() => {
    if (formData) {
      const qualificacaoTexto = gerarQualificacaoCompleta();
      console.log("Texto de qualificação gerado no DocumentoGerado useEffect:", qualificacaoTexto);
    }
  }, [formData]);

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

  const gerarProtocolo = () => {
    const textoQualificacao = gerarQualificacaoCompleta();
    console.log("Texto de qualificação gerado antes de navegar:", textoQualificacao);
    navigate('/cadastro/protocolo', { state: { formData } });
  };

  const voltarParaRevisao = () => {
    navigate('/cadastro/revisar', { state: { formData } });
  };

  if (!formData) return null;

  const textoQualificacao = gerarQualificacaoCompleta();

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
                {textoQualificacao}
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
