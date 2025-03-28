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
  login: (email: string, password: string, isAdmin?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  createAdminUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  createAdminUser: async () => {},
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

  // Create admin user function
  const createAdminUser = async (): Promise<void> => {
    if (useMockAuth) {
      console.log('Mock admin user created successfully');
      return;
    }

    const adminEmail = 'adminlicencedocumentum';
    const adminPassword = 'adminlicence';
    
    try {
      // Check if admin user already exists
      const { data: existingUsers, error: searchError } = await supabase
        .from('auth.users')
        .select('*')
        .eq('email', adminEmail)
        .single();
      
      if (searchError && searchError.code !== 'PGRST116') {
        console.error('Error checking for existing admin:', searchError);
      }
      
      if (existingUsers) {
        console.log('Admin user already exists');
        return;
      }
      
      // Create the admin user
      const { data, error } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
        options: {
          data: {
            isAdmin: true,
            name: 'Admin Documentum',
          }
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      console.log('Admin user created successfully');
    } catch (error) {
      console.error('Error creating admin user:', error);
    }
  };

  // Login function
  const login = async (email: string, password: string, isAdmin: boolean = false): Promise<void> => {
    if (useMockAuth) {
      // Simulate login for development
      const isMockAdmin = email === 'adminlicencedocumentum';
      
      // If trying to login as admin but not using admin credentials
      if (isAdmin && !isMockAdmin) {
        throw new Error('Você não tem permissões de administrador');
      }
      
      setUser({
        id: mockAuthState.user.id,
        email: email,
        name: email.split('@')[0] || 'User',
        isAdmin: isMockAdmin && isAdmin, // Only set admin if correct credentials AND admin login selected
      });
      setIsAuthenticated(true);
      return;
    }

    // For real authentication
    try {
      // First, check if trying to login as admin
      if (isAdmin) {
        // Verify this is the correct admin account
        if (email !== 'adminlicencedocumentum') {
          throw new Error('Você não tem permissões de administrador');
        }
      }
      
      // Proceed with authentication
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      // If we're logging in as admin, verify the account has admin privileges
      if (isAdmin) {
        const { data: userData } = await supabase.auth.getUser();
        const userIsAdmin = userData?.user?.user_metadata?.isAdmin || email === 'adminlicencedocumentum';
        
        if (!userIsAdmin) {
          // If not admin, sign out and throw error
          await supabase.auth.signOut();
          throw new Error('Você não tem permissões de administrador');
        }
      }
    } catch (error) {
      // Re-throw any errors to be handled by the login component
      throw error;
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
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, createAdminUser }}>
      {children}
    </AuthContext.Provider>
  );
};
