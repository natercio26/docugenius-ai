
import React from 'react';
import { ProtocoloData } from "@/types";
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
import ModalContent from './details/ModalContent';

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

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Detalhes do Protocolo</DrawerTitle>
          </DrawerHeader>
          <ModalContent protocolo={protocolo} onClose={onClose} />
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
        
        <ModalContent protocolo={protocolo} onClose={onClose} />
        
        <DialogFooter>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProtocoloDetailsModal;
