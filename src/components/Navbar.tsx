
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Navbar: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logout realizado",
        description: "Você saiu do sistema com sucesso",
      });
      navigate('/login');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao fazer logout",
        description: "Ocorreu um erro ao tentar sair do sistema"
      });
    }
  };
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center">
        <div className="mr-4">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-serif text-2xl font-bold">Documentum</span>
          </Link>
        </div>
        <nav className="flex flex-1 items-center justify-end space-x-2">
          {isAuthenticated ? (
            <>
              <Link 
                to="/" 
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  location.pathname === '/' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Dashboard
              </Link>
              <Link 
                to="/upload" 
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  location.pathname === '/upload' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Nova Minuta
              </Link>
              <Link 
                to="/cadastro" 
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  location.pathname === '/cadastro' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Cadastro
              </Link>
              <Link 
                to="/config" 
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  location.pathname === '/config' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Configurações
              </Link>
              <div className="ml-4 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {user?.name}
                </span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Sair
                </Button>
              </div>
            </>
          ) : (
            <Link to="/login">
              <Button variant="outline" size="sm">
                Entrar
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
