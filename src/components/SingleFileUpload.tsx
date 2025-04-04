
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SingleFileUploadProps {
  id: string;
  label: string;
  onFileChange: (files: File[]) => void;
  multiple?: boolean;
}

const SingleFileUpload: React.FC<SingleFileUploadProps> = ({ id, label, onFileChange, multiple = true }) => {
  const [files, setFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
    onFileChange([...files, ...selectedFiles]);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFileChange(newFiles);
  };

  const removeAllFiles = () => {
    setFiles([]);
    onFileChange([]);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <label htmlFor={`file-${id}`} className="block text-sm font-medium">
          {label}
        </label>
      </div>

      <div className="relative">
        <input
          id={`file-${id}`}
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={handleFileChange}
          accept=".pdf,.docx,.jpg,.jpeg,.png"
          multiple={multiple}
        />
        <div className="flex items-center justify-center border border-dashed border-muted-foreground/50 rounded-md p-3 hover:border-muted-foreground/80 transition-colors">
          <div className="flex flex-col items-center text-center">
            <Upload className="h-5 w-5 text-muted-foreground mb-1" />
            <span className="text-sm text-muted-foreground">Clique para selecionar</span>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm">Arquivos selecionados ({files.length})</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 p-0" 
              onClick={removeAllFiles}
            >
              Remover todos
            </Button>
          </div>
          <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
            {files.map((file, index) => (
              <div 
                key={`${file.name}-${index}`}
                className="flex items-center justify-between bg-secondary rounded-md p-2"
              >
                <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0" 
                  onClick={() => removeFile(index)}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remover arquivo</span>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SingleFileUpload;
