
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText } from 'lucide-react';
import { useProtocolo } from '@/contexts/ProtocoloContext';
import { ProtocoloData } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const ProtocoloSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProtocoloData[]>([]);
  const [selectedProtocolo, setSelectedProtocolo] = useState<ProtocoloData | null>(null);
  const { searchProtocolos, getProtocoloByNumber } = useProtocolo();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Campo vazio",
        description: "Por favor, digite um número de protocolo para buscar.",
        variant: "destructive"
      });
      return;
    }

    const results = searchProtocolos(searchQuery);
    setSearchResults(results);

    if (results.length === 0) {
      toast({
        title: "Nenhum resultado",
        description: "Não foi encontrado nenhum protocolo com este número.",
        variant: "destructive"
      });
    } else if (results.length === 1) {
      // If only one result, select it automatically
      setSelectedProtocolo(results[0]);
    }
  };

  const handleSelectProtocolo = (protocolo: ProtocoloData) => {
    setSelectedProtocolo(protocolo);
  };

  const handleCreateDraft = () => {
    if (!selectedProtocolo) return;

    // Create a draft from the protocol data
    const newDraft = {
      id: 'new',
      title: `Minuta - ${selectedProtocolo.nome}`,
      type: 'Outro' as const,
      content: selectedProtocolo.conteudo,
      createdAt: new Date(),
      updatedAt: new Date(),
      protocoloInfo: {
        numero: selectedProtocolo.numero,
        dataGeracao: selectedProtocolo.dataGeracao,
        nome: selectedProtocolo.nome,
        cpf: selectedProtocolo.cpf
      }
    };

    // Store the draft in sessionStorage for the view page to access
    sessionStorage.setItem('generatedDraft', JSON.stringify(newDraft));

    // Navigate to the view page
    navigate('/view/new');

    toast({
      title: "Minuta criada",
      description: `Minuta gerada com base no protocolo ${selectedProtocolo.numero}`
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-8">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Buscar por Número de Protocolo</CardTitle>
          <CardDescription>
            Digite o número de protocolo para encontrar um documento cadastrado
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Digite o número de protocolo (ex: C-ABC12345)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSearch} className="gap-2">
              <Search className="h-4 w-4" />
              Buscar
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-4 space-y-3">
              <h3 className="text-sm font-medium">Resultados da busca:</h3>
              {searchResults.map((protocolo) => (
                <div
                  key={protocolo.numero}
                  className={`p-3 border rounded-md cursor-pointer transition-colors ${
                    selectedProtocolo?.numero === protocolo.numero
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-accent'
                  }`}
                  onClick={() => handleSelectProtocolo(protocolo)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-mono font-bold">{protocolo.numero}</p>
                      <p className="text-sm">{protocolo.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        CPF: {protocolo.cpf} • Gerado em:{' '}
                        {format(new Date(protocolo.dataGeracao), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        {selectedProtocolo && (
          <CardFooter className="flex justify-end border-t pt-4">
            <Button onClick={handleCreateDraft}>
              Criar Minuta com este Protocolo
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default ProtocoloSearch;
