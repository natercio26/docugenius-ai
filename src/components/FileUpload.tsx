
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Upload, Trash2 } from 'lucide-react';
import { UploadStatus } from '@/types';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
  onUploadComplete: (files: File[]) => void;
  status: UploadStatus;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete, status }) => {
  const [files, setFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    const fileArray = Array.from(event.target.files);
    setFiles(prev => [...prev, ...fileArray]);
    event.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setFiles([]);
    toast({
      title: "Arquivos removidos",
      description: "Todos os arquivos foram removidos.",
    });
  };

  const handleSubmit = () => {
    if (files.length === 0) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione ao menos um arquivo para continuar.",
        variant: "destructive"
      });
      return;
    }
    
    onUploadComplete(files);
  };

  return (
    <div className="w-full">
      <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-6 text-center">
        <input
          id="file-upload"
          type="file"
          multiple
          accept=".pdf,.docx,.jpg,.jpeg,.png"
          className="hidden"
          onChange={handleFileChange}
          disabled={status === 'uploading' || status === 'processing'}
        />
        <label 
          htmlFor="file-upload" 
          className="flex flex-col items-center justify-center cursor-pointer"
        >
          <Upload className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-lg font-medium">Clique para selecionar arquivos</p>
          <p className="text-sm text-muted-foreground mt-1">
            Suporta PDF, DOCX, JPG e PNG
          </p>
        </label>
      </div>

      {files.length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Arquivos selecionados ({files.length})</h3>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={clearAllFiles}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar todos
            </Button>
          </div>
          
          <div className="space-y-2 mt-2">
            {files.map((file, index) => (
              <div 
                key={`${file.name}-${index}`} 
                className="flex items-center justify-between bg-secondary rounded-md p-2"
              >
                <span className="text-sm truncate max-w-[300px]">{file.name}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => removeFile(index)}
                >
                  &times;
                </Button>
              </div>
            ))}
          </div>
          
          <Button 
            className="mt-4 w-full"
            onClick={handleSubmit}
            disabled={status === 'uploading' || status === 'processing'}
          >
            {status === 'uploading' || status === 'processing' ? (
              <div className="flex items-center">
                <div className="animate-spin h-4 w-4 border-2 border-current rounded-full border-t-transparent mr-2"></div>
                <span>Processando...</span>
              </div>
            ) : (
              "Gerar Minuta"
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
