
# CODEX (UAD Consultation Platform) - Documentación Maestra v1.5

Este documento es la **Fuente de Verdad** técnica y operativa del proyecto **CODEX**. Describe la arquitectura, lógica de seguridad, esquemas de datos y flujos críticos tras la transición de "Nexus" a la versión estable **v1.5**.

---

## 1. Identidad y Propósito
**CODEX** es la plataforma corporativa de Inteligencia Operacional y Gestión del Conocimiento de **SUAVE Y FÁCIL S.A. DE C.V.** 
Su función primaria es servir como repositorio centralizado de procedimientos operativos, garantizando que solo el personal autorizado acceda a la información bajo estrictos protocolos de seguridad y cumplimiento legal.

### Pilares del Sistema v1.5:
1.  **Seguridad Forense:** Monitoreo activo de comportamientos de riesgo (capturas, pérdida de foco, copiado).
2.  **Validación de Hardware (HWID):** Registro y limitación de dispositivos físicos por cuenta de usuario.
3.  **Cumplimiento Normativo (ACUR):** Firma digital obligatoria vinculada a la identidad legal del colaborador.
4.  **Arquitectura Dual-Cloud:** Sincronización en tiempo real con la base de datos maestra de UAD y persistencia local en CODEX Legacy.

---

## 2. Matriz de Roles y Permisos

### A. Usuario Estándar (Colaborador)
*   **Acceso:** Limitado estrictamente a su(s) área(s) asignada(s).
*   **Firma Digital:** Bloqueo total de la interfaz hasta aceptar el ACUR CODEX.
*   **Visibilidad:** Puede ver procedimientos vigentes y caducos de su departamento.
*   **Interacción:** Puede abrir tickets de consulta y enviar propuestas de mejora (Kaizen) para sus áreas permitidas.
*   **Seguridad:** Su visualización está protegida por marcas de agua dinámicas y sensores de actividad.
*   **Dispositivos:** Limitado a un número de terminales definido por administración (default: 3).

### B. Administrador Global (Root/Admin)
*   **Acceso:** Visibilidad total de todas las áreas de la corporación.
*   **Bypass Legal:** Puede omitir la firma de privacidad si accede desde hardware maestro o en modo auditoría.
*   **Modo Auditoría (Impersonación):** Capacidad de ingresar al sistema "como si fuera" cualquier otro usuario para validar su vista y accesos.
*   **Gestión Operativa:**
    *   Autorizar/Denegar descargas de archivos originales.
    *   Resolver tickets de consulta globales.
    *   Evaluar, retroalimentar y aprobar propuestas de mejora continua.
*   **Control Maestro:**
    *   Expulsión forzosa de usuarios en tiempo real (Socket Kill).
    *   Eliminación de IDs de hardware/terminales vinculadas.
    *   Revocación de firmas legales para forzar re-aceptación de términos.
    *   CRUD de Áreas/Departamentos.
*   **Seguridad:** Acceso al Monitor de Incidencias con reporte forense exportable (CSV/Excel).

---

## 3. Arquitectura Técnica y Conectividad

### A. Conexión a Bases de Datos (Supabase)
CODEX utiliza un modelo de **Agregación en Frontend** conectándose a dos instancias independientes:
1.  **Instancia Master (UAD):** Fuente de verdad de procedimientos nuevos y carpetas publicadas.
2.  **Instancia Legacy (CODEX):** Gestiona usuarios, logs de seguridad, firmas legales, tickets, propuestas y procedimientos históricos.

### B. Tablas Clave y Relaciones (Legacy DB)
| Tabla | Función | Conexión con Pantallas |
| :--- | :--- | :--- |
| `users` | Directorio de personal. | Profile, Login, Admin Directory. |
| `user_authorized_ips` | Registro de HWID (Hardware ID). | Login (Validación), Monitor de Sesiones. |
| `privacy_signatures` | Constancias de aceptación ACUR. | Privacy, Admin Compliance Table. |
| `user_area_access` | Matriz Muchos-a-Muchos de permisos. | Catalog, Admin Multi-Area Manager. |
| `security_incidents` | Registro de infracciones. | File Viewer (Sensores), Admin Incidents Monitor. |
| `procedure_access_logs` | Métricas de uso y tiempos. | Procedure Detail, Admin Analytics. |
| `consultation_messages` | Tickets de soporte. | Consultation, Admin Inbox. |
| `improvement_proposals` | Sistema Kaizen de mejora. | Proposals, Admin Proposals Manager. |

---

## 4. Funcionamiento por Módulos

### 1. Sistema de Acceso y Hardware ID (HWID)
Al iniciar sesión, CODEX genera una "huella digital" del hardware (basada en resolución, núcleos de CPU y plataforma). 
- Si el dispositivo no está en `user_authorized_ips`, se intenta registrar. 
- Si el usuario excedió su límite de terminales, el login se bloquea.
- **Admin Hardware:** Los IDs de los administradores se marcan como "Maestros" para permitir operaciones de raíz.

### 2. Visor de Documentos con Escudo de Privacidad
Implementado en `FileViewerModal.tsx`, utiliza múltiples sensores:
- **Blur Sensor:** Si la ventana pierde el foco (Alt+Tab o Herramienta de recortes), el contenido se oculta inmediatamente y se loguea una incidencia.
- **Key Shield:** Bloquea Ctrl+P, Ctrl+S, Ctrl+C y Clic Derecho.
- **Watermark:** Capa de opacidad mínima que imprime el nombre del usuario e IP en todo el documento para disuadir fotografías físicas.

### 3. Monitor de Sesiones en Tiempo Real
Utiliza **Supabase Realtime (Presence & Broadcast)**.
- Permite a los administradores ver quién está conectado, desde qué área y con qué ID de Hardware.
- **Acción Forzosa:** El administrador puede enviar un mensaje de `force_logout` vía socket que cierra instantáneamente la sesión del usuario objetivo.

### 4. Gestión de Consultas y Colaboración
- Los tickets se agrupan por Área.
- Un usuario solo ve tickets de las áreas que tiene permitidas.
- Las respuestas de Gerentes o Administradores se marcan visualmente como "RESPUESTA OFICIAL".

### 5. Analítica y Reportes
- Registra el tiempo de lectura exacto de cada procedimiento.
- Genera reportes CSV de seguridad y uso para auditorías externas de Calidad.

---

## 5. Protocolo de Horarios
CODEX restringe el acceso imperativamente vía `ScheduleGuard`:
- **Lunes a Viernes:** 07:00 a 18:00 hrs.
- **Sábado:** 07:00 a 13:00 hrs.
- **Fuera de horario:** Pantalla de bloqueo total de sistema, impidiendo cualquier consulta extemporánea.

---
**CODEX System v1.5** - *Security through Transparency.*
