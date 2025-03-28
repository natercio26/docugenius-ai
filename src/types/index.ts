
export type DraftType = 
  | 'Inventário' 
  | 'Escritura de Compra e Venda' 
  | 'Doação' 
  | 'União Estável' 
  | 'Procuração' 
  | 'Testamento' 
  | 'Contrato de Aluguel'
  | 'Contrato Social'
  | 'Outro';

export interface Draft {
  id: string;
  title: string;
  type: DraftType;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  protocoloInfo?: {
    numero: string;
    dataGeracao: Date;
    nome: string;
    cpf: string;
  };
  extractedData?: Record<string, string>;
}

export type UploadStatus = 
  | 'idle' 
  | 'uploading' 
  | 'processing' 
  | 'success' 
  | 'error';

export type AcceptedFileTypes = 
  | 'application/pdf'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'image/jpeg'
  | 'image/png';

export interface DraftTemplate {
  id: string;
  name: string;
  type: DraftType;
  fields: TemplateField[];
}

export interface TemplateField {
  id: string;
  name: string;
  type: 'text' | 'date' | 'select' | 'checkbox';
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export type RegistrationType = 'solteiro' | 'casado';

export interface RegistrationData {
  type: RegistrationType;
  personalInfo: {
    name: string;
    birthDate: string;
    cpf: string;
    rg: string;
    address: string;
    email: string;
    phone: string;
    naturality?: string;
    uf?: string;
    filiation?: string;
    profession?: string;
    civilStatus?: string;
    issuer?: string;
    nationality?: string;
  };
  spouseInfo?: {
    name: string;
    birthDate: string;
    cpf: string;
    rg: string;
    address?: string;
    profession?: string;
    civilStatus?: string;
    nationality?: string;
    naturality?: string;
    uf?: string;
    filiation?: string;
    issuer?: string;
    email?: string;
    marriageDate?: string;
    propertyRegime?: string;
  };
}

export interface ProtocoloData {
  numero: string;
  dataGeracao: Date;
  nome: string;
  cpf: string;
  conteudo: string;
  registrationData?: RegistrationData;
  textoQualificacao?: string;
}
