
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

export interface DeviceSpecs {
  cpuCores: number;
  ramGB: number | string;
  gpu: string;
  resolution: string;
  os: string;
  browser: string;
  batteryLevel?: number;
  isCharging?: boolean;
  connectionType?: string;
  downlinkMbps?: number;
  platform: string;
  language: string;
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
  authorizedDevices?: string[]; 
  maxDevices?: number;       
  isImpersonating?: boolean; 
  isAdminHardware?: boolean; 
  deviceSpecs?: DeviceSpecs;
}

export interface CommunityContribution {
  id: string;
  user_id: string;
  user_name: string;
  title: string;
  description: string;
  file_url: string;
  file_type: 'pdf' | 'excel' | 'word' | 'image';
  area: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  device_id?: string;
}

export interface SecurityIncident {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_area: string;
  procedure_id?: string;
  procedure_name?: string;
  device_id: string;
  incident_type: string;
  details?: string;
  severity: string;
  created_at: string;
}

export interface OnlineUser {
  userId: string;
  name: string;
  email: string;
  area: string;
  role: string;
  onlineAt: string; 
  ip: string; 
  deviceSpecs?: DeviceSpecs;
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
  totalObsolete: number;
  lastUpdated: string | null;
}

export interface ConsultationReply {
  id: string;
  message_id: string;
  user_id: string;
  message: string;
  reply_image?: string; 
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
  process_section?: string; 
  reference_image?: string; 
  message: string;
  status: 'pending' | 'reviewed' | 'archived' | 'closed';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
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

export const MASTER_VIEWER_EMAILS = [
  'julio_romo@cvdirecto.mx'
];

export const ADMIN_HARDWARE_IDS = [
  'DEV-0NFEK3Q3W-8738',
  'DEV-K11Q9MPT5-8026'
];
