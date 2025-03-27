
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const location = useLocation();
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center">
        <div className="mr-4">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-serif text-2xl font-bold">Documentum</span>
          </Link>
        </div>
        <nav className="flex flex-1 items-center justify-end space-x-2">
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
            to="/config" 
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              location.pathname === '/config' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Configurações
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
