
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getProtocoloByNumero } from '@/utils/protocoloStorage';
import { toast } from 'sonner';
import { DraftType, RegistrationData } from '@/types';

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
      // Clear any existing draft from session storage first
      sessionStorage.removeItem('generatedDraft');
      
      const protocoloData = getProtocoloByNumero(protocolo);
      
      if (!protocoloData) {
        toast.error('Protocolo não encontrado');
        setLoading(false);
        return;
      }
      
      // Generate a unique ID for the draft
      const draftId = Math.random().toString(36).substring(2, 9);
      
      // Map registration data to document fields for the qualifications section
      const registrationData = protocoloData.registrationData as RegistrationData;
      let documentContent = protocoloData.conteudo || '';

      // Create a mapped object of extracted data from registration
      const extractedData: Record<string, string> = {};
      
      if (registrationData) {
        const { personalInfo, spouseInfo } = registrationData;
        
        // Map personal info
        if (personalInfo) {
          extractedData['nome'] = personalInfo.name;
          extractedData['cpf'] = personalInfo.cpf;
          extractedData['rg'] = personalInfo.rg;
          extractedData['endereco'] = personalInfo.address;
          extractedData['profissao'] = personalInfo.profession || '';
          extractedData['estadoCivil'] = personalInfo.civilStatus || '';
          extractedData['nacionalidade'] = 'brasileiro(a)';
          
          // For inventory document type, map to specific heir fields
          if (documentType === 'Inventário') {
            extractedData['herdeiro1'] = personalInfo.name;
            extractedData['cpfHerdeiro1'] = personalInfo.cpf;
            extractedData['rgHerdeiro1'] = personalInfo.rg;
            extractedData['enderecoHerdeiro1'] = personalInfo.address;
            extractedData['profissaoHerdeiro1'] = personalInfo.profession || '';
            extractedData['estadoCivilHerdeiro1'] = personalInfo.civilStatus || '';
          }
        }
        
        // Map spouse info if available
        if (spouseInfo) {
          extractedData['conjuge'] = spouseInfo.name;
          extractedData['cpfConjuge'] = spouseInfo.cpf;
          extractedData['rgConjuge'] = spouseInfo.rg;
          
          // For inventory, spouse might be viuvo-meeiro depending on context
          if (documentType === 'Inventário') {
            extractedData['viuvoMeeiro'] = spouseInfo.name;
          }
        }
        
        // For inventory, assume registered person is a heir
        if (documentType === 'Inventário') {
          // Create a formatted qualification string for the placeholder
          const heirQualification = `${personalInfo.name}, ${personalInfo.naturality ? personalInfo.naturality : 'brasileiro(a)'}, ${personalInfo.civilStatus || 'maior e capaz'}, ${personalInfo.profession || 'profissão não informada'}, portador(a) da cédula de identidade RG nº ${personalInfo.rg}, inscrito(a) no CPF/MF sob nº ${personalInfo.cpf}, residente e domiciliado(a) ${personalInfo.address}`;
          
          // Replace placeholders in the document content
          documentContent = documentContent.replace(/¿qualificacao_do\(a\)\(s\)_herdeiro\(a\)\(s\)>/g, heirQualification);
        }
      }
      
      const newDraft = {
        id: draftId,
        title: `Minuta - ${protocoloData.nome || 'Novo Documento'}`,
        type: documentType,
        content: documentContent,
        createdAt: new Date(),
        updatedAt: new Date(),
        protocoloInfo: {
          numero: protocoloData.numero,
          dataGeracao: protocoloData.dataGeracao,
          nome: protocoloData.nome,
          cpf: protocoloData.cpf
        },
        extractedData: extractedData
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
