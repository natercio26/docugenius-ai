
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Database, FileText, User, ArrowLeft } from 'lucide-react';

import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useProtocolo } from "@/contexts/ProtocoloContext";
import { ProtocoloData } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMobile } from "@/hooks/use-mobile";

const ProtocolosDatabase: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [protocolos, setProtocolos] = useState<ProtocoloData[]>([]);
  const [filteredProtocolos, setFilteredProtocolos] = useState<ProtocoloData[]>([]);
  const [selectedProtocolo, setSelectedProtocolo] = useState<ProtocoloData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getAllProtocolos, searchProtocolos } = useProtocolo();
  const isMobile = useMobile();

  // Load all protocolos on component mount
  useEffect(() => {
    const allProtocolos = getAllProtocolos();
    setProtocolos(allProtocolos);
    setFilteredProtocolos(allProtocolos);
  }, [getAllProtocolos]);

  // Handle search input change
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

  // Format date for display
  const formatDate = (date: Date): string => {
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

  // Open protocol details
  const viewProtocolDetails = (protocolo: ProtocoloData) => {
    setSelectedProtocolo(protocolo);
    setIsDetailsOpen(true);
  };

  // Close details dialog/drawer
  const closeDetails = () => {
    setIsDetailsOpen(false);
  };

  // Handle back button
  const handleBack = () => {
    navigate('/cadastro');
  };

  // Format CPF for display
  const formatCpf = (cpf: string): string => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  // Render details dialog (desktop) or drawer (mobile)
  const renderDetailsModal = () => {
    if (!selectedProtocolo) return null;

    const modalContent = (
      <>
        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Dados Pessoais</h3>
              <Badge variant="outline" className="font-mono">
                {selectedProtocolo.numero}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium">{selectedProtocolo.nome}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CPF</p>
                <p className="font-medium">{formatCpf(selectedProtocolo.cpf)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data de Cadastro</p>
                <p className="font-medium">{formatDate(selectedProtocolo.dataGeracao)}</p>
              </div>
            </div>

            {selectedProtocolo.registrationData && (
              <>
                <div className="pt-4 border-t">
                  <h3 className="text-lg font-medium mb-4">Informações Detalhadas</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">RG</p>
                      <p className="font-medium">{selectedProtocolo.registrationData.personalInfo.rg}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                      <p className="font-medium">{selectedProtocolo.registrationData.personalInfo.birthDate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Naturalidade</p>
                      <p className="font-medium">
                        {selectedProtocolo.registrationData.personalInfo.naturality}, 
                        {selectedProtocolo.registrationData.personalInfo.uf}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Profissão</p>
                      <p className="font-medium">{selectedProtocolo.registrationData.personalInfo.profession}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Estado Civil</p>
                      <p className="font-medium">{selectedProtocolo.registrationData.personalInfo.civilStatus}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Filiação</p>
                      <p className="font-medium">{selectedProtocolo.registrationData.personalInfo.filiation}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Endereço</p>
                      <p className="font-medium">{selectedProtocolo.registrationData.personalInfo.address}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">E-mail</p>
                      <p className="font-medium">{selectedProtocolo.registrationData.personalInfo.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Telefone</p>
                      <p className="font-medium">{selectedProtocolo.registrationData.personalInfo.phone}</p>
                    </div>
                  </div>

                  {selectedProtocolo.registrationData.type === 'casado' && selectedProtocolo.registrationData.spouseInfo && (
                    <div className="pt-4 mt-4 border-t">
                      <h3 className="text-lg font-medium mb-4">Dados do Cônjuge</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Nome</p>
                          <p className="font-medium">{selectedProtocolo.registrationData.spouseInfo.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">CPF</p>
                          <p className="font-medium">{formatCpf(selectedProtocolo.registrationData.spouseInfo.cpf)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">RG</p>
                          <p className="font-medium">{selectedProtocolo.registrationData.spouseInfo.rg}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                          <p className="font-medium">{selectedProtocolo.registrationData.spouseInfo.birthDate}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Naturalidade</p>
                          <p className="font-medium">
                            {selectedProtocolo.registrationData.spouseInfo.naturality}, 
                            {selectedProtocolo.registrationData.spouseInfo.uf}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Profissão</p>
                          <p className="font-medium">{selectedProtocolo.registrationData.spouseInfo.profession}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {selectedProtocolo.textoQualificacao && (
              <div className="pt-4 border-t">
                <h3 className="text-lg font-medium mb-2">Texto de Qualificação</h3>
                <div className="bg-slate-50 p-4 rounded-md">
                  <p className="text-sm whitespace-pre-line">{selectedProtocolo.textoQualificacao}</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button 
            variant="outline" 
            onClick={closeDetails}
          >
            Fechar
          </Button>
        </div>
      </>
    );

    if (isMobile) {
      return (
        <Drawer open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Detalhes do Protocolo</DrawerTitle>
            </DrawerHeader>
            {modalContent}
            <DrawerFooter>
              <Button onClick={closeDetails}>Fechar</Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      );
    }

    return (
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Protocolo</DialogTitle>
            <DialogDescription>
              Informações completas do cadastro
            </DialogDescription>
          </DialogHeader>
          
          {modalContent}
          
          <DialogFooter>
            <Button onClick={closeDetails}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
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
            <div className="flex w-full max-w-sm items-center space-x-2 mb-6">
              <Input
                type="search"
                placeholder="Buscar por nome, CPF ou nº protocolo..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full"
              />
              <Button type="submit" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            {filteredProtocolos.length === 0 ? (
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
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Nº Protocolo</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead className="hidden md:table-cell">Data Cadastro</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProtocolos.map((protocolo) => (
                      <TableRow key={protocolo.numero}>
                        <TableCell className="font-mono">{protocolo.numero}</TableCell>
                        <TableCell>{protocolo.nome}</TableCell>
                        <TableCell>{formatCpf(protocolo.cpf)}</TableCell>
                        <TableCell className="hidden md:table-cell">{formatDate(protocolo.dataGeracao)}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => viewProtocolDetails(protocolo)}
                            className="h-8"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t bg-slate-50 py-3 text-xs text-muted-foreground">
            Total de {filteredProtocolos.length} protocolos encontrados
          </CardFooter>
        </Card>
      </div>
      
      {renderDetailsModal()}
    </>
  );
};

export default ProtocolosDatabase;
