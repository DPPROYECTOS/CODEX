import { Area, Procedure, Status, User } from '../types';

export const MOCK_USERS: User[] = [
  {
    $id: 'user_1',
    name: 'Juan Pérez',
    email: 'juan@uad.com',
    area: Area.IT,
    allowedAreas: [Area.IT],
    privacyAccepted: false, 
    role: 'collaborator'
  },
  {
    $id: 'user_2',
    name: 'Maria Gonzalez',
    email: 'maria@uad.com',
    area: Area.HR,
    allowedAreas: [Area.HR],
    privacyAccepted: true,
    role: 'collaborator'
  }
];

const sharedDesc = `
  <h3 class="text-lg font-semibold mb-2">Objetivo</h3>
  <p class="mb-4">Establecer los lineamientos para la ejecución correcta de este proceso dentro de la organización.</p>
  <h3 class="text-lg font-semibold mb-2">Alcance</h3>
  <p class="mb-4">Aplica a todo el personal del área correspondiente.</p>
  <h3 class="text-lg font-semibold mb-2">Desarrollo</h3>
  <ul class="list-disc pl-5 mb-4 space-y-2">
    <li>Paso 1: Identificar la necesidad del requerimiento.</li>
    <li>Paso 2: Validar con el supervisor directo.</li>
    <li>Paso 3: Registrar en la plataforma.</li>
  </ul>
`;

export const MOCK_PROCEDURES: Procedure[] = [
  // IT Procedures
  {
    $id: 'proc_it_1',
    name: 'Política de Seguridad de la Información',
    code: 'IT-SEC-001',
    area: Area.IT,
    version: '2.1',
    status: Status.ACTIVE,
    description: sharedDesc,
    attachmentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    format: 'pdf',
    urlVideo: 'https://www.youtube.com/embed/lxRwEPvL-mQ', 
    updatedAt: '2023-10-15T10:00:00Z',
    responsible: 'Gerencia de TI',
    history: [
      { version: '2.1', date: '2023-10-15', changeLog: 'Actualización de controles de acceso', author: 'Admin' },
      { version: '2.0', date: '2023-01-10', changeLog: 'Revisión anual', author: 'Admin' }
    ]
  },
  {
    $id: 'proc_it_2',
    name: 'Inventario de Hardware (Formato)',
    code: 'IT-OPS-004',
    area: Area.IT,
    version: '1.0',
    status: Status.REVIEW,
    description: '<p>Descargue este formato para realizar el inventario mensual de activos.</p>',
    attachmentUrl: '#',
    format: 'xlsx',
    updatedAt: '2023-11-01T09:30:00Z',
    responsible: 'Soporte Técnico',
    history: []
  },
  // HR Procedures
  {
    $id: 'proc_hr_1',
    name: 'Plantilla de Contrato Laboral',
    code: 'HR-REC-001',
    area: Area.HR,
    version: '4.0',
    status: Status.ACTIVE,
    description: sharedDesc,
    attachmentUrl: '#',
    format: 'docx',
    updatedAt: '2023-09-20T14:15:00Z',
    responsible: 'Gerencia RH',
    history: []
  },
  {
    $id: 'proc_hr_2',
    name: 'Solicitud de Vacaciones',
    code: 'HR-ADM-010',
    area: Area.HR,
    version: '1.5',
    status: Status.ACTIVE,
    description: sharedDesc,
    attachmentUrl: '',
    format: 'pdf',
    updatedAt: '2023-10-05T11:00:00Z',
    responsible: 'Nómina',
    history: []
  }
];