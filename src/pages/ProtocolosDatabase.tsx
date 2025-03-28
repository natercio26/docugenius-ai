
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, ArrowLeft } from 'lucide-react';

import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useProtocolo } from "@/contexts/ProtocoloContext";
import { ProtocoloData } from "@/types";
import { useIsMobile } from "@/hooks/use-mobile";

// Import the new components
import ProtocoloSearchBar from "@/components/protocolos/ProtocoloSearchBar";
import ProtocoloTable from "@/components/protocolos/ProtocoloTable";
import ProtocoloDetailsModal from "@/components/protocolos/ProtocoloDetailsModal";
import ProtocoloEmptyState from "@/components/protocolos/ProtocoloEmptyState";

const ProtocolosDatabase: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [protocolos, setProtocolos] = useState<ProtocoloData[]>([]);
  const [filteredProtocolos, setFilteredProtocolos] = useState<ProtocoloData[]>([]);
  const [selectedProtocolo, setSelectedProtocolo] = useState<ProtocoloData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getAllProtocolos, searchProtocolos } = useProtocolo();
  const isMobile = useIsMobile();

  useEffect(() => {
    const allProtocolos = getAllProtocolos();
    setProtocolos(allProtocolos);
    setFilteredProtocolos(allProtocolos);
  }, [getAllProtocolos]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setFilteredProtocolos(protocolos);
    } else {
      const results = searchProtocolos(query);
      setFilteredProtocolos(results);
    }
  };

  const viewProtocolDetails = (protocolo: ProtocoloData) => {
    setSelectedProtocolo(protocolo);
    setIsDetailsOpen(true);
  };

  const closeDetails = () => {
    setIsDetailsOpen(false);
  };

  const handleBack = () => {
    navigate('/cadastro');
  };

  return (
    <>
      <Navbar />
      <div className="container py-8 max-w-7xl mx-auto">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-primary" />
              <CardTitle>Banco de Dados de Cadastros</CardTitle>
            </div>
            <Button 
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="h-8 gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </CardHeader>
          <CardContent>
            <ProtocoloSearchBar 
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
            />
            
            {filteredProtocolos.length === 0 ? (
              <ProtocoloEmptyState searchQuery={searchQuery} />
            ) : (
              <ProtocoloTable 
                protocolos={filteredProtocolos}
                onViewDetails={viewProtocolDetails}
              />
            )}
          </CardContent>
          <CardFooter className="border-t bg-slate-50 py-3 text-xs text-muted-foreground">
            Total de {filteredProtocolos.length} protocolos encontrados
          </CardFooter>
        </Card>
      </div>
      
      <ProtocoloDetailsModal 
        protocolo={selectedProtocolo}
        isOpen={isDetailsOpen}
        onClose={closeDetails}
        isMobile={isMobile}
      />
    </>
  );
};

export default ProtocolosDatabase;
