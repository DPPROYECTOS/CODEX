
# NEXUS (UAD Consultation Platform) - Documentación Maestra v2.5.0

Este archivo es la **Fuente de Verdad** técnica del proyecto. Describe la arquitectura, lógica de negocio, esquema de base de datos y flujos críticos implementados hasta la fecha.

---

## 1. Resumen del Proyecto
**NEXUS** es una plataforma corporativa de gestión de conocimiento y soporte operativo ("Solo Lectura" para el usuario final). Su arquitectura se basa en la **Segregación Estricta de Datos**, **Cumplimiento Normativo** y una **Arquitectura Federada de Datos** (Maestro-Esclavo).

### Pilares Fundamentales:
1.  **Arquitectura Híbrida (Dual DB):** NEXUS consume datos simultáneamente de su propia base de datos (Legacy/Usuarios) y de la Base Maestra de UAD (Procedimientos Nuevos), fusionándolos en tiempo real.
2.  **Seguridad de Acceso Estricta:** No existe auto-registro. Solo los usuarios pre-existentes en la tabla `users` pueden iniciar sesión.
3.  **Muro de Privacidad Legal:** Bloqueo total de la interfaz hasta firmar digitalmente el ACUR (Acuerdo Corporativo).
4.  **Estantería Digital:** Organización visual por Áreas -> Secciones (Carpetas) mediante lógica de agregación en el frontend.
5.  **Visualización Segura:** Estrategia de "Embeds" para visualizar documentos sin forzar la descarga en el dispositivo.

---

## 2. Stack Tecnológico

*   **Frontend:** React 18 (esm.sh), React Router DOM 6, TypeScript.
*   **Estilos:** Tailwind CSS. 
    *   **Sistema de Diseño:** "Dark Neon / Steampunk Industrial".
    *   **Paleta:** Fondos Slate-950/Black, Acentos Púrpura Neón (Tecnología) y Ámbar (Alertas/Industrial).
*   **Backend & DB:** Supabase (PostgreSQL, Auth, Realtime).
    *   **Cliente Dual:** Se instancian dos clientes de Supabase (`supabaseLegacy` y `supabaseMaster`).
*   **Almacenamiento Legal:** Google Drive (vía Google Apps Script Web App).
*   **Visualizadores Externos:** Google Docs Viewer y Microsoft Office Web Viewer.

---

## 3. Arquitectura de Datos (Federación)

El sistema utiliza una estrategia de **"Frontend Aggregation"** para evitar JOINs complejos entre bases de datos y permisos RLS.

### A. Base de Datos 1: MAESTRO (UAD - Fuente Externa)
*Propósito: Fuente de verdad de Procedimientos Vigentes y Estructura de Carpetas.*

1.  **`published_folders`** (Tabla Plana Espejo)
    *   `origin_folder_id` (uuid): ID original de la carpeta en UAD.
    *   `folder_name` (text): Nombre visual (ej. "Manuales").
    *   `area` (text): Filtro principal.
    *   *Uso:* NEXUS descarga esta lista para pintar las secciones del Catálogo.

2.  **`procedures`** (Documentos Públicos)
    *   `id`, `title`, `code`, `version`, `status`, `file_url` (PDF directo).
    *   `folder_id` (uuid): Vinculación con `published_folders`.
    *   `area` (text): Filtro de seguridad.
    *   *Regla:* Solo se consultan registros donde `status = 'Vigente'`.

### B. Base de Datos 2: LEGACY (NEXUS - Local)
*Propósito: Gestión de Usuarios, Logs, Tickets y Procedimientos Antiguos.*

1.  **`users`** (Identidad)
    *   `id`, `email`, `name`, `area`, `role`, `avatar_url`.
    *   *Seguridad:* El login falla si el usuario no existe aquí.

2.  **`user_area_access`** (Matriz de Seguridad)
    *   Tabla pivote que define qué áreas puede ver un usuario.

3.  **`privacy_signatures`** (Legal)
    *   Registro de firmas del ACUR. Permite revocación administrativa (DELETE).

