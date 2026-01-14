
export enum Area {
  PROYECTOS = "Proyectos y Mejora Continua",
  MENSAJERIA = "Mensajeria y Distribucion",
  CALIDAD = "Calidad",
  ALMACEN_C = "Almacen C",
  EMPAQUE_RETAIL = "Empaque Retail",
  EMPAQUE_TV = "Empaque TV",
  DEVOLUCIONES = "Devoluciones",
  INVENTARIOS = "Inventarios",
  RECIBO = "Recibo",
  REACONDICIONADO = "Reacondicionado",
  MAQUILA = "Maquila",
  IT = "Tecnologías de la Información",
  HR = "Recursos Humanos"
}

export enum Status {
  ACTIVE = "Vigente",
  REVIEW = "En Revisión",
  OBSOLETE = "Obsoleto"
}

export interface Folder {
  id: string; 
  name: string;
  parent_id: string | null; 
  created_at: string;
  area?: string; 
}

export interface User {
  $id: string;
  name: string;
  email: string;
  area: string; 
  allowedAreas: string[]; 
  role: string;
  avatarUrl?: string;
  privacyAccepted?: boolean;
  signedName?: string;       
  signedDepartment?: string; 
  lastIp?: string;           
  lastDeviceId?: string;     
  authorizedDevices?: string[]; // Array para guardar todos los IDs vinculados
  maxDevices?: number;       
  isImpersonating?: boolean; 
}

export interface OnlineUser {
  userId: string;
  name: string;
  email: string;
  area: string;
  role: string;
  onlineAt: string; 
  ip: string; 
}

export interface Department {
  id: number;
  name: string;
  max_users: number;
  current_count?: number; 
}

export interface ProcedureHistory {
  version: string;
  date: string;
  changeLog: string;
  author: string;
}

export interface Procedure {
  $id: string;
  name: string;
  code: string;
  area: Area | string; 
  version: string;
  status: Status;
  description: string;
  attachmentUrl?: string; 
  format?: string;        
  urlVideo?: string;
  folder_id?: string; 
  updatedAt: string;
  responsible: string;
  history: ProcedureHistory[];
}

export interface Stats {
  totalActive: number;
  totalReview: number;
  lastUpdated: string | null;
}

export interface ConsultationReply {
  id: string;
  message_id: string;
  user_id: string;
  message: string;
  created_at: string;
  user_name?: string;
  user_role?: string; 
  user_avatar?: string; 
}

export interface ConsultationMessage {
  id: string;
  user_id: string;
  title?: string; 
  procedure_id?: string;
  procedure_name?: string;
  message: string;
  status: 'pending' | 'reviewed' | 'archived' | 'closed';
  area?: string; 
  created_at: string;
  user_name?: string;
  user_email?: string;
  user_area?: string;
  user_role?: string;
  user_avatar?: string; 
  replies?: ConsultationReply[]; 
}

export interface DownloadRequest {
  id: string;
  user_id: string;
  procedure_id: string;
  procedure_name: string;
  status: 'pending' | 'approved' | 'rejected' | 'consumed';
  requested_at: string;
  responded_at?: string;
  user_name?: string; 
  user_email?: string; 
  user_area?: string; 
}

export interface AccessLog {
  id: string;
  user_id: string;
  procedure_id: string;
  procedure_name: string;
  area: string;
  accessed_at: string;
  duration_seconds: number;
  user_name?: string;
  user_email?: string;
}

export interface ImprovementProposal {
  id: string;
  user_id: string;
  title: string;
  area: string;
  current_situation: string;
  proposal_details: string;
  benefits: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  admin_feedback?: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
  user_avatar?: string;
}

export const ADMIN_EMAILS = [
  'zerklucio@gmail.com',
  'darienperez695@gmail.com'
];
