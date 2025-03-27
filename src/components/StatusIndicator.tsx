
import React from 'react';
import { UploadStatus } from '@/types';
import { FileText, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

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
      {status === 'uploading' && (
        <RefreshCw className="h-4 w-4 animate-spin" />
      )}
      {status === 'processing' && (
        <FileText className="h-4 w-4 animate-pulse" />
      )}
      {status === 'success' && (
        <CheckCircle className="h-4 w-4 text-green-500" />
      )}
      {status === 'error' && (
        <XCircle className="h-4 w-4 text-red-500" />
      )}
      <span>{getMessage()}</span>
    </div>
  );
};

export default StatusIndicator;
