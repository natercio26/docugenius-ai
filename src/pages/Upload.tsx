
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import FileUpload from '@/components/FileUpload';
import { DraftType, UploadStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { extractDataFromFiles, generateDocumentContent } from '@/utils/documentExtractor';
import { identifyPartiesAndRoles } from '@/utils/partyIdentifier';

const Upload: React.FC = () => {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [documentType, setDocumentType] = useState<DraftType>(() => {
    const savedType = localStorage.getItem('selectedDocumentType');
    return savedType as DraftType || 'Escritura de Compra e Venda';
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleUploadComplete = async (files: File[]) => {
    if (!files || files.length === 0) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione pelo menos um arquivo para processar.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedFiles(files);
    setStatus('uploading');
    
    try {
      console.log("Iniciando o processamento dos arquivos:", files.map(f => f.name).join(', '));
      
      // Use a separate processFiles function to handle the asynchronous operations
      processFiles(files, documentType);
    } catch (error) {
      console.error('Erro no upload:', error);
      setStatus('error');
      
      toast({
        title: "Erro no upload",
        description: "Houve um problema ao processar os arquivos. Por favor, tente novamente.",
        variant: "destructive"
      });
    }
  };

  const processFiles = async (files: File[], docType: DraftType) => {
    // Add a slight delay to ensure the UI has time to update
    setTimeout(async () => {
      setStatus('processing');
      
      try {
        console.log("Iniciando extração de dados dos arquivos");
        
        // Extract basic data from the uploaded files
        const extractedData = await extractDataFromFiles(files);
        
        if (extractedData.error) {
          throw new Error(extractedData.error);
        }
        
        console.log("Extração de dados básicos concluída:", extractedData);
        
        // Enhanced step: Identify parties and their roles
        console.log("Identificando partes e seus papéis nos documentos");
        
        // Add error handling around the party identification
        let enhancedData = {};
        try {
          enhancedData = await identifyPartiesAndRoles(files, docType, extractedData);
          console.log("Identificação de partes e papéis concluída:", enhancedData);
        } catch (partyError) {
          console.error("Erro na identificação de partes:", partyError);
          // Use the basic extracted data if party identification fails
          enhancedData = extractedData;
          toast({
            title: "Aviso",
            description: "Houve um problema ao identificar as partes nos documentos. Usando dados básicos.",
            variant: "default"
          });
        }
        
        if (Object.keys(enhancedData).length <= 1 && !enhancedData.nome) {
          console.warn("Dados insuficientes extraídos dos documentos");
          toast({
            title: "Dados insuficientes",
            description: "Não foi possível extrair dados suficientes dos documentos. A minuta será criada com dados mínimos.",
            variant: "default"
          });
        }
        
        // Generate document content based on the enhanced extracted data
        const documentContent = generateDocumentContent(docType, enhancedData);
        
        console.log("Conteúdo do documento gerado com sucesso");
        
        // Store the draft in session storage
        sessionStorage.setItem('generatedDraft', JSON.stringify({
          id: 'new',
          title: `${docType} - Gerado em ${new Date().toLocaleDateString('pt-BR')}`,
          type: docType,
          content: documentContent,
          createdAt: new Date().toISOString(), // Store as ISO string for proper serialization
          updatedAt: new Date().toISOString(),
          extractedData: enhancedData
        }));
        
        setStatus('success');
        
        toast({
          title: "Minuta gerada com sucesso!",
          description: "Sua minuta foi gerada com base nos dados extraídos e nos papéis identificados dos documentos.",
        });
        
        // Navigate after a slight delay to ensure the toast is visible
        setTimeout(() => {
          navigate('/view/new');
        }, 1000);
      } catch (error) {
        console.error('Erro ao processar arquivos:', error);
        setStatus('error');
        
        toast({
          title: "Erro ao processar documentos",
          description: "Não foi possível extrair dados dos documentos. Por favor, tente novamente.",
          variant: "destructive"
        });
      }
    }, 500);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as DraftType;
    setDocumentType(newType);
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
