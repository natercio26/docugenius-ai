
import React from 'react';
import { ProtocoloData } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerFooter 
} from "@/components/ui/drawer";

interface ProtocoloDetailsModalProps {
  protocolo: ProtocoloData | null;
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

const ProtocoloDetailsModal: React.FC<ProtocoloDetailsModalProps> = ({ 
  protocolo, 
  isOpen, 
  onClose,
  isMobile
}) => {
  if (!protocolo) return null;

  const formatCpf = (cpf: string): string => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatDate = (date: Date): string => {
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

  const modalContent = (
    <>
      <ScrollArea className="max-h-[70vh]">
        <div className="space-y-6 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Dados Pessoais</h3>
            <Badge variant="outline" className="font-mono">
              {protocolo.numero}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nome</p>
              <p className="font-medium">{protocolo.nome}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">CPF</p>
              <p className="font-medium">{formatCpf(protocolo.cpf)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data de Cadastro</p>
              <p className="font-medium">{formatDate(protocolo.dataGeracao)}</p>
            </div>
          </div>

          {protocolo.registrationData && (
            <>
              <div className="pt-4 border-t">
                <h3 className="text-lg font-medium mb-4">Informações Detalhadas</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">RG</p>
                    <p className="font-medium">{protocolo.registrationData.personalInfo.rg}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Órgão Expedidor</p>
                    <p className="font-medium">{protocolo.registrationData.personalInfo.issuer || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                    <p className="font-medium">{protocolo.registrationData.personalInfo.birthDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nacionalidade</p>
                    <p className="font-medium">{protocolo.registrationData.personalInfo.nationality || 'Brasileiro(a)'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Naturalidade</p>
                    <p className="font-medium">
                      {protocolo.registrationData.personalInfo.naturality}, 
                      {protocolo.registrationData.personalInfo.uf}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Profissão</p>
                    <p className="font-medium">{protocolo.registrationData.personalInfo.profession}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estado Civil</p>
                    <p className="font-medium">{protocolo.registrationData.personalInfo.civilStatus}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Filiação</p>
                    <p className="font-medium">{protocolo.registrationData.personalInfo.filiation}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Endereço</p>
                    <p className="font-medium">{protocolo.registrationData.personalInfo.address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">E-mail</p>
                    <p className="font-medium">{protocolo.registrationData.personalInfo.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium">{protocolo.registrationData.personalInfo.phone || 'Não informado'}</p>
                  </div>
                </div>

                {protocolo.registrationData.type === 'casado' && protocolo.registrationData.spouseInfo && (
                  <div className="pt-4 mt-4 border-t">
                    <h3 className="text-lg font-medium mb-4">Dados do Cônjuge</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Nome</p>
                        <p className="font-medium">{protocolo.registrationData.spouseInfo.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">CPF</p>
                        <p className="font-medium">{formatCpf(protocolo.registrationData.spouseInfo.cpf)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">RG</p>
                        <p className="font-medium">{protocolo.registrationData.spouseInfo.rg}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Órgão Expedidor</p>
                        <p className="font-medium">{protocolo.registrationData.spouseInfo.issuer || 'Não informado'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                        <p className="font-medium">{protocolo.registrationData.spouseInfo.birthDate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Nacionalidade</p>
                        <p className="font-medium">{protocolo.registrationData.spouseInfo.nationality || 'Brasileiro(a)'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Naturalidade</p>
                        <p className="font-medium">
                          {protocolo.registrationData.spouseInfo.naturality}, 
                          {protocolo.registrationData.spouseInfo.uf}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Profissão</p>
                        <p className="font-medium">{protocolo.registrationData.spouseInfo.profession}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Filiação</p>
                        <p className="font-medium">{protocolo.registrationData.spouseInfo.filiation || 'Não informado'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">Endereço</p>
                        <p className="font-medium">{protocolo.registrationData.spouseInfo.address || 'Mesmo endereço'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {protocolo.textoQualificacao && (
            <div className="pt-4 border-t">
              <h3 className="text-lg font-medium mb-2">Texto de Qualificação</h3>
              <div className="bg-slate-50 p-4 rounded-md">
                <p className="text-sm whitespace-pre-line">{protocolo.textoQualificacao}</p>
              </div>
            </div>
          )}

          {protocolo.conteudo && (
            <div className="pt-4 border-t">
              <h3 className="text-lg font-medium mb-2">Conteúdo Completo</h3>
              <div className="bg-slate-50 p-4 rounded-md">
                <p className="text-sm whitespace-pre-line">{protocolo.conteudo}</p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      <div className="flex justify-end gap-2 mt-4">
        <Button 
          variant="outline" 
          onClick={onClose}
        >
          Fechar
        </Button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Detalhes do Protocolo</DrawerTitle>
          </DrawerHeader>
          {modalContent}
          <DrawerFooter>
            <Button onClick={onClose}>Fechar</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Detalhes do Protocolo</DialogTitle>
          <DialogDescription>
            Informações completas do cadastro
          </DialogDescription>
        </DialogHeader>
        
        {modalContent}
        
        <DialogFooter>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProtocoloDetailsModal;
