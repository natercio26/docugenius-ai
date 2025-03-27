
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import FileUpload from '@/components/FileUpload';
import { DraftType, UploadStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { extractDataFromFiles, generateDocumentContent } from '@/utils/documentExtractor';
import { identifyPartiesAndRoles } from '@/utils/partyIdentifier';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

interface ExtractedData {
  [key: string]: any;
  nome?: string;
}

const Upload: React.FC = () => {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [documentType, setDocumentType] = useState<DraftType>(() => {
    const savedType = localStorage.getItem('selectedDocumentType');
    return savedType as DraftType || 'Escritura de Compra e Venda';
  });
  const [processingDialogOpen, setProcessingDialogOpen] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState<string>('');
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleUploadComplete = async (files: File[]) => {
    if (!files || files.length === 0) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione pelo menos um arquivo para processar.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedFiles(files);
    setStatus('uploading');
    setProcessingDialogOpen(true);
    setProcessingProgress(10);
    setProcessingStage('Iniciando processamento...');
    
    // Use a timeout to allow the UI to update before starting the processing
    setTimeout(() => processFiles(files, documentType), 300);
  };

  const processFiles = async (files: File[], docType: DraftType) => {
    try {
      console.log("Iniciando o processamento dos arquivos:", files.map(f => f.name).join(', '));
      
      // Extract basic data
      setProcessingStage('Extraindo dados básicos dos documentos...');
      setProcessingProgress(30);
      
      let extractedData: ExtractedData = {};
      
      try {
        extractedData = await extractDataFromFiles(files);
        
        if ('error' in extractedData) {
          throw new Error(extractedData.error as string);
        }
        
        console.log("Extração de dados básicos concluída:", extractedData);
        setProcessingProgress(50);
      } catch (extractionError) {
        console.error("Erro na extração de dados:", extractionError);
        toast({
          title: "Erro na extração de dados",
          description: "Houve um problema ao extrair dados dos documentos. Usando dados mínimos.",
          variant: "default"
        });
        extractedData = { nome: "Participante não identificado" };
      }
      
      // Identify parties and roles
      setProcessingStage('Identificando partes e papéis nos documentos...');
      setProcessingProgress(70);
      
      let enhancedData: ExtractedData = extractedData;
      
      try {
        enhancedData = await identifyPartiesAndRoles(files, docType, extractedData);
        console.log("Identificação de partes e papéis concluída:", enhancedData);
      } catch (partyError) {
        console.error("Erro na identificação de partes:", partyError);
        toast({
          title: "Aviso",
          description: "Houve um problema ao identificar as partes nos documentos. Usando dados básicos.",
          variant: "default"
        });
      }
      
      // Generate document content
      setProcessingStage('Gerando conteúdo do documento...');
      setProcessingProgress(85);
      
      let documentContent = "";
      
      try {
        documentContent = generateDocumentContent(docType, enhancedData);
        console.log("Conteúdo do documento gerado com sucesso");
      } catch (contentError) {
        console.error("Erro ao gerar conteúdo do documento:", contentError);
        documentContent = `<h1>${docType}</h1><p>Não foi possível gerar o conteúdo completo devido a um erro no processamento.</p>`;
        toast({
          title: "Erro ao gerar documento",
          description: "Houve um problema ao gerar o conteúdo do documento. Um modelo básico será usado.",
          variant: "default"
        });
      }
      
      // Store the draft
      setProcessingStage('Finalizando e salvando o documento...');
      setProcessingProgress(95);
      
      try {
        // Create a sanitized version of extractedData that can be safely serialized
        const sanitizedData = Object.fromEntries(
          Object.entries(enhancedData).map(([key, value]) => [
            key,
            typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
              ? value
              : String(value)
          ])
        );
        
        // Store the draft in session storage
        sessionStorage.setItem('generatedDraft', JSON.stringify({
          id: 'new',
          title: `${docType} - Gerado em ${new Date().toLocaleDateString('pt-BR')}`,
          type: docType,
          content: documentContent,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          extractedData: sanitizedData
        }));
      } catch (storageError) {
        console.error("Erro ao armazenar o rascunho:", storageError);
        toast({
          title: "Erro ao salvar",
          description: "Não foi possível salvar o documento. Por favor, tente novamente.",
          variant: "destructive"
        });
        setStatus('error');
        setProcessingDialogOpen(false);
        return;
      }
      
      // Complete processing
      setStatus('success');
      setProcessingProgress(100);
      
      toast({
        title: "Minuta gerada com sucesso!",
        description: "Sua minuta foi gerada com base nos dados extraídos dos documentos.",
      });
      
      // Add a slight delay to show success before navigating
      setTimeout(() => {
        setProcessingDialogOpen(false);
        navigate('/view/new');
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao processar arquivos:', error);
      setStatus('error');
      setProcessingDialogOpen(false);
      
      toast({
        title: "Erro ao processar documentos",
        description: "Ocorreu um erro inesperado. Por favor, tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as DraftType;
    setDocumentType(newType);
    localStorage.setItem('selectedDocumentType', newType);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="page-container">
        <div className="max-w-3xl mx-auto text-center mb-12 animate-slide-in">
          <h1 className="heading-1 mb-4">Anexe os documentos relacionados</h1>
          <p className="text-muted-foreground">
            Faça upload dos arquivos necessários para gerar sua minuta automaticamente com IA.
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto mb-8 animate-scale-in" style={{ animationDelay: '50ms' }}>
          <div className="glass rounded-lg p-6">
            <label htmlFor="documentType" className="block text-sm font-medium mb-2">
              Tipo de Documento a Gerar
            </label>
            <select
              id="documentType"
              value={documentType}
              onChange={handleTypeChange}
              className="input-field mb-4"
              disabled={status === 'uploading' || status === 'processing'}
            >
              <option value="Escritura de Compra e Venda">Escritura de Compra e Venda</option>
              <option value="Inventário">Inventário</option>
              <option value="Doação">Doação</option>
              <option value="União Estável">União Estável</option>
              <option value="Procuração">Procuração</option>
              <option value="Testamento">Testamento</option>
              <option value="Outro">Outro</option>
            </select>
            
            <p className="text-sm text-muted-foreground mb-4">
              Selecione o tipo de documento que deseja gerar com base nos arquivos anexados.
            </p>
          </div>
        </div>
        
        <div className="animate-scale-in" style={{ animationDelay: '100ms' }}>
          <FileUpload onUploadComplete={handleUploadComplete} status={status} />
        </div>
      </main>
      
      {/* Processing Dialog */}
      <Dialog open={processingDialogOpen} onOpenChange={setProcessingDialogOpen}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Processando Documentos</DialogTitle>
            <DialogDescription>
              Estamos analisando seus documentos e extraindo informações relevantes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Progress value={processingProgress} className="h-2" />
            <p className="mt-3 text-sm text-center">{processingStage}</p>
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            {status === 'success' ? (
              <p className="text-primary">Processamento concluído com sucesso!</p>
            ) : status === 'error' ? (
              <p className="text-destructive">Erro no processamento. Por favor, tente novamente.</p>
            ) : (
              <p>Este processo pode levar alguns segundos, dependendo do tamanho e complexidade dos documentos.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Upload;
