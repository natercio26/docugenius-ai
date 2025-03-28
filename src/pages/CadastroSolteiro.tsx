
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Check } from "lucide-react";

import Navbar from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

// Schema de validação do formulário
const formSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  naturalidade: z.string().min(2, "Informe sua naturalidade"),
  uf: z.string().min(2, "Selecione um estado"),
  dataNascimento: z.date({
    required_error: "Data de nascimento é obrigatória",
  }),
  filiacao: z.string().min(3, "Informe a filiação"),
  profissao: z.string().min(2, "Informe sua profissão"),
  estadoCivil: z.string().min(2, "Informe seu estado civil"),
  rg: z.string().regex(/^\d{2}\.\d{3}\.\d{3}-\d{1}$/, "RG inválido (formato: 00.000.000-0)"),
  orgaoExpedidor: z.string().min(2, "Informe o órgão expedidor"),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF inválido (formato: 000.000.000-00)"),
  email: z.string().email("E-mail inválido"),
  endereco: z.string().min(5, "Endereço deve ter pelo menos 5 caracteres"),
});

type FormValues = z.infer<typeof formSchema>;

const CadastroSolteiro: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Estados brasileiros
  const estados = [
    { sigla: "AC", nome: "Acre" },
    { sigla: "AL", nome: "Alagoas" },
    { sigla: "AP", nome: "Amapá" },
    { sigla: "AM", nome: "Amazonas" },
    { sigla: "BA", nome: "Bahia" },
    { sigla: "CE", nome: "Ceará" },
    { sigla: "DF", nome: "Distrito Federal" },
    { sigla: "ES", nome: "Espírito Santo" },
    { sigla: "GO", nome: "Goiás" },
    { sigla: "MA", nome: "Maranhão" },
    { sigla: "MT", nome: "Mato Grosso" },
    { sigla: "MS", nome: "Mato Grosso do Sul" },
    { sigla: "MG", nome: "Minas Gerais" },
    { sigla: "PA", nome: "Pará" },
    { sigla: "PB", nome: "Paraíba" },
    { sigla: "PR", nome: "Paraná" },
    { sigla: "PE", nome: "Pernambuco" },
    { sigla: "PI", nome: "Piauí" },
    { sigla: "RJ", nome: "Rio de Janeiro" },
    { sigla: "RN", nome: "Rio Grande do Norte" },
    { sigla: "RS", nome: "Rio Grande do Sul" },
    { sigla: "RO", nome: "Rondônia" },
    { sigla: "RR", nome: "Roraima" },
    { sigla: "SC", nome: "Santa Catarina" },
    { sigla: "SP", nome: "São Paulo" },
    { sigla: "SE", nome: "Sergipe" },
    { sigla: "TO", nome: "Tocantins" }
  ];
  
  // Estados civis
  const estadosCivis = [
    "Solteiro(a)",
    "Divorciado(a)",
    "Viúvo(a)",
    "Separado(a) judicialmente"
  ];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      naturalidade: "",
      uf: "",
      filiacao: "",
      profissao: "",
      estadoCivil: "",
      rg: "",
      orgaoExpedidor: "",
      cpf: "",
      email: "",
      endereco: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    console.log("Dados do formulário:", data);
    toast({
      title: "Dados revisados com sucesso",
      description: "Seus dados foram validados e estão prontos para processamento.",
    });
    // Aqui você pode implementar a lógica para salvar os dados ou navegar para a próxima página
  };

  // Funções de formatação de input
  const formatRG = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 9) {
      value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{1})?$/, (_, p1, p2, p3, p4) => {
        if (p4) return `${p1}.${p2}.${p3}-${p4}`;
        if (p3) return `${p1}.${p2}.${p3}`;
        if (p2) return `${p1}.${p2}`;
        return p1;
      });
      e.target.value = value;
    }
  };

  const formatCPF = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})?$/, (_, p1, p2, p3, p4) => {
        if (p4) return `${p1}.${p2}.${p3}-${p4}`;
        if (p3) return `${p1}.${p2}.${p3}`;
        if (p2) return `${p1}.${p2}`;
        return p1;
      });
      e.target.value = value;
    }
  };

  return (
    <>
      <Navbar />
      <div className="container py-8 max-w-4xl mx-auto">
        <Card className="shadow-md">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-2xl font-serif">Formulário de Cadastro (Solteiro)</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nome Completo */}
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

                  {/* Naturalidade */}
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

                  {/* UF */}
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
                              <SelectItem key={estado.sigla} value={estado.sigla}>
                                {estado.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Data de Nascimento */}
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
                                variant={"outline"}
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
                              locale={ptBR}
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Filiação */}
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

                  {/* Profissão */}
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

                  {/* Estado Civil */}
                  <FormField
                    control={form.control}
                    name="estadoCivil"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado Civil</FormLabel>
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
                            {estadosCivis.map((estado) => (
                              <SelectItem key={estado} value={estado}>
                                {estado}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* RG */}
                  <FormField
                    control={form.control}
                    name="rg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Identidade (RG)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="00.000.000-0" 
                            {...field} 
                            onChange={(e) => {
                              formatRG(e);
                              field.onChange(e);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Órgão Expedidor */}
                  <FormField
                    control={form.control}
                    name="orgaoExpedidor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Órgão Expedidor</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: SSP/SP" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* CPF */}
                  <FormField
                    control={form.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="000.000.000-00" 
                            {...field} 
                            onChange={(e) => {
                              formatCPF(e);
                              field.onChange(e);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* E-mail */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input placeholder="seu@email.com" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Endereço */}
                  <FormField
                    control={form.control}
                    name="endereco"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                          <Input placeholder="Endereço completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="pt-4">
                  <Button type="submit" className="w-full md:w-auto" size="lg">
                    Revisar Dados
                    <Check className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default CadastroSolteiro;
