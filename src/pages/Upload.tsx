
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import FileUpload from '@/components/FileUpload';
import { DraftType, UploadStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { extractDataFromFiles, generateDocumentContent } from '@/utils/documentExtractor';

const Upload: React.FC = () => {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [documentType, setDocumentType] = useState<DraftType>(() => {
    // Get the saved document type from localStorage or use default
    const savedType = localStorage.getItem('selectedDocumentType');
    return savedType as DraftType || 'Escritura de Compra e Venda';
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  // Process the uploaded files and generate the document
  const handleUploadComplete = async (files: File[]) => {
    setSelectedFiles(files);
    setStatus('uploading');
    
    try {
      // Simulate upload time (3 seconds for visual feedback)
      setTimeout(async () => {
        setStatus('processing');
        
        try {
          console.log("Starting data extraction from files");
          
          // Extract data from the uploaded files
          const extractedData = await extractDataFromFiles(files);
          
          console.log("Data extraction complete:", extractedData);
          
          // Generate document content based on the extracted data
          const documentContent = generateDocumentContent(documentType, extractedData);
          
          console.log("Document content generated successfully");
          
          // Store generated content in sessionStorage
          sessionStorage.setItem('generatedDraft', JSON.stringify({
            id: 'new',
            title: `${documentType} - Gerado em ${new Date().toLocaleDateString('pt-BR')}`,
            type: documentType,
            content: documentContent,
            createdAt: new Date(),
            updatedAt: new Date()
          }));
          
          // Update status to success
          setStatus('success');
          
          toast({
            title: "Minuta gerada com sucesso!",
            description: "Sua minuta foi gerada com base nos dados extraídos dos documentos.",
          });
          
          // Navigate to the view page after successful generation
          setTimeout(() => {
            navigate('/view/new');
          }, 1000);
        } catch (error) {
          console.error('Error processing files:', error);
          setStatus('error');
          
          toast({
            title: "Erro ao processar documentos",
            description: "Não foi possível extrair dados dos documentos. Por favor, tente novamente.",
            variant: "destructive"
          });
        }
      }, 3000);
    } catch (error) {
      console.error('Error handling upload:', error);
      setStatus('error');
      
      toast({
        title: "Erro no upload",
        description: "Houve um problema ao processar os arquivos. Por favor, tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as DraftType;
    setDocumentType(newType);
    // Save the selected document type to localStorage
    localStorage.setItem('selectedDocumentType', newType);
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
        
        <div className="max-w-3xl mx-auto mb-8 animate-scale-in" style={{ animationDelay: '50ms' }}>
          <div className="glass rounded-lg p-6">
            <label htmlFor="documentType" className="block text-sm font-medium mb-2">
              Tipo de Documento a Gerar
            </label>
            <select
              id="documentType"
              value={documentType}
              onChange={handleTypeChange}
              className="input-field mb-4"
              disabled={status === 'uploading' || status === 'processing'}
            >
              <option value="Escritura de Compra e Venda">Escritura de Compra e Venda</option>
              <option value="Inventário">Inventário</option>
              <option value="Doação">Doação</option>
              <option value="União Estável">União Estável</option>
              <option value="Procuração">Procuração</option>
              <option value="Testamento">Testamento</option>
              <option value="Outro">Outro</option>
            </select>
            
            <p className="text-sm text-muted-foreground mb-4">
              Selecione o tipo de documento que deseja gerar com base nos arquivos anexados.
            </p>
          </div>
        </div>
        
        <div className="animate-scale-in" style={{ animationDelay: '100ms' }}>
          <FileUpload onUploadComplete={handleUploadComplete} status={status} />
        </div>
      </main>
    </div>
  );
};

export default Upload;

