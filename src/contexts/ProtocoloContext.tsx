
import React, { createContext, useContext, ReactNode } from 'react';
import { ProtocoloData } from '@/types';
import { 
  getProtocolos, 
  saveProtocolo, 
  getProtocoloByNumero, 
  generateUniqueProtocoloNumber 
} from '@/utils/protocoloStorage';

interface ProtocoloContextType {
  getAllProtocolos: () => ProtocoloData[];
  saveNewProtocolo: (protocolo: Omit<ProtocoloData, 'numero' | 'dataGeracao'>) => ProtocoloData;
  getProtocoloByNumber: (numero: string) => ProtocoloData | undefined;
  generateProtocoloNumber: () => string;
}

const ProtocoloContext = createContext<ProtocoloContextType | undefined>(undefined);

export const ProtocoloProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Get all protocols
  const getAllProtocolos = (): ProtocoloData[] => {
    return getProtocolos();
  };

  // Save a new protocol and generate a number
  const saveNewProtocolo = (data: Omit<ProtocoloData, 'numero' | 'dataGeracao'>): ProtocoloData => {
    // Generate a unique protocol number
    const numero = generateUniqueProtocoloNumber();
    
    // Create the complete protocol data
    const newProtocolo: ProtocoloData = {
      ...data,
      numero,
      dataGeracao: new Date()
    };
    
    // Save to storage
    saveProtocolo(newProtocolo);
    
    return newProtocolo;
  };

  // Get a protocol by its number
  const getProtocoloByNumber = (numero: string): ProtocoloData | undefined => {
    return getProtocoloByNumero(numero);
  };

  // Generate a unique protocol number
  const generateProtocoloNumber = (): string => {
    return generateUniqueProtocoloNumber();
  };

  const value = {
    getAllProtocolos,
    saveNewProtocolo,
    getProtocoloByNumber,
    generateProtocoloNumber
  };

  return (
    <ProtocoloContext.Provider value={value}>
      {children}
    </ProtocoloContext.Provider>
  );
};

// Custom hook to use the protocolo context
export const useProtocolo = () => {
  const context = useContext(ProtocoloContext);
  
  if (context === undefined) {
    throw new Error('useProtocolo must be used within a ProtocoloProvider');
  }
  
  return context;
};
