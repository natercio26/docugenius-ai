
import React from 'react';
import { Database } from 'lucide-react';

interface ProtocoloEmptyStateProps {
  searchQuery: string;
}

const ProtocoloEmptyState: React.FC<ProtocoloEmptyStateProps> = ({ searchQuery }) => {
  return (
    <div className="text-center py-10">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
        <Database className="h-8 w-8 text-slate-500" />
      </div>
      <h3 className="text-lg font-medium">Nenhum resultado encontrado</h3>
      <p className="text-sm text-muted-foreground mt-2">
        {searchQuery 
          ? "Tente outros termos de busca" 
          : "Nenhum protocolo cadastrado ainda"}
      </p>
    </div>
  );
};

export default ProtocoloEmptyState;
