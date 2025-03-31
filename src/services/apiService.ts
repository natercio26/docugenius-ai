
/**
 * Service for handling API requests
 */

/**
 * Sends files and template model to the OCR API to generate a document
 */
export const generateDocument = async (
  files: File[],
  modelTemplate: string
): Promise<Blob> => {
  const formData = new FormData();
  
  // Add all files to the form data
  files.forEach(file => {
    formData.append('files', file);
  });
  
  // Add the model template
  formData.append('modelo_minuta', modelTemplate);
  
  try {
    const response = await fetch('https://docugenius-ai.onrender.com/gerar-minuta', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status}`);
    }
    
    return await response.blob();
  } catch (error) {
    console.error('Erro ao gerar minuta:', error);
    throw error;
  }
};

/**
 * Downloads a blob as a file
 */
export const downloadBlob = (blob: Blob, fileName: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, 100);
};

/**
 * Extracts text content from a PDF blob
 */
export const extractTextFromPdfBlob = async (pdfBlob: Blob): Promise<string | null> => {
  try {
    // For now, we'll return a simple message as we don't have PDF text extraction implemented
    // In a real implementation, this would use a library like pdf.js to extract text
    return "Conteúdo da minuta gerada pela API. Para visualizar o documento completo, use a opção de download.";
  } catch (error) {
    console.error("Erro ao extrair texto do PDF:", error);
    return null;
  }
};
