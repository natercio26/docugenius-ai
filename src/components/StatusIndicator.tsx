
import React from 'react';
import { UploadStatus } from '@/types';

interface StatusIndicatorProps {
  status: UploadStatus;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status }) => {
  const getMessage = () => {
    switch (status) {
      case 'uploading':
        return 'Enviando documentos...';
      case 'processing':
        return 'Lendo documento...';
      case 'success':
        return 'Minuta gerada com sucesso!';
      case 'error':
        return 'Erro ao processar!';
      default:
        return '';
    }
  };

  if (status === 'idle') return null;

  return (
    <div className="flex items-center space-x-2">
      {(status === 'uploading' || status === 'processing') && (
        <div className="animate-spin h-4 w-4 border-2 border-foreground rounded-full border-t-transparent"></div>
      )}
      <span>{getMessage()}</span>
    </div>
  );
};

export default StatusIndicator;
