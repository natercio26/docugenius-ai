
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import FileUpload from '@/components/FileUpload';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadStatus } from '@/types';
import ProtocoloSearch from '@/components/ProtocoloSearch';

const Upload: React.FC = () => {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const navigate = useNavigate();

  const handleUploadComplete = (files: File[]) => {
    // Simulate processing
    setStatus('uploading');
    
    setTimeout(() => {
      setStatus('processing');
      
      setTimeout(() => {
        setStatus('success');
        
        // Generate a unique ID for the draft
        const draftId = Math.random().toString(36).substring(2, 9);
        
        const newDraft = {
          id: draftId,
          title: `Minuta - ${files[0].name.split('.')[0]}`,
          type: 'Inventário',
          content: '', // This would be filled with the actual content extracted from the files
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Store draft in session storage
        sessionStorage.setItem('generatedDraft', JSON.stringify(newDraft));
        
        // Navigate to the draft view page
        setTimeout(() => {
          navigate(`/view/new`);
        }, 1000);
        
      }, 3000);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="page-container py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="heading-1 text-center mb-2">Nova Minuta</h1>
          <p className="text-muted-foreground text-center mb-8">
            Crie uma nova minuta carregando documentos ou usando um número de protocolo
          </p>
          
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto mb-6">
              <TabsTrigger value="upload">Upload de Documentos</TabsTrigger>
              <TabsTrigger value="protocolo">Número de Protocolo</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="mt-4">
              <FileUpload 
                onUploadComplete={handleUploadComplete}
                status={status}
              />
            </TabsContent>
            
            <TabsContent value="protocolo" className="mt-4">
              <ProtocoloSearch />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Upload;
