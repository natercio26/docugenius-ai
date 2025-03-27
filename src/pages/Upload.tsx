
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

  // Função otimizada para processar documentos em etapas menores com yield/requestAnimationFrame
  const processFilesInSteps = useCallback(async (files: File[], docType: DraftType) => {
    if (isCancelled) return;
    
    // Função auxiliar para pausar entre operações pesadas
    const pauseExecution = (ms: number = 10): Promise<void> => 
      new Promise(resolve => setTimeout(resolve, ms));
    
    try {
      console.log("Iniciando o processamento dos arquivos:", files.map(f => f.name).join(', '));
      
      // Etapa 1: Extração de dados básicos - dividida em sub-etapas
      setProcessingStage('Extraindo dados básicos dos documentos...');
      setProcessingProgress(20);
      
      // Permita que a UI atualize antes de continuar
      await pauseExecution(50);
      
      let extractedData: ExtractedData = {};
      
      try {
        // Processa no máximo 2 arquivos por vez
        const batchSize = 2;
        let processedData: ExtractedData = {};
        
        for (let i = 0; i < files.length; i += batchSize) {
          if (isCancelled) return;
          
          // Extrai um lote de arquivos
          const fileBatch = files.slice(i, i + batchSize);
          setProcessingStage(`Analisando documento ${i+1} de ${files.length}...`);
          
          try {
            // Processar cada arquivo do lote com pequenos intervalos
            for (const file of fileBatch) {
              if (isCancelled) return;
              
              // Atualiza a mensagem para o arquivo atual
              setProcessingStage(`Analisando ${file.name}...`);
              
              // Extrair dados de um único arquivo
              const fileData = await extractDataFromFiles([file]);
              
              // Mesclar com dados já processados
              processedData = { ...processedData, ...fileData };
              
              // Pequena pausa para permitir atualizações da UI
              await pauseExecution(50);
              
              // Atualize o progresso proporcionalmente ao número de arquivos processados
              const progressIncrement = 20 / files.length;
              setProcessingProgress(prev => Math.min(40, prev + progressIncrement));
            }
          } catch (batchError) {
            console.error("Erro ao processar lote de arquivos:", batchError);
          }
          
          // Aguarda entre lotes para não bloquear a UI
          await pauseExecution(100);
        }
        
        extractedData = processedData;
        
        if ('error' in extractedData) {
          throw new Error(extractedData.error as string);
        }
        
        console.log("Extração de dados básicos concluída:", extractedData);
      } catch (extractionError) {
        console.error("Erro na extração de dados:", extractionError);
        toast({
          title: "Aviso na extração de dados",
          description: "Houve um problema ao extrair dados dos documentos. Usando dados mínimos.",
          variant: "default"
        });
        extractedData = { nome: "Participante não identificado" };
      }
      
      if (isCancelled) return;
      setProcessingProgress(50);
      
      // Atualização da UI antes da próxima etapa
      await pauseExecution(100);
      
      // Etapa 2: Identificar partes e papéis
      setProcessingStage('Identificando partes e papéis nos documentos...');
      
      let enhancedData: ExtractedData = extractedData;
      
      try {
        // Processa um arquivo por vez para identificação de partes
        for (let i = 0; i < files.length; i++) {
          if (isCancelled) return;
          
          const file = files[i];
          setProcessingStage(`Analisando papéis em ${file.name}...`);
          
          // Identificar partes em um único arquivo
          const partialEnhancedData = await identifyPartiesAndRoles([file], docType, extractedData);
          
          // Mesclar resultados
          enhancedData = { ...enhancedData, ...partialEnhancedData };
          
          // Atualizar progresso proporcionalmente
          const progressIncrement = 20 / files.length;
          setProcessingProgress(prev => Math.min(70, prev + progressIncrement));
          
          // Pausa entre arquivos
          await pauseExecution(50);
        }
        
        console.log("Identificação de partes e papéis concluída:", enhancedData);
      } catch (partyError) {
        console.error("Erro na identificação de partes:", partyError);
        toast({
          title: "Aviso",
          description: "Houve um problema ao identificar as partes nos documentos. Usando dados básicos.",
          variant: "default"
        });
      }
      
      if (isCancelled) return;
      setProcessingProgress(75);
      
      // Atualização da UI antes da próxima etapa
      await pauseExecution(100);
      
      // Etapa 3: Gerar conteúdo do documento
      setProcessingStage('Gerando conteúdo do documento...');
      
      let documentContent = "";
      
      // Usar requestAnimationFrame para geração de conteúdo (operação sincronizada)
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
      
      // Atualização da UI antes da próxima etapa
      await pauseExecution(100);
      
      // Etapa 4: Armazenar o rascunho
      setProcessingStage('Finalizando e salvando o documento...');
      
      try {
        // Cria uma versão sanitizada dos dados extraídos
        const sanitizedData = Object.fromEntries(
          Object.entries(enhancedData).map(([key, value]) => [
            key,
            typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
              ? value
              : String(value)
          ])
        );
        
        // Armazena o rascunho no sessionStorage em um requestAnimationFrame
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
      
      // Etapa final: Completar o processamento
      setStatus('success');
      setProcessingProgress(100);
      
      toast({
        title: "Minuta gerada com sucesso!",
        description: "Sua minuta foi gerada com base nos dados extraídos dos documentos.",
      });
      
      // Atraso leve para mostrar o sucesso antes de navegar
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
    
    // Limitar o número de arquivos a 5 para melhor desempenho
    if (files.length > 5) {
      toast({
        title: "Muitos arquivos",
        description: "Por favor, selecione no máximo 5 arquivos para processar de uma vez.",
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
    
    // Usa requestAnimationFrame para garantir que a UI seja atualizada antes de iniciar o processamento pesado
    requestAnimationFrame(() => {
      processFilesInSteps(files, documentType);
    });
  }, [toast, documentType, processFilesInSteps]);

  const handleDialogClose = useCallback(() => {
    // Se o usuário fechar o diálogo manualmente, cancelamos o processamento
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
      
      {/* Diálogo de Processamento com botão para fechar */}
      <Dialog open={processingDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent 
          className="sm:max-w-md" 
          onInteractOutside={(e) => {
            // Permitir que o usuário feche o diálogo se houver erro
            if (status === 'error') return;
            // Caso contrário, impedir o fechamento durante o processamento
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
          
          {/* Adicionar botão para cancelar o processamento */}
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
