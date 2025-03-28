
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Lock, User } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

// Define if we're using mock authentication in development
const useMockAuth = process.env.NODE_ENV === 'development' && 
  (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY);

const formSchema = z.object({
  username: z.string().min(3, { message: 'Nome de usuário deve ter pelo menos 3 caracteres' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres' }),
  isAdmin: z.boolean().default(false),
});

const Login: React.FC = () => {
  const { login, isAuthenticated, createAdminUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isCreatingAdmin, setIsCreatingAdmin] = React.useState(false);
  
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: useMockAuth ? 'demo' : '',
      password: useMockAuth ? 'password123' : '',
      isAdmin: false,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      console.log('Attempting login with values:', values);
      await login(values.username, values.password, values.isAdmin);
      
      toast({
        title: "Login realizado com sucesso",
        description: "Você será redirecionado para a página inicial",
      });
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Verifique suas credenciais e tente novamente';
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAdminUser = async () => {
    setIsCreatingAdmin(true);
    try {
      await createAdminUser();
      toast({
        title: "Usuário admin criado",
        description: "O usuário administrativo foi criado com sucesso",
      });
      
      form.setValue('username', 'adminlicencedocumentum');
      form.setValue('password', 'adminlicence');
      form.setValue('isAdmin', true);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar usuário admin';
      toast({
        variant: "destructive",
        title: "Erro ao criar admin",
        description: errorMessage,
      });
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  // Function to use demo login in development mode
  const handleDemoLogin = () => {
    if (useMockAuth) {
      form.setValue('username', 'demo');
      form.setValue('password', 'password123');
      form.handleSubmit(onSubmit)();
    }
  };

  // Function to use admin login in development mode
  const handleAdminLogin = () => {
    if (useMockAuth) {
      form.setValue('username', 'adminlicencedocumentum');
      form.setValue('password', 'adminlicence');
      form.setValue('isAdmin', true);
      form.handleSubmit(onSubmit)();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-serif text-center">Documentum</CardTitle>
          <CardDescription className="text-center">
            Entre com suas credenciais para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {useMockAuth && (
            <Alert className="mb-4 bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-700">Modo de desenvolvimento</AlertTitle>
              <AlertDescription className="text-amber-700">
                Sistema executando com credenciais de teste. Use o botão de login rápido abaixo.
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome de Usuário</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input 
                          placeholder="Nome de usuário" 
                          className="pl-10" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          className="pl-10" 
                          {...field} 
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                          <span className="sr-only">
                            {showPassword ? "Esconder senha" : "Mostrar senha"}
                          </span>
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isAdmin"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 border">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Administrador</FormLabel>
                      <FormDescription className="text-sm text-muted-foreground">
                        Faça login como administrador do sistema
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>
          </Form>
          
          {useMockAuth && (
            <div className="flex flex-col gap-2 pt-2">
              <Button 
                type="button" 
                variant="secondary" 
                className="w-full"
                onClick={handleDemoLogin}
              >
                Login rápido como usuário
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                className="w-full"
                onClick={handleAdminLogin}
              >
                Login rápido como admin
              </Button>
            </div>
          )}
          
          <div className="pt-2">
            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              onClick={handleCreateAdminUser}
              disabled={isCreatingAdmin}
            >
              {isCreatingAdmin ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Criando admin...
                </>
              ) : (
                "Criar usuário administrativo"
              )}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex-col space-y-2">
          <div className="text-sm text-muted-foreground text-center">
            <p>
              Para adquirir uma licença de uso do sistema, entre em contato com o suporte.
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
