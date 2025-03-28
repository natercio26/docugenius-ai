
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Users, Database, FileText, Clipboard, 
  ArrowRight, ChevronRight 
} from 'lucide-react';

import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';

const Cadastro: React.FC = () => {
  const navigate = useNavigate();

  const handleCadastroSolteiro = () => {
    navigate('/cadastro/solteiro');
  };

  const handleCadastroCasado = () => {
    navigate('/cadastro/casado');
  };
  
  const handleDatabaseAccess = () => {
    navigate('/cadastro/database');
  };

  return (
    <>
      <Navbar />
      <div className="container max-w-5xl mx-auto py-12">
        <div className="space-y-4 mb-8">
          <h1 className="text-3xl font-semibold">Cadastro</h1>
          <p className="text-muted-foreground">
            Realize o cadastro de pessoas físicas para emissão de documentos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-2 border-primary/20 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <CardTitle>Pessoa Solteira</CardTitle>
                  <CardDescription>
                    Cadastro de pessoa física solteira
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                Utilize este formulário para cadastrar uma pessoa física solteira
                com todos os seus dados pessoais.
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full gap-2" 
                onClick={handleCadastroSolteiro}
              >
                Iniciar Cadastro
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>

          <Card className="border shadow-md opacity-90">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-4">
                <div className="bg-slate-100 p-3 rounded-lg">
                  <Users className="h-8 w-8 text-slate-600" />
                </div>
                <div>
                  <CardTitle>Pessoa Casada</CardTitle>
                  <CardDescription>
                    Cadastro de pessoa física casada
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                Utilize este formulário para cadastrar uma pessoa física casada,
                incluindo os dados do cônjuge.
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full gap-2" 
                onClick={handleCadastroCasado}
              >
                Iniciar Cadastro
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="border shadow-md md:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <Database className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Banco de Dados</CardTitle>
                  <CardDescription>
                    Acesse todos os cadastros realizados
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                Consulte o banco de dados de pessoas cadastradas, 
                pesquise por nome, CPF ou número de protocolo, 
                e visualize todos os dados dos cadastros realizados.
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                variant="secondary" 
                className="w-full gap-2" 
                onClick={handleDatabaseAccess}
              >
                Acessar Banco de Dados
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Cadastro;
