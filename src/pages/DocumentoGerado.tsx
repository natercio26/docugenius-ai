
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Copy, FileText, Edit, Save } from "lucide-react";

import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { FormData } from "@/components/review/types";
import MinutaGerada from "@/components/MinutaGerada";

const DocumentoGerado: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  
  const formData = location.state?.formData as FormData;
  const [editedText, setEditedText] = useState<string>("");
  
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

  const formatarDataPorExtenso = (data: Date | string | undefined) => {
    if (!data) return "Não informada";
    
    try {
      // Se a data for uma string no formato DD/MM/YYYY, converte para Date
      if (typeof data === 'string') {
        if (data === '00/00/0000' || data === '') return "Não informada";
        
        const parts = data.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // Mês em JS começa em 0
          const year = parseInt(parts[2], 10);
          
          if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            const dateObj = new Date(year, month, day);
            // Verifica se a data é válida antes de formatar
            if (isNaN(dateObj.getTime())) {
              return "Não informada";
            }
            return format(dateObj, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
          }
        }
      }
      
      // Tenta formatar diretamente se for um objeto Date
      const dateObj = new Date(data);
      if (isNaN(dateObj.getTime())) {
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
      // Se a data for uma string no formato DD/MM/YYYY, retorna diretamente
      if (typeof data === 'string') {
        if (data === '00/00/0000' || data === '') return "Não informada";
        
        const parts = data.split('/');
        if (parts.length === 3) {
          return data;
        }
      }
      
      // Tenta formatar se for um objeto Date
      const dateObj = typeof data === 'string' ? new Date(data) : data;
      if (isNaN(dateObj.getTime())) {
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

  const gerarQualificacaoCompleta = () => {
    if (!formData) return "";
    
    let qualificacao = "";
    
    if (formData.estadoCivil === "Casado(a)" && formData.nomeConjuge) {
      const propertyRegime = formatPropertyRegime(formData.regimeBens || "");
      
      qualificacao = `${formData.nome}, ${formData.nacionalidade || "brasileiro"}, nascido na cidade de ${formData.naturalidade}-${formData.uf}, aos ${formatarData(formData.dataNascimento)}, filho de ${formData.filiacao}, profissão ${formData.profissao}, portador da Cédula de Identidade nº ${formData.rg}-${formData.orgaoExpedidor} e inscrito no CPF/MF sob o nº ${formData.cpf}, endereço eletrônico: ${formData.email || "não declarado"}, casado, desde ${formatarData(formData.dataCasamento!)}, sob o regime da ${propertyRegime}, na vigência da Lei nº 6.515/77, com ${formData.nomeConjuge}, ${formData.nacionalidade || "brasileira"}, nascida na cidade de ${formData.naturalidadeConjuge}-${formData.ufConjuge}, aos ${formatarData(formData.dataNascimentoConjuge!)}, filha de ${formData.filiacaoConjuge}, profissão ${formData.profissaoConjuge}, portadora da Cédula de Identidade nº ${formData.rgConjuge}-${formData.orgaoExpedidorConjuge} e inscrita no CPF/MF sob o nº ${formData.cpfConjuge}, endereço eletrônico: ${formData.emailConjuge || "não declarado"}, residentes e domiciliados na ${formData.endereco};`;
    } else {
      qualificacao = `${formData.nome}, ${formData.nacionalidade ? formData.nacionalidade : "brasileiro(a)"}, natural de ${formData.naturalidade}-${formData.uf}, nascido(a) aos ${formatarDataPorExtenso(formData.dataNascimento)}, filho(a) de ${formData.filiacao}, profissão ${formData.profissao}, estado civil ${formData.estadoCivil}, portador(a) da Cédula de Identidade nº ${formData.rg}-${formData.orgaoExpedidor} e inscrito(a) no CPF/MF sob o nº ${formData.cpf}, endereço eletrônico: ${formData.email || "não declarado"}, residente e domiciliado(a) na ${formData.endereco};`;
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
      setEditedText(qualificacaoTexto);
    }
  }, [formData]);

  const copiarTexto = () => {
    const texto = isEditing ? editedText : document.getElementById('documento-texto')?.innerText;
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

  const handleEdit = () => {
    setIsEditing(!isEditing);
  };

  const gerarProtocolo = () => {
    const textoQualificacao = isEditing ? editedText : gerarQualificacaoCompleta();
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
              {isEditing ? (
                <Textarea
                  className="w-full h-full min-h-[300px] font-mono text-sm"
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                />
              ) : (
                <p id="documento-texto" className="text-justify leading-relaxed whitespace-pre-line">
                  {editedText || textoQualificacao}
                </p>
              )}
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
                onClick={handleEdit}
                className="gap-2"
              >
                {isEditing ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                {isEditing ? 'Salvar' : 'Editar Texto'}
              </Button>
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
