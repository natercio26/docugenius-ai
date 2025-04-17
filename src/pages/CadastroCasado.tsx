import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { InputMask } from '@/components/ui/input-mask';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import Navbar from "@/components/Navbar";

const estadosCivis = [
  "Casado(a)",
  "Solteiro(a)",
  "Divorciado(a)", 
  "Viúvo(a)", 
  "Separado(a) judicialmente",
  "Falecido(a)"
] as const;

const formSchema = z.object({
  nome: z.string().min(2, {
    message: 'Nome deve ter pelo menos 2 caracteres.',
  }),
  naturalidade: z.string().min(2, {
    message: 'Naturalidade deve ter pelo menos 2 caracteres.',
  }),
  uf: z.string().length(2, {
    message: 'UF deve ter 2 caracteres.',
  }),
  dataNascimento: z.string().min(10, {
    message: 'Data de nascimento inválida.',
  }),
  filiacao: z.string().min(2, {
    message: 'Filiação deve ter pelo menos 2 caracteres.',
  }),
  profissao: z.string().min(2, {
    message: 'Profissão deve ter pelo menos 2 caracteres.',
  }),
  estadoCivil: z.enum(estadosCivis),
  rg: z.string().min(5, {
    message: 'RG deve ter pelo menos 5 caracteres.',
  }),
  orgaoExpedidor: z.string().min(2, {
    message: 'Órgão expedidor deve ter pelo menos 2 caracteres.',
  }),
  cpf: z.string().min(14, {
    message: 'CPF inválido.',
  }),
  email: z.string().email("E-mail inválido").optional(),
  endereco: z.string().min(5, {
    message: 'Endereço deve ter pelo menos 5 caracteres.',
  }),
  nomeConjuge: z.string().min(2, {
    message: 'Nome do cônjuge deve ter pelo menos 2 caracteres.',
  }),
  naturalidadeConjuge: z.string().min(2, {
    message: 'Naturalidade do cônjuge deve ter pelo menos 2 caracteres.',
  }),
  ufConjuge: z.string().length(2, {
    message: 'UF do cônjuge deve ter 2 caracteres.',
  }),
  dataNascimentoConjuge: z.string().min(10, {
    message: 'Data de nascimento do cônjuge inválida.',
  }),
  filiacaoConjuge: z.string().min(2, {
    message: 'Filiação do cônjuge deve ter pelo menos 2 caracteres.',
  }),
  profissaoConjuge: z.string().min(2, {
    message: 'Profissão do cônjuge deve ter pelo menos 2 caracteres.',
  }),
  rgConjuge: z.string().min(5, {
    message: 'RG do cônjuge deve ter pelo menos 5 caracteres.',
  }),
  orgaoExpedidorConjuge: z.string().min(2, {
    message: 'Órgão expedidor do cônjuge deve ter pelo menos 2 caracteres.',
  }),
  cpfConjuge: z.string().min(14, {
    message: 'CPF do cônjuge inválido.',
  }),
  emailConjuge: z.string().email("E-mail inválido").optional(),
  dataCasamento: z.string().min(10, {
    message: 'Data de casamento inválida.',
  }),
  regimeBens: z.enum([
    'comunhao_parcial',
    'comunhao_universal',
    'separacao_total',
    'separacao_obrigatoria',
    'participacao_final_aquestos',
  ]).optional(),
});

type FormValues = z.infer<typeof formSchema>;

const inputVariants = ({ className, variant }: { className?: string, variant?: 'default' | 'destructive' }) =>
  cn(
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    variant === 'destructive' ? "focus-visible:ring-destructive" : "",
    className
  )