4.  **`consultation_messages`** (Tickets)
    *   Sistema de soporte colaborativo.

5.  **`download_requests`** (Solicitudes de Archivos)
    *   Control de permisos temporales para descargas de originales.

---

## 4. Módulos y Funcionalidades

### A. Catálogo Inteligente (Nuevo Diseño Dark)
*   **Nivel 1 (Department Cards):** Tarjetas interactivas con efectos de resplandor (glow) y micro-interacciones. Muestran las áreas permitidas.
*   **Nivel 2 (Navegación):**
    *   **Carpetas:** Grid de carpetas con conteo dinámico de documentos internos.
    *   **Archivos:** Lista con metadatos (Código, Versión, Estado) y acciones rápidas (Vista Previa).
    *   **Filtros:** Tabs para alternar entre "Vigentes" (Documentación activa) y "Caducos" (Histórico/Obsoleto).

### B. Visualizador de Documentos (Embed Strategy)
Para evitar la descarga automática de archivos y mantener al usuario en la plataforma, se implementó una lógica de visualización incrustada:

1.  **PDFs:** Se visualizan mediante un `iframe` utilizando **Google Docs Viewer** (`https://docs.google.com/gview?embedded=true&url=...`). Esto renderiza el PDF como una vista web segura.
2.  **Office (Word/Excel):** Se visualizan mediante **Microsoft Office Web Viewer** (`https://view.officeapps.live.com/op/embed.aspx?src=...`).
3.  **Imágenes:** Renderizado nativo `<img>`.
4.  **Fallback:** Si el formato no es soportado, se muestra un botón de descarga explícito.

### C. Interfaz de Usuario (UI/UX) - Tema Dark Neon
*   **Estética:** Ambiente oscuro de alto contraste para reducir fatiga visual en entornos operativos 24/7.
*   **Header:** Barra superior minimalista con menú de perfil y notificaciones sutiles.
*   **Sidebar:** Navegación lateral fija en negro puro con acentos púrpura neón para la sección activa.
*   **Feedback:** Uso de colores semánticos brillantes (Esmeralda=Éxito, Ámbar=Advertencia, Rojo=Error) sobre fondos oscuros.

### D. Seguridad y Acceso
*   **Login Blindado:**
    *   Se eliminó la función de "Auto-Registro".
    *   Si las credenciales Auth son válidas pero el usuario no está en la tabla `public.users`, se fuerza el `signOut` y se deniega el acceso.
*   **Guardia de Horario:**
    *   L-V (07:00 - 18:00), Sáb (07:00 - 13:00). Bloqueo total fuera de este rango con pantalla de "Sistema Cerrado".

### E. Sistema de Privacidad (Legal)
*   Generación de constancias `.doc` y `.html` firmadas digitalmente.
*   Carga automática a Google Drive.
*   **Revocación:** Los administradores pueden eliminar firmas, forzando al usuario a aceptar los términos nuevamente en su próximo inicio de sesión.

### F. Colaboración (Tickets)
*   Usuarios pueden enviar dudas sobre procedimientos.
*   **Visibilidad Cruzada:** Un usuario ve los tickets de su área y de las áreas donde tiene permisos adicionales.
*   Administradores tienen buzón global con capacidad de respuesta y cierre de tickets.

### G. Gestión de Solicitudes de Archivos (Admin)
*   **Solicitud de Originales:** Los usuarios pueden solicitar permisos para descargar archivos fuente (Word/Excel) bloqueados por defecto para edición.
*   **Ciclo de Vida:** Pendiente -> Aprobado (Token Activo) -> Consumido (Token Quemado) o Rechazado.
*   **Limpieza de Historial:** Funcionalidad administrativa que permite **eliminar físicamente** (DELETE SQL) los registros de solicitudes procesadas o antiguas.

---

## 5. Integración Técnica (Snippets Clave)

