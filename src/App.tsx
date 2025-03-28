
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import * as React from "react";
import { ProtocoloProvider } from "./contexts/ProtocoloContext";
import Index from "./pages/Index";
import Upload from "./pages/Upload";
import ViewDraft from "./pages/ViewDraft";
import ModelConfig from "./pages/ModelConfig";
import Cadastro from "./pages/Cadastro";
import CadastroSolteiro from "./pages/CadastroSolteiro";
import CadastroCasado from "./pages/CadastroCasado";
import RevisaoDados from "./pages/RevisaoDados";
import DocumentoGerado from "./pages/DocumentoGerado";
import ProtocoloGerado from "./pages/ProtocoloGerado";
import ProtocolosDatabase from "./pages/ProtocolosDatabase";
import NotFound from "./pages/NotFound";

const App: React.FC = () => {
  const [queryClient] = React.useState(() => new QueryClient());

  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ProtocoloProvider>
          <BrowserRouter>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/view/:id" element={<ViewDraft />} />
                <Route path="/edit/:id" element={<ViewDraft />} />
                <Route path="/config" element={<ModelConfig />} />
                <Route path="/cadastro" element={<Cadastro />} />
                <Route path="/cadastro/solteiro" element={<CadastroSolteiro />} />
                <Route path="/cadastro/casado" element={<CadastroCasado />} />
                <Route path="/cadastro/revisar" element={<RevisaoDados />} />
                <Route path="/cadastro/documento" element={<DocumentoGerado />} />
                <Route path="/cadastro/protocolo" element={<ProtocoloGerado />} />
                <Route path="/cadastro/database" element={<ProtocolosDatabase />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TooltipProvider>
          </BrowserRouter>
        </ProtocoloProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;
