
import React, { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Upload, File, X, AlertTriangle } from 'lucide-react';
import { UploadStatus, AcceptedFileTypes } from '@/types';
import StatusIndicator from './StatusIndicator';

interface FileUploadProps {
  onUploadComplete: (files: File[]) => void;
  status: UploadStatus;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete, status }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [validating, setValidating] = useState(false);
  const { toast } = useToast();

  // Aumentado o limite de tamanho para 50MB (50 * 1024 * 1024 bytes)
  const FILE_SIZE_LIMIT = 50 * 1024 * 1024;

  const acceptedTypes: AcceptedFileTypes[] = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png'
  ];

  const isAcceptedFileType = (file: File): boolean => {
    // If no file type is detected, check extension
    if (!file.type) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      return extension === 'pdf' || extension === 'docx' || 
             extension === 'jpg' || extension === 'jpeg' || extension === 'png';
    }
    
    // Check mimetype
    const isAcceptedMimetype = acceptedTypes.includes(file.type as AcceptedFileTypes);
    
    // If mimetype isn't matched, check extension as a fallback
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
    
    setValidating(true);
    
    // Processamento por chunks para evitar bloqueio da UI
    const processFiles = (index: number, accumulator: File[]) => {
      if (index >= selectedFiles.length) {
        // Finalizado o processamento de todos os arquivos
        if (accumulator.length > 0) {
          setFiles(prev => [...prev, ...accumulator]);
        }
        setValidating(false);
        return;
      }
      
      // Processa um arquivo por vez
      const file = selectedFiles[index];
      
      // Verifica tamanho
      if (file.size > FILE_SIZE_LIMIT) {
        toast({
          title: "Arquivo muito grande",
          description: `O arquivo ${file.name} excede o limite de 50MB.`,
          variant: "destructive"
        });
        // Continua com o próximo arquivo
        setTimeout(() => processFiles(index + 1, accumulator), 10);
        return;
      }
      
      // Verifica tipo
      const isAccepted = isAcceptedFileType(file);
      if (!isAccepted) {
        toast({
          title: "Formato não suportado",
          description: `O arquivo ${file.name} não é suportado. Por favor, use PDF, DOCX, JPG ou PNG.`,
          variant: "destructive"
        });
        // Continua com o próximo arquivo
        setTimeout(() => processFiles(index + 1, accumulator), 10);
        return;
      }
      
      // Arquivo válido, adiciona ao acumulador
      accumulator.push(file);
      
      // Processa o próximo arquivo com uma pequena pausa para liberar a UI
      setTimeout(() => processFiles(index + 1, accumulator), 10);
    };
    
    // Inicia o processamento
    setTimeout(() => {
      try {
        processFiles(0, []);
      } catch (error) {
        console.error("Erro ao validar arquivos:", error);
        toast({
          title: "Erro ao processar arquivos",
          description: "Ocorreu um erro ao validar os arquivos selecionados.",
          variant: "destructive"
        });
        setValidating(false);
      }
    }, 100);
  }, [toast, FILE_SIZE_LIMIT, isAcceptedFileType]);

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
    
    // Pequeno atraso para permitir atualização da UI antes de iniciar o processamento pesado
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
          
          {validating && (
            <div className="mt-4 flex items-center gap-2 text-muted-foreground">
              <div className="animate-spin h-4 w-4 border-2 border-current rounded-full border-t-transparent"></div>
              <span className="text-sm">Validando arquivos...</span>
            </div>
          )}
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium mb-2">Arquivos selecionados:</h4>
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
