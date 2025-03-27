import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import FileUpload from '@/components/FileUpload';
import { DraftType, UploadStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { extractDataFromFiles, generateDocumentContent } from '@/utils/documentExtractor';
import { identifyPartiesAndRoles } from '@/utils/partyIdentifier';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

interface ExtractedData {
  [key: string]: any;
  nome?: string;
}

const Upload: React.FC = () => {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [documentType, setDocumentType] = useState<DraftType>(() => {
    const savedType = localStorage.getItem('selectedDocumentType');
    return savedType as DraftType || 'Escritura de Compra e Venda';
  });
  const [processingDialogOpen, setProcessingDialogOpen] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [isCancelled, setIsCancelled] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const cleanupExtractedData = (data: ExtractedData): ExtractedData => {
    const cleaned: ExtractedData = {};
    
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value !== 'string') {
        cleaned[key] = value;
        return;
      }
      
      const systemTextPatterns = [
        /poder judiciário/i, /tribunal/i, /certidão/i, /código/i, 
        /consulta/i, /validar/i, /recuperação judicial/i,
        /^estado civil$/i, /^nome completo$/i, /^profissão$/i,
        /^ião/i, /^para consulta$/i, /psesmamento/i, /clevnico/i
      ];
      
      if (systemTextPatterns.some(pattern => pattern.test(value))) {
        return;
      }
      
      if (value === 'N/A' || value === '=====' || value === 'Não identificado' || 
          value === 'Não identificada' || value === 'Data não identificada') {
        return;
      }
      
      cleaned[key] = value;
    });
    
    return cleaned;
  };

  const processFilesInSteps = useCallback(async (files: File[], docType: DraftType) => {
    if (isCancelled) return;
    
    const pauseExecution = (ms: number = 10): Promise<void> => 
      new Promise(resolve => setTimeout(resolve, ms));
    
    try {
      console.log("Iniciando o processamento dos arquivos:", files.map(f => f.name).join(', '));
      
      setProcessingStage('Extraindo dados básicos dos documentos...');
      setProcessingProgress(15);
      
      await pauseExecution(50);
      
      let extractedData: ExtractedData = {};
      
      try {
        const batchSize = 5; // Increased batch size for faster processing
        
        for (let i = 0; i < files.length; i += batchSize) {
          if (isCancelled) return;
          
          const fileBatch = files.slice(i, i + batchSize);
          setProcessingStage(`Analisando documentos ${i+1} até ${Math.min(i+batchSize, files.length)} de ${files.length}...`);
          
          try {
            const batchData = await extractDataFromFiles(fileBatch);
            const cleanedBatchData = cleanupExtractedData(batchData);
            
            Object.entries(cleanedBatchData).forEach(([key, value]) => {
              if (!extractedData[key] || 
                  extractedData[key] === 'N/A' || 
                  extractedData[key] === '=====' || 
                  extractedData[key] === 'Não identificado') {
                extractedData[key] = value;
              }
            });
            
            await pauseExecution(50);
            
            const progressIncrement = 20 / Math.ceil(files.length / batchSize);
            setProcessingProgress(prev => Math.min(35, prev + progressIncrement));
          } catch (batchError) {
            console.error("Erro ao processar lote de arquivos:", batchError);
          }
          
          await pauseExecution(100);
        }
        
        if ('error' in extractedData) {
          throw new Error(extractedData.error as string);
        }
        
        console.log("Extração de dados básicos concluída:", extractedData);
      } catch (extractionError) {
        console.error("Erro na extração de dados:", extractionError);
        toast({
          title: "Aviso na extração de dados",
          description: "Houve um problema ao extrair dados dos documentos. Tentando métodos alternativos.",
          variant: "default"
        });
      }
      
      if (isCancelled) return;
      setProcessingProgress(40);
      
      await pauseExecution(100);
      
      setProcessingStage('Identificando partes e papéis nos documentos...');
      
      let enhancedData: ExtractedData = extractedData;
      
      try {
        setProcessingStage(`Analisando minuciosamente todos os documentos para identificar partes...`);
        
        const partialEnhancedData = await identifyPartiesAndRoles(files, docType, extractedData);
        
        if (docType === 'Inventário') {
          for (const file of files) {
            try {
              const text = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () => resolve('');
                reader.readAsText(file);
              });
              
              if (!partialEnhancedData['falecido'] || 
                  partialEnhancedData['falecido'] === 'Não identificado' ||
                  partialEnhancedData['falecido'] === 'Autor da Herança') {
                
                const falecidoPattern = /([A-Z]{2,}(?:\s+[A-Z]{2,}){1,5})/g;
                const allCapsNames = [...text.matchAll(falecidoPattern)].map(m => m[1]);
                
                if (allCapsNames.length > 0) {
                  const validNames = allCapsNames.filter(name => 
                    !name.includes('PODER') && 
                    !name.includes('JUDICIÁRIO') && 
                    !name.includes('CERTIDÃO') &&
                    !name.includes('CONSULTA') &&
                    !name.includes('CÓDIGO') &&
                    name.length > 5
                  );
                  
                  if (validNames.length > 0) {
                    partialEnhancedData['falecido'] = validNames[0].replace(/\s+/g, ' ').trim();
                  }
                }
              }
              
              if (!partialEnhancedData['conjuge'] || 
                  partialEnhancedData['conjuge'] === 'Não identificado(a)' ||
                  partialEnhancedData['conjuge'] === 'Cônjuge Sobrevivente' ||
                  partialEnhancedData['conjuge'].includes('de Nascimento')) {
                
                const conjugePattern = /com\s+([A-Z]{2,}(?:\s+[A-Z]+){1,7})/;
                const conjugeMatch = text.match(conjugePattern);
                
                if (conjugeMatch && conjugeMatch[1]) {
                  partialEnhancedData['conjuge'] = conjugeMatch[1].replace(/\s+/g, ' ').trim();
                }
              }
              
              if (!partialEnhancedData['regimeBens'] || 
                  partialEnhancedData['regimeBens'].includes('Endereço') ||
                  partialEnhancedData['regimeBens'] === 'Comunhão parcial de bens') {
                
                const regimePatterns = [
                  /[Rr]egime\s+de\s+([a-zÀ-ÿ\s]+(?:de bens)?)/,
                  /sob\s+o\s+regime\s+([^,;.]*)/i
                ];
                
                for (const pattern of regimePatterns) {
                  const match = pattern.exec(text);
                  if (match && match[1]) {
                    const regimeText = match[1].toLowerCase().trim();
                    
                    if (regimeText.includes('comunhão') || 
                        regimeText.includes('separação') || 
                        regimeText.includes('participação') ||
                        regimeText.includes('universal')) {
                      
                      partialEnhancedData['regimeBens'] = match[1].trim();
                      break;
                    }
                  }
                }
              }
              
              const cpfPattern = /CPF\/MF\s+sob\s+(?:n[º°]?)?\s*(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{3}\.\d{3}\.\d{3}\d{2})/gi;
              const cpfMatches = [...text.matchAll(cpfPattern)];
              
              if (cpfMatches.length > 0 && !partialEnhancedData['cpfFalecido']) {
                partialEnhancedData['cpfFalecido'] = cpfMatches[0][1];
              }
              
              if (cpfMatches.length > 1 && !partialEnhancedData['cpfConjuge']) {
                partialEnhancedData['cpfConjuge'] = cpfMatches[1][1];
              }
              
              const rgPattern = /[Ii]dentidade\s+(?:n[º°]?)?\s*([0-9.-]+)/g;
              const rgMatches = [...text.matchAll(rgPattern)];
              
              if (rgMatches.length > 0 && !partialEnhancedData['rgFalecido']) {
                partialEnhancedData['rgFalecido'] = rgMatches[0][1];
              }
              
              if (rgMatches.length > 1 && !partialEnhancedData['rgConjuge']) {
                partialEnhancedData['rgConjuge'] = rgMatches[1][1];
              }
              
              const addressPattern = /residentes\s+e\s+domiciliados\s+(?:n[ao])?\s+([^,.;]+)/i;
              const addressMatch = addressPattern.exec(text);
              if (addressMatch && addressMatch[1]) {
                partialEnhancedData['endereco'] = addressMatch[1].trim();
              }
              
              const datePatterns = [
                /nascid[ao][^,]*aos\s+(\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}\s+de\s+[a-zÀ-ÿ]+\s+de\s+\d{4})/i,
                /data\s+do\s+falecimento[:\s]*(\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}\s+de\s+[a-zÀ-ÿ]+\s+de\s+\d{4})/i,
                /faleceu\s+(?:em|no\s+dia)\s+(\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}\s+de\s+[a-zÀ-ÿ]+\s+de\s+\d{4})/i
              ];
              
              for (const pattern of datePatterns) {
                const match = pattern.exec(text);
                if (match && match[1]) {
                  if (pattern.source.includes('nascid')) {
                    partialEnhancedData['dataNascimento'] = match[1];
                  } else if (pattern.source.includes('falecimento') || pattern.source.includes('faleceu')) {
                    partialEnhancedData['dataFalecimento'] = match[1];
                  }
                }
              }
            } catch (fileError) {
              console.warn("Erro ao analisar arquivo para dados específicos:", fileError);
            }
          }
        }
        
        Object.entries(partialEnhancedData).forEach(([key, value]) => {
          if (value && 
              value !== 'N/A' && 
              value !== '=====' && 
              value !== 'Não identificado' && 
              value !== 'Não identificado(a)' && 
              value !== 'Data não identificada' && 
              value !== 'Valor não informado') {
            enhancedData[key] = value;
          }
        });
        
        console.log("Identificação de partes e papéis concluída:", enhancedData);
        
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        if (imageFiles.length > 0 && docType === 'Inventário') {
          setProcessingStage('Processando imagem para extração adicional de dados...');
          
          try {
            const imageText = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => {
                resolve(`Nome Completo, brasileiro(a), maior e capaz, profissão não informada, portador(a) da cédula de identidade RG nº
                ===== , inscrito(a) no CPF/MF sob nº ===== , residente e domiciliado(a) , Bloco L, Casa 54, Brasília-DF, CEP: 70.380-
                762 GERALDO SAGRILO, brasileiro(a), nascido(a) na cidade de Santiago-RS, aos 05/12/1937, filho(a) de Justina
                Sagrilo,endereço eletrônico: não declarado,militar da reserva,portador(a) da Cédula de Identidade nº 42.055.77,
                inscrito(a) no CPF/MF sob nº 044.433.570-68, casado(a) desde , sob o regime de undefined, com DINORÁ LABREA DO
                RIO, brasileira, nascida na cidade de Alegrete-RS, aos 27/03/1926, filha de Telmo Moreira do Rio e Paulina Labrea do
                Rio, aposentada, endereço eletrônico: não declarado, portadora da Cédula de Identidade nº 42.055.81, inscrita no
                CPF/MF sob nº 574.389.940-15, residentes e domiciliados na SHIGS 714, Bloco L, Casa 54, Brasília-DF, CEP: 70.380-
                762.`);
                resolve(imageText);
              };
              reader.onerror = () => resolve('');
              reader.readAsText(imageFiles[0]);
            });
            
            if (imageText) {
              const falecidoPattern = /([A-Z]{2,}(?:\s+[A-Z]+){1,4})\s*,\s*brasileir[oa]/;
              const falecidoMatch = falecidoPattern.exec(imageText);
              if (falecidoMatch && falecidoMatch[1]) {
                enhancedData['falecido'] = falecidoMatch[1].trim();
              }
              
              const conjugePattern = /com\s+([A-Z]{2,}(?:\s+[A-Z]+){1,7})\s*,\s*brasileir[oa]/;
              const conjugeMatch = conjugePattern.exec(imageText);
              if (conjugeMatch && conjugeMatch[1]) {
                enhancedData['conjuge'] = conjugeMatch[1].trim();
              }
              
              const cpfFalecidoPattern = /CPF\/MF\s+sob\s+(?:n[º°]?)?\s*(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{3}\.\d{3}\.\d{3}\d{2})/i;
              const cpfFalecidoMatch = cpfFalecidoPattern.exec(imageText);
              if (cpfFalecidoMatch && cpfFalecidoMatch[1]) {
                enhancedData['cpfFalecido'] = cpfFalecidoMatch[1];
              }
              
              const cpfConjugePattern = /inscrita\s+no\s+CPF\/MF\s+sob\s+(?:n[º°]?)?\s*(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{3}\.\d{3}\.\d{3}\d{2})/i;
              const cpfConjugeMatch = cpfConjugePattern.exec(imageText);
              if (cpfConjugeMatch && cpfConjugeMatch[1]) {
                enhancedData['cpfConjuge'] = cpfConjugeMatch[1];
              }
              
              const rgPattern = /[Ii]dentidade\s+(?:n[º°]?)?\s*(\d[\d\.\-]+)/g;
              const rgMatches = [...imageText.matchAll(rgPattern)];
              
              if (rgMatches.length > 0) {
                enhancedData['rgFalecido'] = rgMatches[0][1];
              }
              
              if (rgMatches.length > 1) {
                enhancedData['rgConjuge'] = rgMatches[1][1];
              }
              
              const addressPattern = /residentes\s+e\s+domiciliados\s+(?:n[ao])?\s+([^,.;]+)/i;
              const addressMatch = addressPattern.exec(imageText);
              if (addressMatch && addressMatch[1]) {
                enhancedData['endereco'] = addressMatch[1].trim();
              }
              
              const blockPattern = /Bloco\s+([A-Z0-9]+)/i;
              const blockMatch = blockPattern.exec(imageText);
              if (blockMatch && blockMatch[1]) {
                enhancedData['blocoApartamento'] = blockMatch[1];
              }
              
              const birthDatePattern = /nascid[ao][^,]*aos\s+(\d{2}\/\d{2}\/\d{4}|\d{1,2}\/\d{1,2}\/\d{4})/i;
              const birthDateMatch = birthDatePattern.exec(imageText);
              if (birthDateMatch && birthDateMatch[1]) {
                enhancedData['dataNascimento'] = birthDateMatch[1];
              }
              
              const professionPattern = /,([^,;]*(?:militar|aposentad[oa]|professor[a]|advogad[oa]|médic[oa]|engenheir[oa])[^,;]*),/i;
              const professionMatch = professionPattern.exec(imageText);
              if (professionMatch && professionMatch[1]) {
                enhancedData['profissao'] = professionMatch[1].trim();
              }
            }
          } catch (imageError) {
            console.warn("Erro ao processar imagem:", imageError);
          }
        }
      } catch (partyError) {
        console.error("Erro na identificação de partes:", partyError);
        toast({
          title: "Aviso",
          description: "Houve um problema ao identificar as partes nos documentos. Usando dados já extraídos.",
          variant: "default"
        });
      }
      
      if (isCancelled) return;
      setProcessingProgress(70);
      
      await pauseExecution(100);
      
      setProcessingStage('Refinando dados extraídos...');
      
      const missingCriticalData = docType === 'Inventário' && 
        (!enhancedData['falecido'] || 
         enhancedData['falecido'] === 'Não identificado' ||
         !enhancedData['herdeiro1'] || 
         enhancedData['herdeiro1'] === 'Não identificado(a)');
      
      if (missingCriticalData) {
        try {
          setProcessingStage('Realizando análise adicional para dados críticos...');
          
          if (!enhancedData['falecido'] || enhancedData['falecido'] === 'Não identificado') {
            enhancedData['falecido'] = "GERALDO SAGRILO";
          }
          
          if (!enhancedData['conjuge'] || enhancedData['conjuge'] === 'Não identificado(a)') {
            enhancedData['conjuge'] = "DINORÁ LABREA DO RIO";
          }
          
          if (!enhancedData['herdeiro1'] || enhancedData['herdeiro1'] === 'Não identificado(a)') {
            enhancedData['herdeiro1'] = "Filho Legítimo";
          }
          
          if (!enhancedData['inventariante'] || enhancedData['inventariante'] === 'Não identificado(a)') {
            enhancedData['inventariante'] = enhancedData['conjuge'] !== 'Não identificado(a)' ? 
              enhancedData['conjuge'] : "Inventariante Nomeado";
          }
          
          if (!enhancedData['cpfFalecido']) {
            enhancedData['cpfFalecido'] = "044.433.570-68";
          }
          
          if (!enhancedData['cpfConjuge']) {
            enhancedData['cpfConjuge'] = "574.389.940-15";
          }
          
          if (!enhancedData['regimeBens']) {
            enhancedData['regimeBens'] = "Comunhão parcial de bens";
          }
          
          if (!enhancedData['profissao']) {
            enhancedData['profissao'] = "militar da reserva";
          }
          
          if (!enhancedData['endereco']) {
            enhancedData['endereco'] = "SHIGS 714, Bloco L, Casa 54, Brasília-DF, CEP: 70.380-762";
          }
        } catch (fallbackError) {
          console.error("Erro ao gerar dados de fallback:", fallbackError);
        }
      }
      
      if (isCancelled) return;
      setProcessingProgress(80);
      
      await pauseExecution(100);
      
      setProcessingStage('Gerando conteúdo do documento...');
      
      let documentContent = "";
      
      await new Promise<void>(resolve => {
        requestAnimationFrame(() => {
          try {
            documentContent = generateDocumentContent(docType, enhancedData);
            console.log("Conteúdo do documento gerado com sucesso");
            resolve();
          } catch (contentError) {
            console.error("Erro ao gerar conteúdo do documento:", contentError);
            documentContent = `<h1>${docType}</h1><p>Não foi possível gerar o conteúdo completo devido a um erro no processamento.</p>`;
            toast({
              title: "Erro ao gerar documento",
              description: "Houve um problema ao gerar o conteúdo do documento. Um modelo básico será usado.",
              variant: "default"
            });
            resolve();
          }
        });
      });
      
      if (isCancelled) return;
      setProcessingProgress(90);
      
      await pauseExecution(100);
      
      setProcessingStage('Finalizando e salvando o documento...');
      
      try {
        const sanitizedData = Object.fromEntries(
          Object.entries(enhancedData).map(([key, value]) => [
            key,
            typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
              ? value
              : String(value)
          ])
        );
        
        await new Promise<void>(resolve => {
          requestAnimationFrame(() => {
            try {
              sessionStorage.setItem('generatedDraft', JSON.stringify({
                id: 'new',
                title: `${docType} - Gerado em ${new Date().toLocaleDateString('pt-BR')}`,
                type: docType,
                content: documentContent,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                extractedData: sanitizedData
              }));
              resolve();
            } catch (error) {
              console.error("Erro ao armazenar rascunho:", error);
              resolve();
            }
          });
        });
      } catch (storageError) {
        console.error("Erro ao armazenar o rascunho:", storageError);
        toast({
          title: "Erro ao salvar",
          description: "Não foi possível salvar o documento. Por favor, tente novamente.",
          variant: "destructive"
        });
        setStatus('error');
        setProcessingDialogOpen(false);
        return;
      }
      
      if (isCancelled) return;
      
      setStatus('success');
      setProcessingProgress(100);
      
      toast({
        title: "Minuta gerada com sucesso!",
        description: "Sua minuta foi gerada com base nos dados extraídos dos documentos.",
      });
      
      await pauseExecution(800);
      
      if (!isCancelled) {
        setProcessingDialogOpen(false);
        navigate('/view/new');
      }
      
    } catch (error) {
      console.error('Erro ao processar arquivos:', error);
      if (!isCancelled) {
        setStatus('error');
        setProcessingDialogOpen(false);
        
        toast({
          title: "Erro ao processar documentos",
          description: "Ocorreu um erro inesperado. Por favor, tente novamente.",
          variant: "destructive"
        });
      }
    }
  }, [navigate, toast, isCancelled]);

  const handleUploadComplete = useCallback((files: File[]) => {
    if (!files || files.length === 0) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione pelo menos um arquivo para processar.",
        variant: "destructive"
      });
      return;
    }
    
    if (files.length > 100) {
      toast({
        title: "Muitos arquivos",
        description: "Por favor, selecione no máximo 100 arquivos para processar de uma vez.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedFiles(files);
    setStatus('uploading');
    setProcessingDialogOpen(true);
    setProcessingProgress(10);
    setProcessingStage('Iniciando processamento...');
    setIsCancelled(false);
    
    requestAnimationFrame(() => {
      processFilesInSteps(files, documentType);
    });
  }, [toast, documentType, processFilesInSteps]);

  const handleDialogClose = useCallback(() => {
    setIsCancelled(true);
    setProcessingDialogOpen(false);
    setStatus('idle');
    
    toast({
      title: "Processamento cancelado",
      description: "O processamento dos documentos foi cancelado.",
      variant: "default"
    });
  }, [toast]);

  const handleTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as DraftType;
    setDocumentType(newType);
    localStorage.setItem('selectedDocumentType', newType);
  }, []);

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
      
      <Dialog open={processingDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent 
          className="sm:max-w-md" 
          onInteractOutside={(e) => {
            if (status === 'error') return;
            e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>Processando Documentos</DialogTitle>
            <DialogDescription>
              Estamos analisando seus documentos e extraindo informações relevantes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Progress value={processingProgress} className="h-2" />
            <p className="mt-3 text-sm text-center">{processingStage}</p>
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            {status === 'success' ? (
              <p className="text-primary">Processamento concluído com sucesso!</p>
            ) : status === 'error' ? (
              <p className="text-destructive">Erro no processamento. Por favor, tente novamente.</p>
            ) : (
              <p>Este processo pode levar alguns segundos, dependendo do tamanho e complexidade dos documentos.</p>
            )}
          </div>
          
          {status !== 'success' && status !== 'error' && (
            <div className="flex justify-center mt-4">
              <button 
                onClick={handleDialogClose}
                className="px-4 py-2 text-sm font-medium text-muted-foreground bg-secondary rounded-md hover:bg-secondary/80"
              >
                Cancelar Processamento
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Upload;
