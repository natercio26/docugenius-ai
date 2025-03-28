
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ProtocoloSearchBarProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ProtocoloSearchBar: React.FC<ProtocoloSearchBarProps> = ({ 
  searchQuery,
  onSearchChange
}) => {
  return (
    <div className="flex w-full max-w-sm items-center space-x-2 mb-6">
      <Input
        type="search"
        placeholder="Buscar por nome, CPF ou nº protocolo..."
        value={searchQuery}
        onChange={onSearchChange}
        className="w-full"
      />
      <Button type="submit" size="icon">
        <Search className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ProtocoloSearchBar;
