
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getProtocoloByNumero } from '@/utils/protocoloStorage';
import { toast } from 'sonner';
import { DraftType } from '@/types';

interface ProtocoloSearchProps {
  documentType?: DraftType;
}

const ProtocoloSearch: React.FC<ProtocoloSearchProps> = ({ documentType = 'Inventário' }) => {
  const [protocolo, setProtocolo] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = () => {
    if (!protocolo.trim()) {
      toast.error('Por favor, insira um número de protocolo válido');
      return;
    }

    setLoading(true);
    
    try {
      const protocoloData = getProtocoloByNumero(protocolo);
      
      if (!protocoloData) {
        toast.error('Protocolo não encontrado');
        setLoading(false);
        return;
      }
      
      // Generate a unique ID for the draft
      const draftId = Math.random().toString(36).substring(2, 9);
      
      const newDraft = {
        id: draftId,
        title: `Minuta - ${protocoloData.nome}`,
        type: documentType,
        content: protocoloData.conteudo || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        protocoloInfo: {
          numero: protocoloData.numero,
          dataGeracao: protocoloData.dataGeracao,
          nome: protocoloData.nome,
          cpf: protocoloData.cpf
        }
      };
      
      // Store draft in session storage
      sessionStorage.setItem('generatedDraft', JSON.stringify(newDraft));
      
      toast.success('Protocolo encontrado! Redirecionando para a minuta...');
      
      setTimeout(() => {
        navigate(`/view/new`);
      }, 1000);
    } catch (error) {
      console.error('Erro ao buscar protocolo:', error);
      toast.error('Ocorreu um erro ao buscar o protocolo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 items-center justify-center">
        <div className="w-full max-w-md">
          <div className="space-y-2">
            <label htmlFor="protocolo" className="block text-sm font-medium">
              Número do Protocolo
            </label>
            <Input
              id="protocolo"
              type="text"
              placeholder="Ex: C-ABCD1234"
              value={protocolo}
              onChange={(e) => setProtocolo(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
        
        <Button 
          onClick={handleSearch} 
          disabled={loading}
          className="w-full max-w-md"
        >
          {loading ? 'Buscando...' : 'Buscar Protocolo'}
        </Button>
      </div>
      
      <div className="text-center mt-4 text-sm text-muted-foreground">
        <p>Digite o número do protocolo gerado anteriormente no sistema.</p>
        <p>Será criada uma minuta baseada nos dados desse protocolo.</p>
      </div>
    </div>
  );
};

export default ProtocoloSearch;
