
import React from 'react';
import { Link } from 'react-router-dom';
import { Draft } from '@/types';
import { FileText, Edit, Trash2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DraftCardProps {
  draft: Draft;
  onDelete: (id: string) => void;
}

const DraftCard: React.FC<DraftCardProps> = ({ draft, onDelete }) => {
  const { toast } = useToast();
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleDelete = () => {
    if (window.confirm('Tem certeza que deseja excluir esta minuta?')) {
      onDelete(draft.id);
      toast({
        title: "Minuta excluída",
        description: "A minuta foi excluída com sucesso."
      });
    }
  };

  return (
    <div className="glass rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="rounded-full bg-secondary p-2">
              <FileText className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="font-serif font-medium text-lg leading-tight">{draft.title}</h3>
              <p className="text-sm text-muted-foreground">
                <span className="inline-block bg-muted px-2 py-0.5 rounded-full text-xs">
                  {draft.type}
                </span>
                <span className="ml-2">{formatDate(draft.createdAt)}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-muted/30 px-5 py-3 flex justify-end space-x-2">
        <Link 
          to={`/view/${draft.id}`} 
          className="button-ghost p-2 h-8 w-8"
          aria-label="Ver minuta"
        >
          <Eye className="h-4 w-4" />
        </Link>
        <Link 
          to={`/edit/${draft.id}`} 
          className="button-ghost p-2 h-8 w-8"
          aria-label="Editar minuta"
        >
          <Edit className="h-4 w-4" />
        </Link>
        <button 
          onClick={handleDelete} 
          className="button-ghost p-2 h-8 w-8 text-destructive hover:bg-destructive/10"
          aria-label="Excluir minuta"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default DraftCard;
