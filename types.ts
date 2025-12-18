
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
  id: string; // Cambiado a string para soportar UUID de Supabase
  name: string;
  parent_id: string | null; // Cambiado a string para soportar UUID
  created_at: string;
  area?: string; // Campo opcional para filtrado por área
}

export interface User {
  $id: string;
  name: string;
  email: string;
  area: string; // Área principal (para etiqueta visual)
  allowedAreas: string[]; // MATRIZ DE ACCESO: Lista de todas las áreas permitidas
  role: string;
  avatarUrl?: string;
  privacyAccepted?: boolean;
  signedName?: string;       // Nombre específico usado al firmar
  signedDepartment?: string; // Departamento específico usado al firmar
  lastIp?: string;           // IP desde donde inició sesión
  maxDevices?: number;       // Límite de IPs autorizadas
  isImpersonating?: boolean; // MODO AUDITOR: Indica si es un admin logueado como usuario
}

export interface OnlineUser {
  userId: string;
  name: string;
  email: string;
  area: string;
  role: string;
  onlineAt: string; // ISO String de cuándo se conectó esta sesión
}

export interface Department {
  id: number;
  name: string;
  max_users: number;
  current_count?: number; // Para uso interno del frontend
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
  area: Area | string; // Permitir string para compatibilidad con DB
  version: string;
  status: Status;
  description: string;
  attachmentUrl?: string; 
  format?: string;        
  urlVideo?: string;
  folder_id?: string; // Cambiado a string (UUID)
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
  user_role?: string; // Para distinguir si es Admin o Usuario en la UI
  user_avatar?: string; // Avatar URL
}

export interface ConsultationMessage {
  id: string;
  user_id: string;
  title?: string; // Título o Asunto del Ticket
  procedure_id?: string;
  procedure_name?: string;
  message: string;
  status: 'pending' | 'reviewed' | 'archived' | 'closed';
  area?: string; // IMPORTANTE: Define visibilidad colaborativa
  created_at: string;
  // Campos opcionales para join con usuarios
  user_name?: string;
  user_email?: string;
  user_area?: string;
  user_role?: string;
  user_avatar?: string; // Avatar URL
  replies?: ConsultationReply[]; // Hilo de conversación
}

export interface DownloadRequest {
  id: string;
  user_id: string;
  procedure_id: string;
  procedure_name: string;
  status: 'pending' | 'approved' | 'rejected' | 'consumed';
  requested_at: string;
  responded_at?: string;
  user_name?: string; // Para UI Admin
  user_email?: string; // Para UI Admin
  user_area?: string; // Para UI Admin
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
  // Joins
  user_name?: string;
  user_email?: string;
  user_avatar?: string;
}

// Lista de correos con acceso al módulo de Administrador
export const ADMIN_EMAILS = [
  'zerklucio@gmail.com',
  'darienperez695@gmail.com'
];
