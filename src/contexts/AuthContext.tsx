import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Define if we're using mock authentication in development
const useMockAuth = process.env.NODE_ENV === 'development' && 
  (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY);

interface User {
  id: string;
  email?: string;
  name?: string;
  username?: string;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password: string, isAdmin: boolean) => Promise<void>;
  logout: () => Promise<void>;
  createAdminUser: () => Promise<void>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  login: async () => {},
  logout: async () => {},
  createAdminUser: async () => {},
});

// Export the hook to use the context
export const useAuth = () => useContext(AuthContext);

// Define the provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  
  // Function to create admin user
  const createAdminUser = async (): Promise<void> => {
    if (useMockAuth) {
      console.log('Mock admin user created successfully in development mode');
      return;
    }

    const adminUsername = 'adminlicencedocumentum';
    const adminEmail = `${adminUsername}@documentum.com`;
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
            username: adminUsername
          }
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      console.log('Admin user created successfully');
    } catch (error) {
      console.error('Error creating admin user:', error);
      throw error;
    }
  };

  // Login function
  const login = async (username: string, password: string, isAdminLogin: boolean): Promise<void> => {
    console.log('Attempting login with mock auth:', useMockAuth);
    
    if (useMockAuth) {
      // Mock authentication for development
      console.log('Using mock authentication in development mode');
      const mockUser = {
        id: 'mock-id',
        name: isAdminLogin ? 'Admin User' : 'Regular User',
        username: username,
        isAdmin: isAdminLogin && username === 'adminlicencedocumentum'
      };
      
      setUser(mockUser);
      setIsAuthenticated(true);
      setIsAdmin(isAdminLogin && username === 'adminlicencedocumentum');
      
      // Store in localStorage for persistence
      localStorage.setItem('mockUser', JSON.stringify(mockUser));
      localStorage.setItem('mockIsAuthenticated', 'true');
      localStorage.setItem('mockIsAdmin', String(isAdminLogin && username === 'adminlicencedocumentum'));
      
      console.log('Mock login successful:', mockUser);
      return;
    }

    // Only allow admin login for the specific admin username
    if (isAdminLogin && username !== 'adminlicencedocumentum') {
      throw new Error('Usuário não autorizado como administrador');
    }

    // For Supabase, we need to use email
    const email = username.includes('@') ? username : `${username}@documentum.com`;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data || !data.user) {
        throw new Error('Falha na autenticação');
      }

      const userData = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || username,
        username: data.user.user_metadata?.username || username,
        isAdmin: isAdminLogin && username === 'adminlicencedocumentum'
      };

      setUser(userData);
      setIsAuthenticated(true);
      setIsAdmin(isAdminLogin && username === 'adminlicencedocumentum');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    if (useMockAuth) {
      console.log('Using mock logout in development mode');
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      
      // Clear localStorage
      localStorage.removeItem('mockUser');
      localStorage.removeItem('mockIsAuthenticated');
      localStorage.removeItem('mockIsAdmin');
      
      return;
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error(error.message);
      }
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Session persistence
  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => {
      if (useMockAuth) {
        // Check localStorage for mock session
        console.log('Checking for mock session in development mode');
        const storedUser = localStorage.getItem('mockUser');
        const storedIsAuthenticated = localStorage.getItem('mockIsAuthenticated');
        const storedIsAdmin = localStorage.getItem('mockIsAdmin');
        
        if (storedUser && storedIsAuthenticated === 'true') {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
          setIsAdmin(storedIsAdmin === 'true');
          console.log('Mock session restored:', parsedUser);
        }
        return;
      }

      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session check error:', error);
          return;
        }

        if (data.session) {
          const userData = {
            id: data.session.user.id,
            email: data.session.user.email,
            name: data.session.user.user_metadata?.name || 'User',
            username: data.session.user.user_metadata?.username || data.session.user.email,
            isAdmin: data.session.user.user_metadata?.isAdmin || false
          };
          
          setUser(userData);
          setIsAuthenticated(true);
          setIsAdmin(userData.isAdmin || false);
        }
      } catch (error) {
        console.error('Session check error:', error);
      }
    };

    checkSession();

    // Listen for auth state changes
    if (!useMockAuth) {
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'SIGNED_IN' && session) {
            const userData = {
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.name || 'User',
              username: session.user.user_metadata?.username || session.user.email,
              isAdmin: session.user.user_metadata?.isAdmin || false
            };
            
            setUser(userData);
            setIsAuthenticated(true);
            setIsAdmin(userData.isAdmin || false);
          }
          
          if (event === 'SIGNED_OUT') {
            setUser(null);
            setIsAuthenticated(false);
            setIsAdmin(false);
          }
        }
      );

      // Cleanup subscription
      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  // Provide the auth context to children
  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isAdmin,
      login, 
      logout,
      createAdminUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};
