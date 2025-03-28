
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import FileUpload from '@/components/FileUpload';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DraftType, UploadStatus } from '@/types';
import ProtocoloSearch from '@/components/ProtocoloSearch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Upload: React.FC = () => {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [documentType, setDocumentType] = useState<DraftType>('Inventário');
  const navigate = useNavigate();

  const documentTypes: DraftType[] = [
    'Inventário',
    'Escritura de Compra e Venda',
    'Doação',
    'União Estável',
    'Procuração',
    'Testamento',
    'Contrato de Aluguel',
    'Contrato Social',
    'Outro'
  ];

  const handleDocumentTypeChange = (value: string) => {
    setDocumentType(value as DraftType);
  };

  const handleUploadComplete = (files: File[], extractedData: Record<string, string> = {}) => {
    // Clear any existing draft from session storage first
    sessionStorage.removeItem('generatedDraft');
    
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
          type: documentType,
          content: '', // This would be filled with the actual content extracted from the files
          createdAt: new Date(),
          updatedAt: new Date(),
          extractedData: extractedData // Add the extracted data
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

          <div className="mb-8 max-w-xs mx-auto">
            <label htmlFor="documentType" className="block text-sm font-medium mb-2">
              Tipo de Documento
            </label>
            <Select value={documentType} onValueChange={handleDocumentTypeChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o tipo de documento" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
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
              <ProtocoloSearch documentType={documentType} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Upload;
