import React, { useState, useCallback } from 'react';
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
  const [isCancelled, setIsCancelled] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const processFilesInSteps = useCallback(async (files: File[], docType: DraftType) => {
    if (isCancelled) return;
    
    const pauseExecution = (ms: number = 10): Promise<void> => 
      new Promise(resolve => setTimeout(resolve, ms));
    
    try {
      console.log("Iniciando o processamento dos arquivos:", files.map(f => f.name).join(', '));
      
      setProcessingStage('Extraindo dados básicos dos documentos...');
      setProcessingProgress(15);
      
      await pauseExecution(50);
      
      let extractedData: ExtractedData = {};
      
      try {
        const batchSize = 3;
        
        for (let i = 0; i < files.length; i += batchSize) {
          if (isCancelled) return;
          
          const fileBatch = files.slice(i, i + batchSize);
          setProcessingStage(`Analisando documentos ${i+1} até ${Math.min(i+batchSize, files.length)} de ${files.length}...`);
          
          try {
            const batchData = await extractDataFromFiles(fileBatch);
            
            Object.entries(batchData).forEach(([key, value]) => {
              if (!extractedData[key] || 
                  extractedData[key] === 'N/A' || 
                  extractedData[key] === '=====' || 
                  extractedData[key] === 'Não identificado') {
                extractedData[key] = value;
              }
            });
            
            await pauseExecution(50);
            
            const progressIncrement = 20 / Math.ceil(files.length / batchSize);
            setProcessingProgress(prev => Math.min(35, prev + progressIncrement));
          } catch (batchError) {
            console.error("Erro ao processar lote de arquivos:", batchError);
          }
          
          await pauseExecution(100);
        }
        
        if ('error' in extractedData) {
          throw new Error(extractedData.error as string);
        }
        
        console.log("Extração de dados básicos concluída:", extractedData);
      } catch (extractionError) {
        console.error("Erro na extração de dados:", extractionError);
        toast({
          title: "Aviso na extração de dados",
          description: "Houve um problema ao extrair dados dos documentos. Tentando métodos alternativos.",
          variant: "default"
        });
      }
      
      if (isCancelled) return;
      setProcessingProgress(40);
      
      await pauseExecution(100);
      
      setProcessingStage('Identificando partes e papéis nos documentos...');
      
      let enhancedData: ExtractedData = extractedData;
      
      try {
        setProcessingStage(`Analisando minuciosamente todos os documentos para identificar partes...`);
        
        const partialEnhancedData = await identifyPartiesAndRoles(files, docType, extractedData);
        
        Object.entries(partialEnhancedData).forEach(([key, value]) => {
          if (value && 
              value !== 'N/A' && 
              value !== '=====' && 
              value !== 'Não identificado' && 
              value !== 'Não identificado(a)' && 
              value !== 'Data não identificada' && 
              value !== 'Valor não informado') {
            enhancedData[key] = value;
          }
        });
        
        console.log("Identificação de partes e papéis concluída:", enhancedData);
        
        if (docType === 'Inventário') {
          if (!enhancedData['falecido'] || enhancedData['falecido'] === 'Não identificado') {
            const falecidoPattern = /(?:falec[ido|eu|imento]|de cujus|óbito de|espólio de)[\s\S]{1,100}([A-Z][a-zÀ-ÿ]+(?:\s+[A-Z][a-zÀ-ÿ]+){1,5})/i;
            
            for (const file of files) {
              try {
                const reader = new FileReader();
                const fileContent = await new Promise<string>((resolve) => {
                  reader.onload = () => resolve(reader.result as string);
                  reader.onerror = () => resolve('');
                  reader.readAsText(file);
                });
                
                const falecidoMatch = fileContent.match(falecidoPattern);
                if (falecidoMatch && falecidoMatch[1]) {
                  enhancedData['falecido'] = falecidoMatch[1].trim();
                  break;
                }
              } catch (error) {
                console.warn("Erro ao ler arquivo para busca adicional:", error);
              }
            }
          }
        }
      } catch (partyError) {
        console.error("Erro na identificação de partes:", partyError);
        toast({
          title: "Aviso",
          description: "Houve um problema ao identificar as partes nos documentos. Usando dados já extraídos.",
          variant: "default"
        });
      }
      
      if (isCancelled) return;
      setProcessingProgress(70);
      
      await pauseExecution(100);
      
      setProcessingStage('Refinando dados extraídos...');
      
      const missingCriticalData = docType === 'Inventário' && 
        (!enhancedData['falecido'] || 
         enhancedData['falecido'] === 'Não identificado' ||
         !enhancedData['herdeiro1'] || 
         enhancedData['herdeiro1'] === 'Não identificado(a)');
      
      if (missingCriticalData) {
        try {
          setProcessingStage('Realizando análise adicional para dados críticos...');
          
          if (!enhancedData['falecido'] || enhancedData['falecido'] === 'Não identificado') {
            enhancedData['falecido'] = "Autor da Herança";
          }
          
          if (!enhancedData['conjuge'] || enhancedData['conjuge'] === 'Não identificado(a)') {
            enhancedData['conjuge'] = "Cônjuge Sobrevivente";
          }
          
          if (!enhancedData['herdeiro1'] || enhancedData['herdeiro1'] === 'Não identificado(a)') {
            enhancedData['herdeiro1'] = "Herdeiro Legítimo";
          }
          
          if (!enhancedData['inventariante'] || enhancedData['inventariante'] === 'Não identificado(a)') {
            enhancedData['inventariante'] = enhancedData['conjuge'] !== 'Não identificado(a)' ? 
              enhancedData['conjuge'] : "Inventariante Nomeado";
          }
        } catch (fallbackError) {
          console.error("Erro ao gerar dados de fallback:", fallbackError);
        }
      }
      
      if (isCancelled) return;
      setProcessingProgress(80);
      
      await pauseExecution(100);
      
      setProcessingStage('Gerando conteúdo do documento...');
      
      let documentContent = "";
      
      await new Promise<void>(resolve => {
        requestAnimationFrame(() => {
          try {
            documentContent = generateDocumentContent(docType, enhancedData);
            console.log("Conteúdo do documento gerado com sucesso");
            resolve();
          } catch (contentError) {
            console.error("Erro ao gerar conteúdo do documento:", contentError);
            documentContent = `<h1>${docType}</h1><p>Não foi possível gerar o conteúdo completo devido a um erro no processamento.</p>`;
            toast({
              title: "Erro ao gerar documento",
              description: "Houve um problema ao gerar o conteúdo do documento. Um modelo básico será usado.",
              variant: "default"
            });
            resolve();
          }
        });
      });
      
      if (isCancelled) return;
      setProcessingProgress(90);
      
      await pauseExecution(100);
      
      setProcessingStage('Finalizando e salvando o documento...');
      
      try {
        const sanitizedData = Object.fromEntries(
          Object.entries(enhancedData).map(([key, value]) => [
            key,
            typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
              ? value
              : String(value)
          ])
        );
        
        await new Promise<void>(resolve => {
          requestAnimationFrame(() => {
            try {
              sessionStorage.setItem('generatedDraft', JSON.stringify({
                id: 'new',
                title: `${docType} - Gerado em ${new Date().toLocaleDateString('pt-BR')}`,
                type: docType,
                content: documentContent,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                extractedData: sanitizedData
              }));
              resolve();
            } catch (error) {
              console.error("Erro ao armazenar rascunho:", error);
              resolve();
            }
          });
        });
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
      
      if (isCancelled) return;
      
      setStatus('success');
      setProcessingProgress(100);
      
      toast({
        title: "Minuta gerada com sucesso!",
        description: "Sua minuta foi gerada com base nos dados extraídos dos documentos.",
      });
      
      await pauseExecution(800);
      
      if (!isCancelled) {
        setProcessingDialogOpen(false);
        navigate('/view/new');
      }
      
    } catch (error) {
      console.error('Erro ao processar arquivos:', error);
      if (!isCancelled) {
        setStatus('error');
        setProcessingDialogOpen(false);
        
        toast({
          title: "Erro ao processar documentos",
          description: "Ocorreu um erro inesperado. Por favor, tente novamente.",
          variant: "destructive"
        });
      }
    }
  }, [navigate, toast, isCancelled]);

  const handleUploadComplete = useCallback((files: File[]) => {
    if (!files || files.length === 0) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione pelo menos um arquivo para processar.",
        variant: "destructive"
      });
      return;
    }
    
    if (files.length > 10) {
      toast({
        title: "Muitos arquivos",
        description: "Por favor, selecione no máximo 10 arquivos para processar de uma vez.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedFiles(files);
    setStatus('uploading');
    setProcessingDialogOpen(true);
    setProcessingProgress(10);
    setProcessingStage('Iniciando processamento...');
    setIsCancelled(false);
    
    requestAnimationFrame(() => {
      processFilesInSteps(files, documentType);
    });
  }, [toast, documentType, processFilesInSteps]);

  const handleDialogClose = useCallback(() => {
    setIsCancelled(true);
    setProcessingDialogOpen(false);
    setStatus('idle');
    
    toast({
      title: "Processamento cancelado",
      description: "O processamento dos documentos foi cancelado.",
      variant: "default"
    });
  }, [toast]);

  const handleTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as DraftType;
    setDocumentType(newType);
    localStorage.setItem('selectedDocumentType', newType);
  }, []);

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
      
      <Dialog open={processingDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent 
          className="sm:max-w-md" 
          onInteractOutside={(e) => {
            if (status === 'error') return;
            e.preventDefault();
          }}
        >
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
          
          {status !== 'success' && status !== 'error' && (
            <div className="flex justify-center mt-4">
              <button 
                onClick={handleDialogClose}
                className="px-4 py-2 text-sm font-medium text-muted-foreground bg-secondary rounded-md hover:bg-secondary/80"
              >
                Cancelar Processamento
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Upload;
