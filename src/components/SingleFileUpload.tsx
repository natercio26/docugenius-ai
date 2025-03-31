
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SingleFileUploadProps {
  id: string;
  label: string;
  onFileChange: (file: File | null) => void;
}

const SingleFileUpload: React.FC<SingleFileUploadProps> = ({ id, label, onFileChange }) => {
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    onFileChange(selectedFile);
    e.target.value = '';
  };

  const removeFile = () => {
    setFile(null);
    onFileChange(null);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <label htmlFor={`file-${id}`} className="block text-sm font-medium">
          {label}
        </label>
      </div>

      {!file ? (
        <div className="relative">
          <input
            id={`file-${id}`}
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            onChange={handleFileChange}
            accept=".pdf,.docx,.jpg,.jpeg,.png"
          />
          <div className="flex items-center justify-center border border-dashed border-muted-foreground/50 rounded-md p-3 hover:border-muted-foreground/80 transition-colors">
            <div className="flex flex-col items-center text-center">
              <Upload className="h-5 w-5 text-muted-foreground mb-1" />
              <span className="text-sm text-muted-foreground">Clique para selecionar</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between bg-secondary rounded-md p-3">
          <span className="text-sm truncate max-w-[200px]">{file.name}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={removeFile}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Remover arquivo</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default SingleFileUpload;
