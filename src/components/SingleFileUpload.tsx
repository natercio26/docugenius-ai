
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { File, X, Upload } from 'lucide-react';
import { AcceptedFileTypes } from '@/types';
import { Button } from '@/components/ui/button';

interface SingleFileUploadProps {
  id: string;
  label: string;
  onFileChange: (file: File | null) => void;
}

const SingleFileUpload: React.FC<SingleFileUploadProps> = ({ id, label, onFileChange }) => {
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const FILE_SIZE_LIMIT = 50 * 1024 * 1024; // 50MB

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const selectedFile = e.target.files[0];
    
    if (selectedFile.size > FILE_SIZE_LIMIT) {
      toast({
        title: "Arquivo muito grande",
        description: `O arquivo ${selectedFile.name} excede o limite de 50MB.`,
        variant: "destructive"
      });
      e.target.value = '';
      return;
    }
    
    if (!isAcceptedFileType(selectedFile)) {
      toast({
        title: "Formato não suportado",
        description: `O arquivo ${selectedFile.name} não é suportado. Por favor, use PDF, DOCX, JPG ou PNG.`,
        variant: "destructive"
      });
      e.target.value = '';
      return;
    }
    
    setFile(selectedFile);
    onFileChange(selectedFile);
    e.target.value = '';
  };

  const removeFile = () => {
    setFile(null);
    onFileChange(null);
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf') || type === '' && file?.name.endsWith('.pdf')) return 'PDF';
    if (type.includes('document') || type === '' && file?.name.endsWith('.docx')) return 'DOC';
    if (type.includes('image') || 
        type === '' && (file?.name.endsWith('.jpg') || file?.name.endsWith('.jpeg') || file?.name.endsWith('.png'))) 
      return 'IMG';
    return 'FILE';
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <label htmlFor={`file-${id}`} className="block text-sm font-medium">
          {label}
        </label>
        {file && (
          <span className="text-xs text-muted-foreground">
            {(file.size / 1024 / 1024).toFixed(2)}MB
          </span>
        )}
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
          <div className="flex items-center overflow-hidden">
            <div className="bg-accent/10 text-accent font-medium text-xs rounded-md px-2 py-1 mr-3 shrink-0">
              {getFileIcon(file.type)}
            </div>
            <span className="text-sm truncate max-w-[200px]">{file.name}</span>
          </div>
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
