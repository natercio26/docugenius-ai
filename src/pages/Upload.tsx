
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import FileUpload from '@/components/FileUpload';
import { UploadStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';

const Upload: React.FC = () => {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const navigate = useNavigate();
  const { toast } = useToast();

  // Simulate the upload and processing flow
  const handleUploadComplete = (files: File[]) => {
    setStatus('uploading');
    
    // Simulate upload time
    setTimeout(() => {
      setStatus('processing');
      
      // Simulate AI processing time
      setTimeout(() => {
        setStatus('success');
        
        toast({
          title: "Minuta gerada com sucesso!",
          description: "Sua minuta foi gerada e está pronta para visualização.",
        });
        
        // Navigate to the view page after successful generation
        setTimeout(() => {
          navigate('/view/new');
        }, 1000);
      }, 3000);
    }, 2000);
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
        
        <div className="animate-scale-in" style={{ animationDelay: '100ms' }}>
          <FileUpload onUploadComplete={handleUploadComplete} status={status} />
        </div>
      </main>
    </div>
  );
};

export default Upload;