const CadastroCasado: React.FC = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      naturalidade: '',
      uf: '',
      dataNascimento: '',
      filiacao: '',
      profissao: '',
      estadoCivil: 'Casado(a)',
      rg: '',
      orgaoExpedidor: '',
      cpf: '',
      email: '',
      endereco: '',
      nomeConjuge: '',
      naturalidadeConjuge: '',
      ufConjuge: '',
      dataNascimentoConjuge: '',
      filiacaoConjuge: '',
      profissaoConjuge: '',
      rgConjuge: '',
      orgaoExpedidorConjuge: '',
      cpfConjuge: '',
      emailConjuge: '',
      dataCasamento: '',
      regimeBens: 'comunhao_parcial',
    },
  });

  const { handleSubmit, control, formState: { errors } } = form;

  const onSubmit = (data: FormValues) => {
    setIsLoading(true);
    
    console.log("Dados do formulário:", data);
    
    setTimeout(() => {
      setIsLoading(false);
      
      navigate('/cadastro/revisar', { state: { formData: data } });
      
      toast({
        title: "Sucesso!",
        description: "Dados enviados para revisão.",
      })
    }, 1500)
  };

  return (
    <>
      <Navbar />
      <div className="container py-8 max-w-4xl mx-auto">
        <Card className="shadow-md">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-2xl font-serif">Cadastro de Pessoa Casada</CardTitle>
            <CardDescription>Preencha os dados abaixo para continuar.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FormField
                      control={control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nome Completo"
                              className={inputVariants({ 
                                variant: errors.nome ? 'destructive' : 'default' 
                              })}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div>
                    <FormField
                      control={control}
                      name="dataNascimento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Nascimento</FormLabel>
                          <FormControl>
                            <InputMask
                              mask="date"
                              placeholder="DD/MM/AAAA"
                              className={inputVariants({ 
                                variant: errors.dataNascimento ? 'destructive' : 'default' 
                              })}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FormField
                      control={control}
                      name="naturalidade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Naturalidade</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Cidade"
                              className={inputVariants({ 
                                variant: errors.naturalidade ? 'destructive' : 'default' 
                              })}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div>
                    <FormField
                      control={control}
                      name="uf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>UF</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="UF"
                              className={inputVariants({ 
                                variant: errors.uf ? 'destructive' : 'default' 
                              })}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div>
                  <FormField
                    control={control}
                    name="filiacao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Filiação</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nome do pai e da mãe"
                            className={inputVariants({ 
                              variant: errors.filiacao ? 'destructive' : 'default' 
                            })}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <FormField
                    control={control}
                    name="profissao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profissão</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Profissão"
                            className={inputVariants({ 
                              variant: errors.profissao ? 'destructive' : 'default' 
                            })}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FormField
                      control={control}
                      name="rg"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>RG</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="RG"
                              className={inputVariants({ 
                                variant: errors.rg ? 'destructive' : 'default' 
                              })}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div>
                    <FormField
                      control={control}
                      name="orgaoExpedidor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Órgão Expedidor</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Órgão Expedidor"
                              className={inputVariants({ 
                                variant: errors.orgaoExpedidor ? 'destructive' : 'default' 
                              })}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div>
                  <FormField
                    control={control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF</FormLabel>
                        <FormControl>
                          <InputMask
                            mask="cpf"
                            placeholder="CPF"
                            className={inputVariants({ 
                              variant: errors.cpf ? 'destructive' : 'default' 
                            })}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <FormField
                    control={control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Email"
                            type="email"
                            className={inputVariants({ 
                              variant: errors.email ? 'destructive' : 'default' 
                            })}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <FormField
                    control={control}
                    name="endereco"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Endereço"
                            className={inputVariants({ 
                              variant: errors.endereco ? 'destructive' : 'default' 
                            })}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <h4 className="text-lg font-medium mt-6 mb-2">Dados do Cônjuge</h4>

                <div>
                  <FormField
                    control={control}
                    name="nomeConjuge"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo do Cônjuge</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nome Completo do Cônjuge"
                            className={inputVariants({ 
                              variant: errors.nomeConjuge ? 'destructive' : 'default' 
                            })}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FormField
                      control={control}
                      name="dataNascimentoConjuge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Nascimento do Cônjuge</FormLabel>
                          <FormControl>
                            <InputMask
                              mask="date"
                              placeholder="DD/MM/AAAA"
                              className={inputVariants({ 
                                variant: errors.dataNascimentoConjuge ? 'destructive' : 'default' 
                              })}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div>
                    <FormField
                      control={control}
                      name="naturalidadeConjuge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Naturalidade do Cônjuge</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Cidade"
                              className={inputVariants({ 
                                variant: errors.naturalidadeConjuge ? 'destructive' : 'default' 
                              })}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FormField
                      control={control}
                      name="ufConjuge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>UF do Cônjuge</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="UF"
                              className={inputVariants({ 
                                variant: errors.ufConjuge ? 'destructive' : 'default' 
                              })}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div>
                    <FormField
                      control={control}
                      name="rgConjuge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>RG do Cônjuge</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="RG"
                              className={inputVariants({ 
                                variant: errors.rgConjuge ? 'destructive' : 'default' 
                              })}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FormField
                      control={control}
                      name="orgaoExpedidorConjuge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Órgão Expedidor do Cônjuge</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Órgão Expedidor"
                              className={inputVariants({ 
                                variant: errors.orgaoExpedidorConjuge ? 'destructive' : 'default' 
                              })}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div>
                    <FormField
                      control={control}
                      name="cpfConjuge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPF do Cônjuge</FormLabel>
                          <FormControl>
                            <InputMask
                              mask="cpf"
                              placeholder="CPF do Cônjuge"
                              className={inputVariants({ 
                                variant: errors.cpfConjuge ? 'destructive' : 'default' 
                              })}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div>
                  <FormField
                    control={control}
                    name="filiacaoConjuge"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Filiação do Cônjuge</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nome do pai e da mãe"
                            className={inputVariants({ 
                              variant: errors.filiacaoConjuge ? 'destructive' : 'default' 
                            })}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <FormField
                    control={control}
                    name="profissaoConjuge"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profissão do Cônjuge</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Profissão"
                            className={inputVariants({ 
                              variant: errors.profissaoConjuge ? 'destructive' : 'default' 
                            })}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <FormField
                    control={control}
                    name="emailConjuge"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email do Cônjuge</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Email"
                            type="email"
                            className={inputVariants({ 
                              variant: errors.emailConjuge ? 'destructive' : 'default' 
                            })}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <FormField
                    control={control}
                    name="dataCasamento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data do Casamento</FormLabel>
                        <FormControl>
                          <InputMask
                            mask="date"
                            placeholder="DD/MM/AAAA"
                            className={inputVariants({ 
                              variant: errors.dataCasamento ? 'destructive' : 'default' 
                            })}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <FormField
                    control={control}
                    name="regimeBens"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Regime de Bens</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className={inputVariants({})}>
                              <SelectValue placeholder="Selecione o regime de bens" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="comunhao_parcial">Comunhão Parcial de Bens</SelectItem>
                            <SelectItem value="comunhao_universal">Comunhão Universal de Bens</SelectItem>
                            <SelectItem value="separacao_total">Separação Total de Bens</SelectItem>
                            <SelectItem value="separacao_obrigatoria">Separação Obrigatória de Bens</SelectItem>
                            <SelectItem value="participacao_final_aquestos">Participação Final nos Aquestos</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <CardFooter className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && (
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Enviar para Revisão
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default CadastroCasado;
