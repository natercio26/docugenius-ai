import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DraftType, UploadStatus } from '@/types';
import ProtocoloSearch from '@/components/ProtocoloSearch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SingleFileUpload from '@/components/SingleFileUpload';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileCheck2, Download } from 'lucide-react';
import { extractDataFromFiles } from '@/utils/documentExtractor';
import ModelTemplateInput from '@/components/ModelTemplateInput';
import MinutaGerada from '@/components/MinutaGerada';
import { generateDocument } from '@/services/generateDocument';

const Upload: React.FC = () => {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [documentType, setDocumentType] = useState<DraftType>('Inventário');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [modelTemplate, setModelTemplate] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const documentTypes: DraftType[] = [
    'Inventário',
    'Escritura de Compra e Venda',
    'Doação',
    'União Estável',
    'Procuração',
    'Testamento',
    'Contrato de Aluguel',
    'Contrato Social',
    'Outro'
  ];

  const handleDocumentTypeChange = (value: string) => {
    setDocumentType(value as DraftType);
  };

  const handleFileChange = (files: File[]) => {
    setUploadedFiles(files);
  };

  const handleModelTemplateChange = (template: string) => {
    setModelTemplate(template);
  };

  const handleSubmitToApi = async () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, anexe pelo menos um documento para continuar.",
        variant: "destructive"
      });
      return;
    }

    if (!modelTemplate.trim()) {
      toast({
        title: "Modelo não fornecido",
        description: "Por favor, insira o modelo da minuta com as variáveis.",
        variant: "destructive"
      });
      return;
    }

    try {
      setStatus('uploading');
      setExtractedText(null);

      toast({
        title: "Processando documentos",
        description: "Seus documentos estão sendo enviados para a IA Documentum...",
      });

      const textoGerado = await generateDocument(uploadedFiles, modelTemplate);
      setExtractedText(textoGerado);
      setStatus('success');

      toast({
        title: "Minuta gerada com sucesso!",
        description: "O conteúdo foi extraído e exibido abaixo.",
      });

    } catch (error) {
      console.error("Erro ao processar documentos:", error);
      setStatus('error');

      toast({
        title: "Erro ao processar documentos",
        description: "Ocorreu um erro ao processar seus documentos. Por favor, tente novamente.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="page-container py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="heading-1 text-center mb-2">Nova Minuta</h1>
          <p className="text-muted-foreground text-center mb-8">
            Crie uma nova minuta carregando documentos ou usando um número de protocolo
          </p>

          <div className="mb-8 max-w-xs mx-auto">
            <label htmlFor="documentType" className="block text-sm font-medium mb-2">
              Tipo de Documento
            </label>
            <Select value={documentType} onValueChange={handleDocumentTypeChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o tipo de documento" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto mb-6">
              <TabsTrigger value="upload">Upload de Documentos</TabsTrigger>
              <TabsTrigger value="protocolo">Número de Protocolo</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-4">
              <div className="bg-card border rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-medium mb-4">Anexar Documentos</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Selecione os documentos necessários para gerar sua minuta. Você pode selecionar múltiplos arquivos ao mesmo tempo.
                </p>

                <SingleFileUpload
                  id="documentos"
                  label="Documentos"
                  onFileChange={handleFileChange}
                  multiple={true}
                />

                <div className="mt-6">
                  <ModelTemplateInput 
                    value={modelTemplate} 
                    onChange={handleModelTemplateChange} 
                  />
                </div>

                <div className="mt-6 flex justify-center gap-4">
                  <Button 
                    onClick={handleSubmitToApi} 
                    disabled={status === 'uploading'}
                    className="min-w-[200px] gap-2 bg-accent text-accent-foreground hover:bg-accent/80"
                  >
                    {status === 'uploading' ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin h-4 w-4 border-2 border-current rounded-full border-t-transparent"></div>
                        <span>Enviando para API...</span>
                      </div>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        <span>Gerar Minuta com IA</span>
                      </>
                    )}
                  </Button>
                </div>

                {extractedText && status === 'success' && (
                  <MinutaGerada 
                    textContent={extractedText}
                    fileName={`minuta_${documentType.toLowerCase().replace(' ', '_')}.txt`}
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="protocolo" className="mt-4">
              <ProtocoloSearch documentType={documentType} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Upload;
