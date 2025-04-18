
export interface FormData {
  nome: string;
  naturalidade: string;
  uf: string;
  dataNascimento: Date | string;
  filiacao: string;
  profissao: string;
  estadoCivil: string;
  rg: string;
  orgaoExpedidor: string;
  cpf: string;
  email: string;
  endereco: string;
  nacionalidade?: string;
  // Campos específicos para pessoa casada
  nomeConjuge?: string;
  naturalidadeConjuge?: string;
  ufConjuge?: string;
  dataNascimentoConjuge?: Date | string;
  filiacaoConjuge?: string;
  profissaoConjuge?: string;
  rgConjuge?: string;
  orgaoExpedidorConjuge?: string;
  cpfConjuge?: string;
  emailConjuge?: string;
  dataCasamento?: Date | string;
  regimeBens?: string;
}
