
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
    const response = await fetch('https://minuta-ocr.onrender.com/gerar-minuta', {
      method: 'POST',
      body: formData,
      // No need to set Content-Type header when using FormData, 
      // the browser will set it automatically with the boundary
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na API: ${response.status} - ${errorText}`);
    }
    
    return await response.blob();
  } catch (error) {
    console.error('Erro ao gerar minuta:', error);
    throw error;
  }
};

/**
 * Attempts to extract text from a PDF blob
 * If extraction fails, returns null
 */
export const extractTextFromPdfBlob = async (blob: Blob): Promise<string | null> => {
  try {
    // This is a simple implementation - for real PDF text extraction,
    // you would need a PDF parsing library like pdf.js
    const text = await blob.text();
    
    // Check if the extracted content seems like text (basic heuristic)
    if (text && !text.includes('%PDF') && text.length > 0) {
      return text;
    }
    
    return null; // Not extractable as text
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return null;
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
