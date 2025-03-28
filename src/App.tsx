
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import * as React from "react";
import Index from "./pages/Index";
import Upload from "./pages/Upload";
import ViewDraft from "./pages/ViewDraft";
import ModelConfig from "./pages/ModelConfig";
import Cadastro from "./pages/Cadastro";
import CadastroSolteiro from "./pages/CadastroSolteiro";
import NotFound from "./pages/NotFound";

const App: React.FC = () => {
  const [queryClient] = React.useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/view/:id" element={<ViewDraft />} />
            <Route path="/edit/:id" element={<ViewDraft />} />
            <Route path="/config" element={<ModelConfig />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/cadastro/solteiro" element={<CadastroSolteiro />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
