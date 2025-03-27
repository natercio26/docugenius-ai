
import React, { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Upload, File, X } from 'lucide-react';
import { UploadStatus, AcceptedFileTypes } from '@/types';
import StatusIndicator from './StatusIndicator';

interface FileUploadProps {
  onUploadComplete: (files: File[]) => void;
  status: UploadStatus;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete, status }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const acceptedTypes: AcceptedFileTypes[] = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png'
  ];

  const handleFileChange = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: File[] = Array.from(selectedFiles).filter(file => {
      const isAccepted = acceptedTypes.includes(file.type as AcceptedFileTypes);
      if (!isAccepted) {
        toast({
          title: "Formato não suportado",
          description: `O arquivo ${file.name} não é suportado. Por favor, use PDF, DOCX, JPG ou PNG.`,
          variant: "destructive"
        });
      }
      return isAccepted;
    });

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
    }
  }, [toast]);

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
    
    handleFileChange(e.dataTransfer.files);
  }, [handleFileChange]);

  const handleSubmit = useCallback(() => {
    if (files.length === 0) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione ao menos um arquivo para continuar.",
        variant: "destructive"
      });
      return;
    }
    
    // Inform user about processing
    toast({
      title: "Processando documentos",
      description: "Seus documentos estão sendo analisados para extrair os dados. Aguarde um momento.",
    });
    
    onUploadComplete(files);
  }, [files, onUploadComplete, toast]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return 'PDF';
    if (type.includes('document')) return 'DOC';
    if (type.includes('image')) return 'IMG';
    return 'FILE';
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 transition-all duration-300 ${
          dragActive 
          ? 'border-accent bg-accent/5' 
          : 'border-muted-foreground/20 hover:border-muted-foreground/30'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={(e) => handleFileChange(e.target.files)}
          multiple
          accept=".pdf,.docx,.jpg,.jpeg,.png"
          disabled={status === 'uploading' || status === 'processing'}
        />
        
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Upload className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-1">Arraste arquivos ou clique para selecionar</h3>
          <p className="text-sm text-muted-foreground">
            Suporte para PDF, DOCX, JPG e PNG
          </p>
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
                  onClick={() => removeFile(index)}
                  className="text-muted-foreground hover:text-destructive"
                  disabled={status === 'uploading' || status === 'processing'}
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
          className="button-primary min-w-[200px] flex items-center justify-center space-x-2 py-2.5"
          onClick={handleSubmit}
          disabled={files.length === 0 || status === 'uploading' || status === 'processing'}
        >
          {status === 'idle' && (
            <>
              <span>Gerar Minuta com IA</span>
            </>
          )}
          {(status === 'uploading' || status === 'processing') && (
            <>
              <StatusIndicator status={status} />
            </>
          )}
          {status === 'success' && <span>Minuta Gerada com Sucesso!</span>}
          {status === 'error' && <span>Erro ao Processar! Tente Novamente</span>}
        </button>
      </div>
    </div>
  );
};

export default FileUpload;

