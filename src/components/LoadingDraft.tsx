
import React from 'react';
import Navbar from '@/components/Navbar';

const LoadingDraft: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="page-container py-8">
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Carregando minuta...</p>
        </div>
      </main>
    </div>
  );
};

export default LoadingDraft;
