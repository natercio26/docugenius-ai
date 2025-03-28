
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import * as React from "react";
import { ProtocoloProvider } from "./contexts/ProtocoloContext";
import { AuthProvider } from "./contexts/AuthContext";
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
import Login from "./pages/Login";
import { useAuth } from "./contexts/AuthContext";

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
      <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
      <Route path="/view/:id" element={<ProtectedRoute><ViewDraft /></ProtectedRoute>} />
      <Route path="/edit/:id" element={<ProtectedRoute><ViewDraft /></ProtectedRoute>} />
      <Route path="/config" element={<ProtectedRoute><ModelConfig /></ProtectedRoute>} />
      <Route path="/cadastro" element={<ProtectedRoute><Cadastro /></ProtectedRoute>} />
      <Route path="/cadastro/solteiro" element={<ProtectedRoute><CadastroSolteiro /></ProtectedRoute>} />
      <Route path="/cadastro/casado" element={<ProtectedRoute><CadastroCasado /></ProtectedRoute>} />
      <Route path="/cadastro/revisar" element={<ProtectedRoute><RevisaoDados /></ProtectedRoute>} />
      <Route path="/cadastro/documento" element={<ProtectedRoute><DocumentoGerado /></ProtectedRoute>} />
      <Route path="/cadastro/protocolo" element={<ProtectedRoute><ProtocoloGerado /></ProtectedRoute>} />
      <Route path="/cadastro/database" element={<ProtectedRoute><ProtocolosDatabase /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App: React.FC = () => {
  const [queryClient] = React.useState(() => new QueryClient());

  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ProtocoloProvider>
            <BrowserRouter>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <AppRoutes />
              </TooltipProvider>
            </BrowserRouter>
          </ProtocoloProvider>
        </AuthProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;
