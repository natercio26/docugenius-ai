
import React from 'react';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { ProtocoloData } from "@/types";

interface ProtocoloTableProps {
  protocolos: ProtocoloData[];
  onViewDetails: (protocolo: ProtocoloData) => void;
}

const ProtocoloTable: React.FC<ProtocoloTableProps> = ({ 
  protocolos,
  onViewDetails
}) => {
  const formatDate = (date: Date): string => {
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

  const formatCpf = (cpf: string): string => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  if (protocolos.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
          <FileText className="h-8 w-8 text-slate-500" />
        </div>
        <h3 className="text-lg font-medium">Nenhum resultado encontrado</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Tente outros termos de busca
        </p>
      </div>
    );
  }

  return (
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
          {protocolos.map((protocolo) => (
            <TableRow key={protocolo.numero}>
              <TableCell className="font-mono">{protocolo.numero}</TableCell>
              <TableCell>{protocolo.nome}</TableCell>
              <TableCell>{formatCpf(protocolo.cpf)}</TableCell>
              <TableCell className="hidden md:table-cell">{formatDate(protocolo.dataGeracao)}</TableCell>
              <TableCell className="text-right">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onViewDetails(protocolo)}
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
  );
};

export default ProtocoloTable;
