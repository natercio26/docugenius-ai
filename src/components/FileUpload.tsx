
import React, { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Upload, File, X, Trash2, AlertTriangle, Search } from 'lucide-react';
import { UploadStatus, AcceptedFileTypes } from '@/types';
import StatusIndicator from './StatusIndicator';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface FileUploadProps {
  onUploadComplete: (files: File[]) => void;
  status: UploadStatus;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete, status }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [validating, setValidating] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const { toast } = useToast();

  const FILE_SIZE_LIMIT = 50 * 1024 * 1024;
  const MAX_FILE_LIMIT = 100;

  const acceptedTypes: AcceptedFileTypes[] = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png'
  ];

  const isAcceptedFileType = (file: File): boolean => {
    if (!file.type) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      return extension === 'pdf' || extension === 'docx' || 
             extension === 'jpg' || extension === 'jpeg' || extension === 'png';
    }
    
    const isAcceptedMimetype = acceptedTypes.includes(file.type as AcceptedFileTypes);
    
    if (!isAcceptedMimetype) {
      const filename = file.name.toLowerCase();
      return filename.endsWith('.pdf') || 
             filename.endsWith('.docx') || 
             filename.endsWith('.jpg') || 
             filename.endsWith('.jpeg') || 
             filename.endsWith('.png');
    }
    
    return true;
  };

  const handleFileChange = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    if (selectedFiles.length > MAX_FILE_LIMIT) {
      toast({
        title: "Limite de arquivos excedido",
        description: `Por favor, selecione no máximo ${MAX_FILE_LIMIT} arquivos por vez.`,
        variant: "destructive"
      });
      return;
    }
    
    setValidating(true);
    
    const fileArray = Array.from(selectedFiles);
    
    const batchSize = 3;
    const batches = [];
    for (let i = 0; i < fileArray.length; i += batchSize) {
      batches.push(fileArray.slice(i, i + batchSize));
    }
    
    const processBatch = (batchIndex: number, accumulator: File[]) => {
      if (batchIndex >= batches.length) {
        if (accumulator.length > 0) {
          setFiles(prev => [...prev, ...accumulator]);
        }
        setValidating(false);
        return;
      }
      
      const currentBatch = batches[batchIndex];
      
      const processFiles = (fileIndex: number, batchAccumulator: File[]) => {
        if (fileIndex >= currentBatch.length) {
          setTimeout(() => {
            processBatch(batchIndex + 1, [...accumulator, ...batchAccumulator]);
          }, 100);
          return;
        }
        
        const file = currentBatch[fileIndex];
        
        if (file.size > FILE_SIZE_LIMIT) {
          toast({
            title: "Arquivo muito grande",
            description: `O arquivo ${file.name} excede o limite de 50MB.`,
            variant: "destructive"
          });
          setTimeout(() => processFiles(fileIndex + 1, batchAccumulator), 10);
          return;
        }
        
        setTimeout(() => {
          const isAccepted = isAcceptedFileType(file);
          if (!isAccepted) {
            toast({
              title: "Formato não suportado",
              description: `O arquivo ${file.name} não é suportado. Por favor, use PDF, DOCX, JPG ou PNG.`,
              variant: "destructive"
            });
            processFiles(fileIndex + 1, batchAccumulator);
            return;
          }
          
          batchAccumulator.push(file);
          
          setTimeout(() => processFiles(fileIndex + 1, batchAccumulator), 10);
        }, 5);
      };
      
      processFiles(0, []);
    };
    
    requestAnimationFrame(() => {
      try {
        processBatch(0, []);
      } catch (error) {
        console.error("Erro ao validar arquivos:", error);
        toast({
          title: "Erro ao processar arquivos",
          description: "Ocorreu um erro ao validar os arquivos selecionados.",
          variant: "destructive"
        });
        setValidating(false);
      }
    });
  }, [toast, FILE_SIZE_LIMIT, isAcceptedFileType, MAX_FILE_LIMIT]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (status === 'uploading' || status === 'processing' || validating) {
      return;
    }
    
    handleFileChange(e.dataTransfer.files);
  }, [handleFileChange, status, validating]);

  const handleSubmit = useCallback(() => {
    if (files.length === 0) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione ao menos um arquivo para continuar.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Analisando documentos",
      description: "Seus documentos estão sendo processados para identificar partes, herdeiros e outras informações importantes.",
    });
    
    requestAnimationFrame(() => {
      onUploadComplete(files);
    });
  }, [files, onUploadComplete, toast]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const getFileIcon = (type: string) => {
    if (type.includes('pdf') || type === '' && files[0]?.name.endsWith('.pdf')) return 'PDF';
    if (type.includes('document') || type === '' && files[0]?.name.endsWith('.docx')) return 'DOC';
    if (type.includes('image') || 
        type === '' && (files[0]?.name.endsWith('.jpg') || files[0]?.name.endsWith('.jpeg') || files[0]?.name.endsWith('.png'))) 
      return 'IMG';
    return 'FILE';
  };

  const isDisabled = status === 'uploading' || status === 'processing' || validating;

  const handleConfirmClearFiles = useCallback(() => {
    setFiles([]);
    setClearDialogOpen(false);
    toast({
      title: "Arquivos Limpos",
      description: "Todos os arquivos selecionados foram removidos.",
      variant: "default"
    });
  }, [toast]);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 transition-all duration-300 ${
          dragActive 
          ? 'border-accent bg-accent/5' 
          : 'border-muted-foreground/20 hover:border-muted-foreground/30'
        } ${isDisabled ? 'opacity-70 cursor-not-allowed' : ''}`}
        onDragEnter={isDisabled ? undefined : handleDrag}
        onDragLeave={isDisabled ? undefined : handleDrag}
        onDragOver={isDisabled ? undefined : handleDrag}
        onDrop={isDisabled ? undefined : handleDrop}
      >
        <input
          type="file"
          className={`absolute inset-0 w-full h-full opacity-0 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'} z-10`}
          onChange={(e) => !isDisabled && handleFileChange(e.target.files)}
          multiple
          accept=".pdf,.docx,.jpg,.jpeg,.png"
          disabled={isDisabled}
        />
        
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Upload className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-1">Arraste arquivos ou clique para selecionar</h3>
          <p className="text-sm text-muted-foreground">
            Suporte para PDF, DOCX, JPG e PNG
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Máximo 50MB por arquivo
          </p>
          
          {validating && (
            <div className="mt-4 flex items-center gap-2 text-muted-foreground">
              <div className="animate-spin h-4 w-4 border-2 border-current rounded-full border-t-transparent"></div>
              <span className="text-sm">Validando arquivos...</span>
            </div>
          )}
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <h4 className="font-medium mb-2">Arquivos selecionados:</h4>
          <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                size="sm" 
                disabled={isDisabled}
                className={`flex items-center gap-2 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Trash2 className="h-4 w-4" />
                Limpar Arquivos
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Essa ação irá remover todos os arquivos selecionados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmClearFiles} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div 
              key={`${file.name}-${index}`} 
              className="flex items-center justify-between bg-secondary rounded-md p-3"
            >
              <div className="flex items-center">
                <div className="bg-accent/10 text-accent font-medium text-xs rounded-md px-2 py-1 mr-3">
                  {getFileIcon(file.type)}
                </div>
                <span className="text-sm truncate max-w-[300px]">{file.name}</span>
              </div>
              <button 
                onClick={() => !isDisabled && removeFile(index)}
                className={`text-muted-foreground hover:text-destructive ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isDisabled}
                aria-label="Remover arquivo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-8 flex justify-center">
        <button
          className={`button-primary min-w-[200px] flex items-center justify-center space-x-2 py-2.5 ${
            isDisabled || files.length === 0 ? 'opacity-70 cursor-not-allowed' : ''
          }`}
          onClick={handleSubmit}
          disabled={files.length === 0 || isDisabled}
        >
          {status === 'idle' && !validating && (
            <>
              <Search className="h-4 w-4 mr-2" />
              <span>Gerar Minuta com IA</span>
            </>
          )}
          {validating && (
            <div className="flex items-center space-x-2">
              <div className="animate-spin h-4 w-4 border-2 border-current rounded-full border-t-transparent"></div>
              <span>Validando arquivos...</span>
            </div>
          )}
          {(status === 'uploading' || status === 'processing') && !validating && (
            <StatusIndicator status={status} />
          )}
          {status === 'success' && !validating && <span>Minuta Gerada com Sucesso!</span>}
          {status === 'error' && !validating && (
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Erro ao Processar! Tente Novamente</span>
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default FileUpload;