### Configuración Dual Client (`appwriteService.ts`)
```typescript
// Cliente 1: Operaciones de Escritura y Datos de Usuario (Legacy)
const supabase = createClient(CONFIG_LEGACY.URL, CONFIG_LEGACY.KEY);

// Cliente 2: Solo Lectura de Documentación Maestra (UAD)
const supabaseMaster = createClient(CONFIG_MASTER.URL, CONFIG_MASTER.KEY);
```

### Lógica de Fusión de Datos
```typescript
async getProcedures(area) {
  // 1. Obtener de UAD (Master) - Filtrado por Área
  const masterData = await supabaseMaster.from('procedures').select('*').ilike('area', area);
  
  // 2. Obtener de NEXUS (Legacy) - Filtrado por Área
  const legacyData = await supabase.from('procedures').select('*').ilike('area', area);
  
  // 3. Unificar y Mapear
  return [...masterData, ...legacyData];
}
```

---

## 6. Roles y Permisos
*   **Admin Global:** (`ADMIN_EMAILS` hardcoded). Ve todas las áreas, edita políticas, gestiona tickets y limpia historial de descargas.
*   **Director/Gerente:** Puede tener múltiples entradas en `user_area_access` (Multi-Área).
*   **Usuario Estándar:** Acceso restringido a su área operativa asignada.

---

## 7. Esquema de Base de Datos (Supabase)

A continuación se detallan las tablas creadas en el proyecto **NEXUS (Legacy)** y sus políticas de acceso:

### A. Tablas Principales

| Tabla | Descripción | Campos Clave | Permisos / RLS |
| :--- | :--- | :--- | :--- |
| **`users`** | Directorio oficial de empleados. Vinculado a `auth.users` vía ID. | `id` (uuid, PK), `email`, `name`, `area`, `role`, `last_ip`, `avatar_url`. | Lectura pública (autenticados). Escritura restringida a Admins o Self-Update (avatar). |
| **`user_area_access`** | Matriz de permisos "Muchos a Muchos". Define qué áreas ve un usuario. | `id`, `user_id` (FK users), `area_name` (text). | Lectura pública (autenticados). Escritura solo Admins. |
| **`departments`** | Catálogo maestro de áreas operativas. | `id`, `name` (unique), `max_users`. | Lectura pública. Escritura solo Admins. |
| **`procedures`** (Legacy) | Repositorio local de documentos antiguos o internos. | `id`, `title`, `code`, `area`, `status` ('Vigente', 'Obsoleto'), `file_url`. | Lectura pública (autenticados). Escritura solo Admins. |

### B. Módulo Legal y Cumplimiento

| Tabla | Descripción | Campos Clave | Permisos / RLS |
| :--- | :--- | :--- | :--- |
| **`privacy_signatures`** | Registro de firmas del ACUR. Bloquea la UI si no existe registro. | `user_id` (PK, FK users), `signed_at`, `signed_name`, `signed_department`. | Insert/Read: Authenticated (Self). Delete: Admin Only. |
| **`system_config`** | Configuración dinámica (Plantillas HTML, IPs seguras). | `key` (PK, text), `value` (text). | Read: Public. Write: Admin Only. |

### C. Módulo de Colaboración y Solicitudes

| Tabla | Descripción | Campos Clave | Permisos / RLS |
| :--- | :--- | :--- | :--- |
| **`consultation_messages`** | Tickets de soporte y consultas. | `id`, `user_id`, `message`, `status` ('pending','reviewed','closed'), `area` (target). | Insert: Authenticated. Update/Delete: Admin Only. |
| **`consultation_replies`** | Hilo de respuestas de los tickets. | `id`, `message_id` (FK), `user_id`, `message`. | Insert: Authenticated. Read: Related participants. |
| **`download_requests`** | Solicitudes de descarga de originales. | `id`, `user_id`, `procedure_id`, `status` ('pending','approved','rejected','consumed'). | Insert: Authenticated. Update/Delete: Admin Only. |

### D. Storage Buckets

1.  **`avatars`**: Imágenes de perfil de usuario. Acceso público para lectura, subida autenticada.
2.  **`procedures`**: Archivos PDF/Word. Acceso restringido (se prefieren URLs firmadas o públicas según la política).
