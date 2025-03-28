
import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, ChevronRight, ArrowLeft } from 'lucide-react';

import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

// Schema for form validation
const formSchema = z.object({
  // First spouse information
  nome: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres' }),
  naturalidade: z.string().min(2, { message: 'Informe a naturalidade' }),
  uf: z.string().min(2, { message: 'Selecione um estado' }),
  dataNascimento: z.date({ required_error: 'Informe a data de nascimento' }),
  filiacao: z.string().min(3, { message: 'Informe a filiação' }),
  profissao: z.string().min(2, { message: 'Informe a profissão' }),
  rg: z.string().min(5, { message: 'Informe o RG' }),
  orgaoExpedidor: z.string().min(2, { message: 'Informe o órgão expedidor' }),
  cpf: z.string().min(11, { message: 'Informe o CPF' }).max(14),
  email: z.string().email({ message: 'Informe um e-mail válido' }),
  endereco: z.string().min(5, { message: 'Informe o endereço' }),
  
  // Second spouse information
  nomeConjuge: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres' }),
  naturalidadeConjuge: z.string().min(2, { message: 'Informe a naturalidade' }),
  ufConjuge: z.string().min(2, { message: 'Selecione um estado' }),
  dataNascimentoConjuge: z.date({ required_error: 'Informe a data de nascimento' }),
  filiacaoConjuge: z.string().min(3, { message: 'Informe a filiação' }),
  profissaoConjuge: z.string().min(2, { message: 'Informe a profissão' }),
  rgConjuge: z.string().min(5, { message: 'Informe o RG' }),
  orgaoExpedidorConjuge: z.string().min(2, { message: 'Informe o órgão expedidor' }),
  cpfConjuge: z.string().min(11, { message: 'Informe o CPF' }).max(14),
  
  // Marriage information
  dataCasamento: z.date({ required_error: 'Informe a data de casamento' }),
  regimeBens: z.string().min(2, { message: 'Selecione o regime de bens' }),
});

const estados = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
];

const regimesBens = [
  { value: 'comunhao_universal', label: 'Comunhão Universal de Bens' },
  { value: 'comunhao_parcial', label: 'Comunhão Parcial de Bens' },
  { value: 'separacao_total', label: 'Separação Total de Bens' },
  { value: 'participacao_final', label: 'Participação Final nos Aquestos' },
];

const CadastroCasado: React.FC = () => {
  const navigate = useNavigate();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      naturalidade: '',
      uf: '',
      filiacao: '',
      profissao: '',
      rg: '',
      orgaoExpedidor: '',
      cpf: '',
      email: '',
      endereco: '',
      nomeConjuge: '',
      naturalidadeConjuge: '',
      ufConjuge: '',
      filiacaoConjuge: '',
      profissaoConjuge: '',
      rgConjuge: '',
      orgaoExpedidorConjuge: '',
      cpfConjuge: '',
      regimeBens: '',
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    // Process form data and navigate to review page
    navigate('/cadastro/revisar', { 
      state: { 
        formData: {
          ...data,
          estadoCivil: 'Casado(a)',
          tipo: 'casado',
          conjuge: {
            nome: data.nomeConjuge,
            naturalidade: data.naturalidadeConjuge,
            uf: data.ufConjuge,
            dataNascimento: data.dataNascimentoConjuge,
            filiacao: data.filiacaoConjuge,
            profissao: data.profissaoConjuge,
            rg: data.rgConjuge,
            orgaoExpedidor: data.orgaoExpedidorConjuge,
            cpf: data.cpfConjuge,
          },
          dataCasamento: data.dataCasamento,
          regimeBens: data.regimeBens
        }
      }
    });
  };

  const handleVoltar = () => {
    navigate('/cadastro');
  };

  return (
    <>
      <Navbar />
      <div className="container max-w-5xl mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Cadastro de Pessoa Casada</h1>
            <p className="text-muted-foreground">
              Preencha os dados do casal para gerar a qualificação completa.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleVoltar}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-primary">Informações do Cônjuge 1</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="naturalidade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Naturalidade</FormLabel>
                          <FormControl>
                            <Input placeholder="Cidade onde nasceu" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="uf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>UF</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {estados.map((estado) => (
                                <SelectItem key={estado.value} value={estado.value}>
                                  {estado.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="dataNascimento"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data de Nascimento</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                ) : (
                                  <span>dd/mm/aaaa</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="filiacao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Filiação</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome dos pais" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="profissao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profissão</FormLabel>
                        <FormControl>
                          <Input placeholder="Sua profissão" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="rg"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Identidade (RG)</FormLabel>
                          <FormControl>
                            <Input placeholder="Número do RG" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="orgaoExpedidor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Órgão Expedidor</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: SSP/UF" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF</FormLabel>
                        <FormControl>
                          <Input placeholder="000.000.000-00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="seu@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-primary">Informações do Cônjuge 2</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="nomeConjuge"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="naturalidadeConjuge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Naturalidade</FormLabel>
                          <FormControl>
                            <Input placeholder="Cidade onde nasceu" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="ufConjuge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>UF</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {estados.map((estado) => (
                                <SelectItem key={`conjuge-${estado.value}`} value={estado.value}>
                                  {estado.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="dataNascimentoConjuge"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data de Nascimento</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                ) : (
                                  <span>dd/mm/aaaa</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="filiacaoConjuge"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Filiação</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome dos pais" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="profissaoConjuge"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profissão</FormLabel>
                        <FormControl>
                          <Input placeholder="Profissão" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="rgConjuge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Identidade (RG)</FormLabel>
                          <FormControl>
                            <Input placeholder="Número do RG" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="orgaoExpedidorConjuge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Órgão Expedidor</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: SSP/UF" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="cpfConjuge"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF</FormLabel>
                        <FormControl>
                          <Input placeholder="000.000.000-00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-primary">Informações do Casamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="dataCasamento"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data do Casamento</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                ) : (
                                  <span>dd/mm/aaaa</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date()
                              }
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="regimeBens"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Regime de Bens</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {regimesBens.map((regime) => (
                              <SelectItem key={regime.value} value={regime.value}>
                                {regime.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endereco"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Endereço Completo</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Logradouro, número, complemento, bairro, cidade, UF, CEP" 
                            className="resize-none" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end border-t p-4 bg-slate-50">
                <Button type="submit" className="gap-2">
                  Revisar Dados
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </div>
    </>
  );
};

export default CadastroCasado;
