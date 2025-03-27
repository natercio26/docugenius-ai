
export type DraftType = 
  | 'Inventário' 
  | 'Escritura de Compra e Venda' 
  | 'Doação' 
  | 'União Estável' 
  | 'Procuração' 
  | 'Testamento' 
  | 'Outro';

export interface Draft {
  id: string;
  title: string;
  type: DraftType;
  content: string;
  createdAt: Date;
  updatedAt: Date;
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
