
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import DraftCard from '@/components/DraftCard';
import { Draft } from '@/types';
import { Plus } from 'lucide-react';

// Mock data for demonstration purposes
const mockDrafts: Draft[] = [
  {
    id: '1',
    title: 'Escritura de Compra e Venda - Imóvel Residencial',
    type: 'Escritura de Compra e Venda',
    content: 'Conteúdo da escritura de compra e venda...',
    createdAt: new Date('2023-09-15T10:30:00'),
    updatedAt: new Date('2023-09-15T10:30:00')
  },
  {
    id: '2',
    title: 'Inventário - Espólio de João da Silva',
    type: 'Inventário',
    content: 'Conteúdo do inventário...',
    createdAt: new Date('2023-09-10T14:45:00'),
    updatedAt: new Date('2023-09-12T09:20:00')
  },
  {
    id: '3',
    title: 'Procuração - Representação Jurídica',
    type: 'Procuração',
    content: 'Conteúdo da procuração...',
    createdAt: new Date('2023-09-05T16:15:00'),
    updatedAt: new Date('2023-09-05T16:15:00')
  }
];

const Index: React.FC = () => {
  const [drafts, setDrafts] = useState<Draft[]>(mockDrafts);

  const handleDeleteDraft = (id: string) => {
    setDrafts(drafts.filter(draft => draft.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="page-container">
        <div className="flex justify-between items-center mb-8">
          <h1 className="heading-1">Dashboard</h1>
          <Link to="/upload" className="button-primary flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Nova Minuta</span>
          </Link>
        </div>
        
        <section className="mb-12 animate-slide-in" style={{ animationDelay: '100ms' }}>
          <h2 className="heading-2 mb-4">Minutas Recentes</h2>
          {drafts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {drafts.map((draft, index) => (
                <div key={draft.id} className="animate-scale-in" style={{ animationDelay: `${150 + index * 50}ms` }}>
                  <DraftCard draft={draft} onDelete={handleDeleteDraft} />
                </div>
              ))}
            </div>
          ) : (
            <div className="glass rounded-lg p-8 text-center">
              <p className="text-muted-foreground mb-4">Você ainda não possui minutas geradas.</p>
              <Link to="/upload" className="button-primary">
                Criar Primeira Minuta
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Index;
