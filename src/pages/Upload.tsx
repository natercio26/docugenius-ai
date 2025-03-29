
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
import { ScrollArea } from "@/components/ui/scroll-area";
import SingleFileUpload from '@/components/SingleFileUpload';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileCheck2 } from 'lucide-react';

const Upload: React.FC = () => {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [documentType, setDocumentType] = useState<DraftType>('Inventário');
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File | null>>({});
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

  const documentFields = [
    { id: 'peticao', name: 'Petição' },
    { id: 'processoInventario', name: 'Processo do Inventário' },
    { id: 'iptu', name: 'IPTU' },
    { id: 'extratoBancario', name: 'Extrato Bancário' },
    { id: 'escrituraCompraVenda', name: 'Escritura de Compra e Venda' },
    { id: 'dossie', name: 'Dossiê' },
    { id: 'cnd', name: 'CND' },
    { id: 'pgfn', name: 'PGFN' },
    { id: 'trt', name: 'TRT' },
    { id: 'trf', name: 'TRF' },
    { id: 'tst', name: 'TST' },
    { id: 'certidoesMunicipais', name: 'Certidões Municipais' },
    { id: 'registroImovel', name: 'Registro do Imóvel' },
    { id: 'certidaoDebitos', name: 'Certidão Positiva de Débitos com Efeito de Negativa - GDF' },
    { id: 'pesquisaTestamentos', name: 'Pesquisa de Testamentos' },
    { id: 'uniaoEstavel', name: 'União Estável' },
    { id: 'certidaoObitoInventariante', name: 'Certidão de Óbito do Inventariante' },
    { id: 'cadastroInventariante', name: 'Cadastro do Inventariante' },
    { id: 'cadastroViuvo', name: 'Cadastro do viúvo(a)' },
    { id: 'cadastroHerdeiros', name: 'Cadastro dos herdeiros' }
  ];

  const handleDocumentTypeChange = (value: string) => {
    setDocumentType(value as DraftType);
  };

  const handleFileChange = (fieldId: string, file: File | null) => {
    setUploadedFiles(prev => ({
      ...prev,
      [fieldId]: file
    }));
  };

  const handleSubmit = () => {
    // Check if at least one file has been uploaded
    const hasFiles = Object.values(uploadedFiles).some(file => file !== null);
    
    if (!hasFiles) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, anexe pelo menos um documento para continuar.",
        variant: "destructive"
      });
      return;
    }
    
    // Convert the object to an array of files, filtering out null values
    const files = Object.values(uploadedFiles).filter(file => file !== null) as File[];
    
    // Simulate processing
    setStatus('uploading');
    
    toast({
      title: "Analisando documentos",
      description: "Seus documentos estão sendo processados para gerar a minuta.",
    });
    
    setTimeout(() => {
      setStatus('processing');
      
      setTimeout(() => {
        setStatus('success');
        
        // Generate a unique ID for the draft
        const draftId = Math.random().toString(36).substring(2, 9);
        
        const newDraft = {
          id: draftId,
          title: `Minuta - ${documentType}`,
          type: documentType,
          content: '', // This would be filled with the actual content extracted from the files
          createdAt: new Date(),
          updatedAt: new Date(),
          extractedData: {}, // Add the extracted data
          uploadedDocuments: Object.entries(uploadedFiles)
            .filter(([_, file]) => file !== null)
            .map(([key, file]) => ({
              type: documentFields.find(field => field.id === key)?.name || key,
              filename: file?.name || ''
            }))
        };
        
        // Store draft in session storage
        sessionStorage.setItem('generatedDraft', JSON.stringify(newDraft));
        
        toast({
          title: "Minuta gerada com sucesso!",
          description: "Você será redirecionado para visualizar a minuta.",
        });
        
        // Navigate to the draft view page
        setTimeout(() => {
          navigate(`/view/new`);
        }, 1000);
        
      }, 3000);
    }, 2000);
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
              <div className="bg-card border rounded-lg shadow-sm p-4">
                <h2 className="text-lg font-medium mb-4">Anexar Documentos</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Selecione os documentos necessários para gerar sua minuta. Cada documento deve ser anexado no campo correspondente.
                </p>
                
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {documentFields.map((field) => (
                      <SingleFileUpload
                        key={field.id}
                        id={field.id}
                        label={field.name}
                        onFileChange={(file) => handleFileChange(field.id, file)}
                      />
                    ))}
                  </div>
                </ScrollArea>
                
                <div className="mt-6 flex justify-center">
                  <Button 
                    onClick={handleSubmit} 
                    disabled={status !== 'idle'}
                    className="min-w-[200px] gap-2"
                  >
                    {status === 'idle' ? (
                      <>
                        <FileCheck2 className="h-4 w-4" />
                        Gerar Minuta com IA
                      </>
                    ) : status === 'uploading' ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin h-4 w-4 border-2 border-current rounded-full border-t-transparent"></div>
                        <span>Carregando arquivos...</span>
                      </div>
                    ) : status === 'processing' ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin h-4 w-4 border-2 border-current rounded-full border-t-transparent"></div>
                        <span>Processando documentos...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4" />
                        <span>Minuta Gerada com Sucesso!</span>
                      </div>
                    )}
                  </Button>
                </div>
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
