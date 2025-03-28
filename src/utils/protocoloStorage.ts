
import { ProtocoloData } from "@/types";

// Key for localStorage
const PROTOCOLOS_STORAGE_KEY = 'cadastro-app-protocolos';

// Get all protocolos from localStorage
export const getProtocolos = (): ProtocoloData[] => {
  try {
    const storedData = localStorage.getItem(PROTOCOLOS_STORAGE_KEY);
    if (storedData) {
      // Parse stored JSON and convert string dates back to Date objects
      const parsedData = JSON.parse(storedData);
      return parsedData.map((item: any) => ({
        ...item,
        dataGeracao: new Date(item.dataGeracao)
      }));
    }
  } catch (error) {
    console.error("Erro ao recuperar protocolos:", error);
  }
  return [];
};

// Save a new protocolo to localStorage
export const saveProtocolo = (protocolo: ProtocoloData): void => {
  try {
    // Get existing protocolos
    const existingProtocolos = getProtocolos();
    
    // Add the new protocolo
    const updatedProtocolos = [...existingProtocolos, protocolo];
    
    // Save to localStorage
    localStorage.setItem(
      PROTOCOLOS_STORAGE_KEY, 
      JSON.stringify(updatedProtocolos)
    );
    
    console.log(`Protocolo ${protocolo.numero} salvo com sucesso`);
  } catch (error) {
    console.error("Erro ao salvar protocolo:", error);
    throw new Error("Não foi possível salvar o protocolo");
  }
};

// Get a specific protocolo by its number
export const getProtocoloByNumero = (numero: string): ProtocoloData | undefined => {
  const protocolos = getProtocolos();
  return protocolos.find(p => p.numero === numero);
};

// Check if a protocolo number already exists
export const protocoloExists = (numero: string): boolean => {
  const protocolos = getProtocolos();
  return protocolos.some(p => p.numero === numero);
};

// Generate a unique protocolo number
export const generateUniqueProtocoloNumber = (): string => {
  let protocoloNumber: string;
  
  do {
    // Generate random part (alphanumeric)
    const randomPart = Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase();
      
    protocoloNumber = `C-${randomPart}`;
  } while (protocoloExists(protocoloNumber));
  
  return protocoloNumber;
};
