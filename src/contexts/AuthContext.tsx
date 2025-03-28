
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase, mockAuthState } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  name: string;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: React.ReactNode;
}

// Check if we're in development mode with no Supabase keys
const useMockAuth = import.meta.env.DEV && 
  (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    if (useMockAuth) {
      // Use mock auth for development without Supabase credentials
      console.info('Using mock authentication for development');
      setUser({
        id: mockAuthState.user.id,
        email: mockAuthState.user.email,
        name: mockAuthState.user.name,
        isAdmin: false, // Default to non-admin for mock auth
      });
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    // Real Supabase auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        handleAuthChange(session);
      }
    );

    // Get initial session
    initializeAuth();

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  // Initialize auth from Supabase session
  const initializeAuth = async () => {
    setIsLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      handleAuthChange(session);
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle auth state changes
  const handleAuthChange = (session: Session | null) => {
    if (session?.user) {
      const supaUser = session.user;
      
      // Convert Supabase user to our User format
      const formattedUser: User = {
        id: supaUser.id,
        email: supaUser.email || '',
        name: supaUser.user_metadata?.name || supaUser.email?.split('@')[0] || 'User',
        isAdmin: supaUser.user_metadata?.isAdmin || false,
      };
      
      setUser(formattedUser);
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    if (useMockAuth) {
      // Simulate login for development
      setUser({
        id: mockAuthState.user.id,
        email: email,
        name: email.split('@')[0] || 'User',
        isAdmin: email.includes('admin'), // Simple mock check - if email contains 'admin'
      });
      setIsAuthenticated(true);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      throw new Error(error.message);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    if (useMockAuth) {
      // Simulate logout for development
      setUser(null);
      setIsAuthenticated(false);
      return;
    }

    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error logging out:', error);
    }
  };

  // Show loading state while initializing auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
