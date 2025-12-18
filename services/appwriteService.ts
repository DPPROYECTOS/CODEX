
import { Area, Procedure, User, Status, ADMIN_EMAILS, Department, OnlineUser, ConsultationMessage, ConsultationReply, Folder, DownloadRequest, AccessLog, ImprovementProposal } from '../types';
import { MOCK_USERS, MOCK_PROCEDURES } from './mockData';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

// --- CONFIGURACIÓN DE SUPABASE (DUAL CLIENT ARCHITECTURE) ---

// 1. DB LEGACY (NEXUS): Usuarios, Logs, Histórico y Escritura
const CONFIG_LEGACY = {
  SUPABASE_URL: 'https://etjhwybavjcygkllbaye.supabase.co',
  SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0amh3eWJhdmpjeWdrbGxiYXllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNjUwOTUsImV4cCI6MjA3OTc0MTA5NX0.zV3n3CErV3hL6gGDZofETZufFpnfz7d0OgNVyjmvOm4'
};

// 2. DB MASTER (UAD): Procesos Nuevos (Solo Lectura)
const CONFIG_MASTER = {
  SUPABASE_URL: 'https://hourctostlvdsshmgorf.supabase.co',
  SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvdXJjdG9zdGx2ZHNzaG1nb3JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MTQ3MTUsImV4cCI6MjA3NDk5MDcxNX0.8ORfYwoEWxgBmdkCgCKLwDAffpo4Fzzp2Cdk9qDO2_U'
};

// Verificar modos
const isLegacyReady = () => CONFIG_LEGACY.SUPABASE_URL !== '' && CONFIG_LEGACY.SUPABASE_KEY !== '';
const isMasterReady = () => CONFIG_MASTER.SUPABASE_URL !== '' && CONFIG_MASTER.SUPABASE_KEY !== '';

// Inicializar Clientes
let supabase: SupabaseClient | null = null;       // Cliente Principal (Legacy/Auth/Write)
let supabaseMaster: SupabaseClient | null = null; // Cliente Maestro (Read Only)

if (isLegacyReady()) {
  try {
    supabase = createClient(CONFIG_LEGACY.SUPABASE_URL, CONFIG_LEGACY.SUPABASE_KEY);
  } catch (e) {
    console.error("Error inicializando Supabase Legacy Client", e);
  }
}

if (isMasterReady()) {
  try {
    supabaseMaster = createClient(CONFIG_MASTER.SUPABASE_URL, CONFIG_MASTER.SUPABASE_KEY);
  } catch (e) {
    console.error("Error inicializando Supabase Master Client", e);
  }
}

const STORAGE_KEY_USER = 'codex_mock_user';

// Helper para normalizar strings a mayúsculas para comparaciones robustas
export const normalizeString = (str: string) => {
    return str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim() : "";
};

export const appwriteService = {
  
  async checkConnection(): Promise<string> {
    if (!isLegacyReady() || !supabase) return "OK"; 
    try {
        const { error: authError } = await supabase.auth.getSession();
        if (authError) throw authError;
        return "OK";
    } catch (e: any) {
        console.error("Supabase Ping Error", e);
        return "BLOCKED";
    }
  },

  // --- AUTHENTICATION ---

  async login(email: string, password?: string): Promise<User> {
    // 1. MODO DEMO / FALLBACK
    if (!password) {
        const user = MOCK_USERS[0];
        const extendedUser = { ...user, allowedAreas: [user.area] }; 
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(extendedUser));
        return extendedUser;
    }

    // 2. MODO REAL (Supabase Legacy)
    if (isLegacyReady() && supabase) {
      try {
        console.log(`Conectando a Supabase Auth...`);
        
        // A. Login Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError) throw new Error(authError.message);
        if (!authData.user) throw new Error("No se pudo obtener el usuario.");

        const isAdminByEmail = ADMIN_EMAILS.includes(email.toLowerCase());

        // B. Obtener Perfil completo (Incluyendo max_devices)
        let { data: profileData } = await supabase
            .from('users') 
            .select('*')
            .eq('id', authData.user.id) 
            .maybeSingle();

        if (!profileData) {
            console.warn("Usuario autenticado pero sin registro en tabla users. Bloqueando acceso.");
            await supabase.auth.signOut();
            throw new Error("ACCESO DENEGADO: Su cuenta no está autorizada en CODEX. Contacte al Administrador.");
        }

        // C. VALIDACIÓN DE IP Y DISPOSITIVOS (IP BINDING)
        let currentIp = '';
        try {
            const ipRes = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipRes.json();
            currentIp = ipData.ip;
        } catch (e) { console.warn("No se pudo obtener la IP pública del cliente."); }

        // Si no es administrador, aplicamos la restricción de dispositivos
        if (!isAdminByEmail && currentIp) {
            // Verificar si esta IP ya está autorizada
            const { data: authorizedIps } = await supabase
                .from('user_authorized_ips')
                .select('ip_address')
                .eq('user_id', authData.user.id);

            const authorizedList = authorizedIps?.map((i: any) => i.ip_address) || [];
            
            if (!authorizedList.includes(currentIp)) {
                // Si la IP es nueva, verificar si tiene cupo (max_devices)
                const maxDevices = profileData.max_devices || 2;
                
                if (authorizedList.length >= maxDevices) {
                    await supabase.auth.signOut();
                    throw new Error(`ACCESO DENEGADO: Has alcanzado el límite de ${maxDevices} dispositivos autorizados. Contacta a Soporte Técnico.`);
                } else {
                    // Registrar nueva IP automáticamente
                    await supabase.from('user_authorized_ips').insert({
                        user_id: authData.user.id,
                        ip_address: currentIp,
                        device_name: `Equipo ${authorizedList.length + 1}`
                    });
                    console.log("Nueva IP vinculada al usuario:", currentIp);
                }
            }
        }

        // D. Gestión de IP con Protección de Modo Auditor
        try {
            // Obtener lista blanca para detectar si el que loguea es un Admin por su IP
            const whitelistStr = await this.getSystemConfig('admin_safe_ips');
            const whitelist = whitelistStr ? JSON.parse(whitelistStr) : [];
            const isIpAuthorized = whitelist.includes(currentIp);

            // REGLA DE PRIVACIDAD: No grabar IP si es un admin entrando a cuenta ajena
            const shouldSaveIp = isAdminByEmail || !isIpAuthorized;

            if (shouldSaveIp && currentIp) {
                supabase.from('users')
                    .update({ last_ip: currentIp })
                    .eq('id', authData.user.id)
                    .then(({ error }) => { if(error) console.warn("Error actualizando IP:", error); });
            }
        } catch (e) { console.warn("No se pudo obtener IP o verificar modo auditor"); }

        // E. Obtener Matriz de Accesos (Tabla 'user_area_access')
        let allowedAreas: string[] = [];
        try {
            const { data: accessData } = await supabase
                .from('user_area_access')
                .select('area_name')
                .eq('user_id', authData.user.id);
            
            if (accessData && accessData.length > 0) {
                allowedAreas = Array.from(new Set(accessData.map((a: any) => (a.area_name || '').toUpperCase())));
            }
        } catch (e) { console.warn("Tabla de matriz de acceso no disponible aún."); }

        const primaryArea = ((profileData?.area as string) || Area.IT).toUpperCase();
        if (allowedAreas.length === 0) {
            allowedAreas = [primaryArea];
        }

        // --- ADMINISTRADOR GLOBAL ---
        if (isAdminByEmail) {
            try {
                const { data: allDepts } = await supabase.from('departments').select('name').order('name');
                if (allDepts && allDepts.length > 0) {
                    allowedAreas = Array.from(new Set(allDepts.map((d: any) => (d.name || '').toUpperCase())));
                } else {
                    allowedAreas = Object.values(Area).map(a => a.toUpperCase());
                }
            } catch (e) {
                allowedAreas = Object.values(Area).map(a => a.toUpperCase());
            }
        }

        const finalRole = isAdminByEmail ? 'admin' : (profileData?.role || 'viewer');

        // F. Verificar privacidad con Bypass de Auditoría
        const { data: signatureData } = await supabase
            .from('privacy_signatures')
            .select('user_id, signed_name, signed_department')
            .eq('user_id', authData.user.id)
            .maybeSingle();

        let hasSigned = !!signatureData;
        let isImpersonating = false;

        // Bypass si la IP es de un admin
        if (!hasSigned && !isAdminByEmail && currentIp) {
            const whitelistStr = await this.getSystemConfig('admin_safe_ips');
            const whitelist = whitelistStr ? JSON.parse(whitelistStr) : [];
            
            if (whitelist.includes(currentIp)) {
                console.log("🔒 MODO AUDITOR DETECTADO: IP Autorizada.");
                isImpersonating = true;
                hasSigned = true; 
            }
        }

        // Construir objeto usuario
        const userObj: User = {
            $id: profileData?.id || authData.user.id,
            name: profileData?.name || email.split('@')[0],
            email: profileData?.email || email,
            area: primaryArea,
            allowedAreas: allowedAreas,
            role: finalRole,
            privacyAccepted: hasSigned,
            signedName: signatureData?.signed_name,
            signedDepartment: signatureData?.signed_department,
            lastIp: profileData?.last_ip,
            avatarUrl: profileData?.avatar_url,
            maxDevices: profileData.max_devices || 2,
            isImpersonating: isImpersonating 
        };
        
        return userObj;

      } catch (error: any) {
        console.error("Error login Supabase:", error);
        if (error.message.includes("Invalid login")) throw new Error("Credenciales incorrectas.");
        throw error;
      }
    }
    
    throw new Error("Falta configurar SUPABASE_URL.");
  },

  async logout(): Promise<void> {
    if (isLegacyReady() && supabase) {
      await supabase.auth.signOut();
    } 
    localStorage.removeItem(STORAGE_KEY_USER);
  },

  async getCurrentUser(): Promise<User | null> {
    if (isLegacyReady() && supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

        if (!profile) {
            await supabase.auth.signOut();
            return null;
        }

        let allowedAreas: string[] = [];
        const { data: accessData } = await supabase
            .from('user_area_access')
            .select('area_name')
            .eq('user_id', user.id);
        
        if (accessData && accessData.length > 0) {
            allowedAreas = Array.from(new Set(accessData.map((a: any) => (a.area_name || '').toUpperCase())));
        }

        const primaryArea = ((profile?.area as string) || Area.IT).toUpperCase();
        if (allowedAreas.length === 0) allowedAreas = [primaryArea];

        const { data: signatureData } = await supabase
            .from('privacy_signatures')
            .select('user_id, signed_name, signed_department')
            .eq('user_id', user.id)
            .maybeSingle();
        
        const email = user.email || '';
        const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());

        if (isAdmin) {
             try {
                const { data: allDepts } = await supabase.from('departments').select('name').order('name');
                if (allDepts && allDepts.length > 0) {
                    allowedAreas = Array.from(new Set(allDepts.map((d: any) => (d.name || '').toUpperCase())));
                } else {
                    allowedAreas = Object.values(Area).map(a => a.toUpperCase());
                }
            } catch (e) {
                allowedAreas = Object.values(Area).map(a => a.toUpperCase());
            }
        }

        let isImpersonating = false;
        let hasSigned = !!signatureData;

        if (!hasSigned && !isAdmin) {
             try {
                const ipRes = await fetch('https://api.ipify.org?format=json');
                const ipData = await ipRes.json();
                const currentIp = ipData.ip;
                
                const whitelistStr = await this.getSystemConfig('admin_safe_ips');
                const whitelist = whitelistStr ? JSON.parse(whitelistStr) : [];
                
                if (whitelist.includes(currentIp)) {
                    isImpersonating = true;
                    hasSigned = true;
                }
             } catch(e) { console.warn("Auditor check failed", e); }
        }

        return {
            $id: user.id,
            name: profile?.name || email.split('@')[0],
            email: email,
            area: primaryArea,
            allowedAreas: allowedAreas,
            role: isAdmin ? 'admin' : (profile?.role || 'viewer'),
            privacyAccepted: hasSigned,
            signedName: signatureData?.signed_name,
            signedDepartment: signatureData?.signed_department,
            lastIp: profile?.last_ip,
            avatarUrl: profile?.avatar_url,
            maxDevices: profile.max_devices || 2,
            isImpersonating: isImpersonating
        };
      } catch (e) {}
    }
    const stored = localStorage.getItem(STORAGE_KEY_USER);
    return stored ? JSON.parse(stored) : null;
  },

  async uploadUserAvatar(userId: string, file: File): Promise<string | null> {
    if (isLegacyReady() && supabase) {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            const publicUrl = data.publicUrl;

            const { error: dbError } = await supabase
                .from('users')
                .update({ avatar_url: publicUrl })
                .eq('id', userId);

            if (dbError) throw dbError;

            return publicUrl;
        } catch (error) {
            console.error("Error subiendo avatar:", error);
            return null;
        }
    }
    return null;
  },

  subscribeToPresence(user: User, onSync: (users: OnlineUser[]) => void): RealtimeChannel | null {
    if (!isLegacyReady() || !supabase) return null;
    try {
        const channel = supabase.channel('codex_global_presence', {
            config: { presence: { key: user.$id } },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState();
                const users: OnlineUser[] = [];
                for (const key in newState) {
                    const presenceList = newState[key] as any[];
                    presenceList.forEach(p => {
                         if (p.userId) {
                            users.push({
                                userId: p.userId,
                                name: p.name,
                                email: p.email,
                                area: p.area,
                                role: p.role,
                                onlineAt: p.onlineAt
                            });
                         }
                    });
                }
                onSync(users);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        userId: user.$id,
                        name: user.name,
                        email: user.email,
                        area: user.area,
                        role: user.role,
                        onlineAt: new Date().toISOString(),
                    });
                }
            });
        return channel;
    } catch (e) { return null; }
  },

  async unsubscribeFromPresence(channel: RealtimeChannel): Promise<void> {
    if (channel) await channel.unsubscribe();
  },

  async updateUserPrivacy(userId: string, signedName?: string, signedDepartment?: string): Promise<void> {
    if (isLegacyReady() && supabase) {
        await supabase
          .from('privacy_signatures')
          .upsert({ 
            user_id: userId, 
            signed_at: new Date().toISOString(),
            signed_name: signedName,
            signed_department: signedDepartment
          }, { onConflict: 'user_id' });
    }
  },

  async deleteUserPrivacySignature(userId: string): Promise<boolean> {
    if (isLegacyReady() && supabase) {
        const { error } = await supabase
            .from('privacy_signatures')
            .delete()
            .eq('user_id', userId);
        return !error;
    }
    return true;
  },

  async getAvailableDepartments(): Promise<Department[]> {
    if (isLegacyReady() && supabase) {
        try {
            const { data: depts } = await supabase.from('departments').select('*').order('name');
            const { data: signatures } = await supabase.from('privacy_signatures').select('signed_department');

            const counts: {[key: string]: number} = {};
            signatures?.forEach((s: any) => {
                if (s.signed_department) counts[s.signed_department] = (counts[s.signed_department] || 0) + 1;
            });

            return (depts || []).map((d: any) => ({
                id: d.id,
                name: (d.name || '').toUpperCase(),
                max_users: d.max_users,
                current_count: counts[d.name] || 0
            })).filter((d: any) => d.current_count < d.max_users);

        } catch (e) { return []; }
    }
    return [];
  },
  
  async getAllAreas(): Promise<string[]> {
      if (isLegacyReady() && supabase) {
          try {
              const { data } = await supabase.from('departments').select('name').order('name');
              return data ? data.map((d: any) => (d.name || '').toUpperCase()) : [];
          } catch(e) { return []; }
      }
      return Object.values(Area).map(a => a.toUpperCase());
  },

  async createArea(name: string): Promise<boolean> {
      if (isLegacyReady() && supabase) {
          try {
            const upperName = name.trim().toUpperCase();
            const { error } = await supabase.from('departments').insert({ name: upperName, max_users: 15 });
            if (error) {
                console.error("Create area error:", error);
                return false;
            }
            return true;
          } catch(e) {
            console.error(e);
            return false;
          }
      }
      return false;
  },

  async deleteArea(name: string): Promise<boolean> {
      if (isLegacyReady() && supabase) {
          try {
            const { error } = await supabase.from('departments').delete().eq('name', name);
            if (error) {
                console.error("Delete area error:", error);
                return false;
            }
            return true;
          } catch(e) {
            console.error(e);
            return false;
          }
      }
      return false;
  },

  async renameArea(oldName: string, newName: string): Promise<boolean> {
      if (isLegacyReady() && supabase) {
          try {
            const upperNewName = newName.trim().toUpperCase();
            const { error } = await supabase.rpc('api_rename_area', { old_name: oldName, new_name: upperNewName });
            if (error) {
                console.error("Rename area error:", error);
                return false;
            }
            return true;
          } catch(e) {
            console.error(e);
            return false;
          }
      }
      return false;
  },

  async getFolders(area?: string): Promise<Folder[]> {
    if (isMasterReady() && supabaseMaster) {
      try {
        let query = supabaseMaster
          .from('published_folders')
          .select('*')
          .order('folder_name');
        
        if (area) {
            query = query.ilike('area', area); 
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        return data.map((f: any) => ({
          id: f.origin_folder_id || f.id, 
          name: f.folder_name || f.name,  
          parent_id: null, 
          created_at: new Date().toISOString(),
          area: (f.area || '').toUpperCase()
        }));
      } catch (e) {
        console.error("Error fetching folders from UAD Master:", e);
        return [];
      }
    }
    return [];
  },

  async getProcedures(user: User, queryText: string = '', areaFilter?: string): Promise<Procedure[]> {
    if (isLegacyReady() && supabase) {
      try {
        let masterQuery = supabaseMaster 
            ? supabaseMaster.from('procedures').select('*')
            : null;

        if (masterQuery && areaFilter) {
            masterQuery = masterQuery.ilike('area', areaFilter);
        }

        const masterPromise = masterQuery ? masterQuery : Promise.resolve({ data: [], error: null });

        let legacyQuery = supabase.from('procedures')
            .select('*');
        
        if (areaFilter) {
            legacyQuery = legacyQuery.ilike('area', areaFilter);
        }

        const legacyPromise = legacyQuery;
        
        const [masterRes, legacyRes] = await Promise.all([masterPromise, legacyPromise]);

        if (masterRes.error) console.warn("Error fetching Master DB:", masterRes.error);
        if (legacyRes.error) console.warn("Error fetching Legacy DB:", legacyRes.error);

        let rawData = [
            ...(masterRes.data || []),
            ...(legacyRes.data || [])
        ];

        if (queryText) {
            const lowerQuery = queryText.toLowerCase();
            rawData = rawData.filter((doc: any) => 
                (doc.name || doc.title || '').toLowerCase().includes(lowerQuery) || 
                (doc.code || '').toLowerCase().includes(lowerQuery)
            );
        }

        const mappedDocs = rawData.map((doc: any) => ({
            $id: doc.id.toString(),
            name: doc.title || doc.name,
            code: doc.code,
            area: (doc.area as string).toUpperCase(), 
            version: doc.version,
            status: doc.status as Status,
            description: doc.description || '',
            attachmentUrl: doc.file_url || doc.url_pdf || doc.attachment_url,
            format: doc.format || 'pdf',
            urlVideo: doc.url_video,
            folder_id: doc.folder_id,
            updatedAt: doc.updated_at || new Date().toISOString(),
            responsible: doc.responsible || 'UAD',
            history: doc.history ? (typeof doc.history === 'string' ? JSON.parse(doc.history) : doc.history) : []
        }));

        if (user.role !== 'admin' && !areaFilter && !queryText) {
             return mappedDocs.filter((d: any) => {
                 const docArea = normalizeString(d.area);
                 return user.allowedAreas.some(allowed => normalizeString(allowed) === docArea);
             });
        }

        return mappedDocs;

      } catch (e) {
          console.warn("Fallo cargando procedimientos", e);
          return [];
      }
    }
    return MOCK_PROCEDURES.filter(p => user.role === 'admin' || user.allowedAreas.includes(p.area));
  },

  async getProcedureById(id: string): Promise<Procedure | undefined> {
    if (isLegacyReady() && supabase) {
      try {
        let doc = null;
        if (supabaseMaster) {
            const { data } = await supabaseMaster.from('procedures').select('*').eq('id', id).maybeSingle();
            if (data) doc = data;
        }
        if (!doc) {
            const { data } = await supabase.from('procedures').select('*').eq('id', id).maybeSingle();
            if (data) doc = data;
        }

        if (!doc) return undefined;

        return {
          $id: doc.id.toString(),
          name: doc.title || doc.name,
          code: doc.code,
          area: (doc.area as string).toUpperCase(),
          version: doc.version,
          status: doc.status as Status,
          description: doc.description || '',
          attachmentUrl: doc.file_url || doc.url_pdf || doc.attachment_url,
          format: doc.format || 'pdf',
          urlVideo: doc.url_video,
          folder_id: doc.folder_id,
          updatedAt: doc.updated_at || new Date().toISOString(),
          responsible: doc.responsible || 'UAD',
          history: doc.history ? (typeof doc.history === 'string' ? JSON.parse(doc.history) : doc.history) : []
        };
      } catch (e) { }
    }
    return MOCK_PROCEDURES.find(p => p.$id === id);
  },

  async updateProcedureResponsible(id: string, newResponsible: string): Promise<boolean> {
    if (isLegacyReady() && supabase) {
        try {
            const { error: legacyError } = await supabase
                .from('procedures')
                .update({ responsible: newResponsible })
                .eq('id', id);
            
            if (!legacyError) return true;

            if (isMasterReady() && supabaseMaster) {
                const { error: masterError } = await supabaseMaster
                    .from('procedures')
                    .update({ responsible: newResponsible })
                    .eq('id', id);
                return !masterError;
            }
        } catch (e) {
            console.error("Error al actualizar responsable:", e);
        }
    }
    return false;
  },

  async getStats(allowedAreas: string[]) {
    if (isLegacyReady() && supabase) {
       try {
           const masterPromise = supabaseMaster 
                ? supabaseMaster.from('procedures').select('status, updated_at, area')
                : Promise.resolve({ data: [] });
            
           const legacyPromise = supabase.from('procedures').select('status, updated_at, area');

           const [masterRes, legacyRes] = await Promise.all([masterPromise, legacyPromise]);

           const allProcs = [
               ...(masterRes.data || []),
               ...(legacyRes.data || [])
           ];
            
           const normalizedAllowed = allowedAreas.map(a => normalizeString(a));

           const filtered = allProcs.filter((p: any) => {
               const pArea = normalizeString(p.area);
               return normalizedAllowed.includes(pArea);
           });

           const active = filtered.filter((p: any) => p.status === Status.ACTIVE || p.status === 'Vigente').length;
           const review = filtered.filter((p: any) => p.status === Status.REVIEW || p.status === 'En Revisión').length;
           
           filtered.sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
           
           return { totalActive: active, totalReview: review, lastUpdated: filtered[0]?.updated_at };
       } catch (e) {}
    }
    return { totalActive: 0, totalReview: 0, lastUpdated: null };
  },

  async getSystemConfig(key: string): Promise<string | null> {
    if (isLegacyReady() && supabase) {
      const { data } = await supabase.from('system_config').select('value').eq('key', key).maybeSingle();
      return data?.value || null;
    }
    return null;
  },

  async updateSystemConfig(key: string, value: string): Promise<boolean> {
     if (isLegacyReady() && supabase) {
        const { error } = await supabase.from('system_config').upsert({ key, value }, { onConflict: 'key' });
        return !error;
    }
    return false;
  },

  async sendConsultationMessage(userId: string, message: string, area: string, procedureId?: string, procedureName?: string, title?: string): Promise<boolean> {
      if (isLegacyReady() && supabase) {
          const { error } = await supabase.from('consultation_messages').insert({
              user_id: userId,
              title: title,
              message: message,
              procedure_id: procedureId,
              procedure_name: procedureName,
              area: area.toUpperCase(), 
              status: 'pending'
          });
          return !error;
      }
      return false;
  },

  async replyToMessage(messageId: string, userId: string, message: string): Promise<boolean> {
    if (isLegacyReady() && supabase) {
        const { error } = await supabase.from('consultation_replies').insert({
            message_id: messageId,
            user_id: userId,
            message: message
        });
        return !error;
    }
    return false;
  },

  async getCollaborativeMessages(allowedAreas: string[]): Promise<ConsultationMessage[]> {
      if (isLegacyReady() && supabase) {
          const { data, error } = await supabase
              .from('consultation_messages')
              .select(`
                *,
                users (name, email, area, role, avatar_url),
                consultation_replies (
                    id, message, created_at, user_id, 
                    users (name, email, role, avatar_url)
                )
              `)
              .order('created_at', { ascending: false });
          
          if (error) {
              console.error("Error fetching messages", error);
              return [];
          }

          return data.map((msg: any) => ({
              id: msg.id,
              user_id: msg.user_id,
              title: msg.title,
              procedure_id: msg.procedure_id,
              procedure_name: msg.procedure_name,
              message: msg.message,
              status: msg.status,
              created_at: msg.created_at,
              area: (msg.area || '').toUpperCase(),
              user_name: msg.users?.name || msg.users?.email || 'Usuario',
              user_email: msg.users?.email || '',
              user_area: (msg.users?.area || '').toUpperCase(),
              user_role: msg.users?.role || 'viewer',
              user_avatar: msg.users?.avatar_url, 
              replies: (msg.consultation_replies || []).map((r: any) => ({
                  id: r.id,
                  message_id: msg.id,
                  user_id: r.user_id,
                  message: r.message,
                  created_at: r.created_at,
                  user_name: r.users?.name || r.users?.email || 'Usuario',
                  user_role: r.users?.role,
                  user_avatar: r.users?.avatar_url
              })).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          }));
      }
      return [];
  },

  async adminGetConsultationMessages(): Promise<ConsultationMessage[]> {
      return this.getCollaborativeMessages([]);
  },

  async adminUpdateMessageStatus(messageId: string, status: 'reviewed' | 'archived' | 'closed'): Promise<boolean> {
      if (isLegacyReady() && supabase) {
          const { error } = await supabase
              .from('consultation_messages')
              .update({ status })
              .eq('id', messageId);
          return !error;
      }
      return false;
  },

  async adminDeleteMessage(messageId: string): Promise<boolean> {
      if (isLegacyReady() && supabase) {
          const { error } = await supabase
              .from('consultation_messages')
              .delete()
              .eq('id', messageId);
          return !error;
      }
      return false;
  },

  async requestDownload(userId: string, procedureId: string, procedureName: string): Promise<boolean> {
    if (isLegacyReady() && supabase) {
      const { error } = await supabase.from('download_requests').insert({
        user_id: userId,
        procedure_id: procedureId,
        procedure_name: procedureName,
        status: 'pending'
      });
      return !error;
    }
    return false;
  },

  async getDownloadStatus(userId: string, procedureId: string): Promise<DownloadRequest | null> {
    if (isLegacyReady() && supabase) {
      const { data, error } = await supabase
        .from('download_requests')
        .select('*')
        .eq('user_id', userId)
        .eq('procedure_id', procedureId)
        .in('status', ['pending', 'approved', 'rejected']) 
        .order('requested_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error("Error checking download status", error);
        return null;
      }
      return data;
    }
    return null;
  },

  async consumeDownloadToken(requestId: string): Promise<boolean> {
    if (isLegacyReady() && supabase) {
      const { error } = await supabase
        .from('download_requests')
        .update({ status: 'consumed' })
        .eq('id', requestId);
      return !error;
    }
    return false;
  },

  async adminGetDownloadRequests(): Promise<DownloadRequest[]> {
    if (isLegacyReady() && supabase) {
       const { data, error } = await supabase
         .from('download_requests')
         .select(`*, users (name, email, area)`)
         .in('status', ['pending', 'approved', 'consumed'])
         .order('requested_at', { ascending: false });

       if (error) {
           console.error("Error fetching download requests (check FK relations):", error);
           return [];
       }

       return data.map((r: any) => ({
         id: r.id,
         user_id: r.user_id,
         procedure_id: r.procedure_id,
         procedure_name: r.procedure_name,
         status: r.status,
         requested_at: r.requested_at,
         user_name: r.users?.name || 'Usuario',
         user_email: r.users?.email || 'N/A',
         user_area: (r.users?.area || 'N/A').toUpperCase()
       }));
    }
    return [];
  },

  async adminRespondToDownloadRequest(requestId: string, status: 'approved' | 'rejected'): Promise<boolean> {
    if (isLegacyReady() && supabase) {
      const { error } = await supabase
        .from('download_requests')
        .update({ status, responded_at: new Date().toISOString() })
        .eq('id', requestId);
      return !error;
    }
    return false;
  },

  async adminDeleteDownloadRequest(requestId: string): Promise<boolean> {
    if (isLegacyReady() && supabase) {
        const { error } = await supabase
            .from('download_requests')
            .delete()
            .eq('id', requestId);
        return !error;
    }
    return false;
  },

  async adminGetAllUsers(): Promise<User[]> {
    if (isLegacyReady() && supabase) {
      try {
          const { data: users } = await supabase.from('users').select('*').order('created_at', { ascending: false });
          const { data: signatures } = await supabase.from('privacy_signatures').select('user_id, signed_name, signed_department');
          
          const signatureMap = new Map();
          signatures?.forEach((s: any) => signatureMap.set(s.user_id, s));
          
          return (users || []).map((u: any) => {
              const sig = signatureMap.get(u.id);
              return {
                  $id: u.id,
                  name: u.name,
                  email: u.email,
                  area: (u.area || '').toUpperCase(),
                  allowedAreas: [(u.area || '').toUpperCase()],
                  role: u.role,
                  privacyAccepted: !!sig,
                  signedName: sig?.signed_name,
                  signedDepartment: sig?.signed_department,
                  lastIp: u.last_ip || 'No registrada',
                  avatarUrl: u.avatar_url,
                  maxDevices: u.max_devices || 2
              };
          });
      } catch (e) { return []; }
    }
    return [];
  },

  async logProcedureAccess(userId: string, procedureId: string, procedureName: string, area: string): Promise<string | null> {
    if (isLegacyReady() && supabase) {
      try {
        const { data, error } = await supabase
          .from('procedure_access_logs')
          .insert({
            user_id: userId,
            procedure_id: procedureId,
            procedure_name: procedureName,
            area: area,
            accessed_at: new Date().toISOString(),
            duration_seconds: 0
          })
          .select('id')
          .single();
        
        if (error) {
            console.error("Log error (Insert Failed):", error);
            return null;
        }
        return data.id;
      } catch (e) {
        console.error("Critical Log Error:", e);
        return null;
      }
    }
    return null;
  },

  async updateAccessDuration(logId: string, durationSeconds: number): Promise<void> {
    if (isLegacyReady() && supabase && logId) {
      try {
        supabase
          .from('procedure_access_logs')
          .update({ duration_seconds: durationSeconds })
          .eq('id', logId)
          .then(({error}) => { if(error) console.error("Standard update failed", error)});
      } catch (e) { }
    }
    try {
        const url = `${CONFIG_LEGACY.SUPABASE_URL}/rest/v1/procedure_access_logs?id=eq.${logId}`;
        fetch(url, {
            method: 'PATCH',
            headers: {
                'apikey': CONFIG_LEGACY.SUPABASE_KEY,
                'Authorization': `Bearer ${CONFIG_LEGACY.SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ duration_seconds: durationSeconds }),
            keepalive: true 
        }).catch(e => console.error("Keepalive update failed", e));
    } catch (e) {}
  },

  async adminDeleteAllAccessLogs(): Promise<boolean> {
      if (isLegacyReady() && supabase) {
          try {
              const { error } = await supabase
                  .from('procedure_access_logs')
                  .delete()
                  .neq('id', '00000000-0000-0000-0000-000000000000'); 
              
              if (error) throw error;
              return true;
          } catch (e) {
              console.error("Error al borrar logs:", e);
              return false;
          }
      }
      return false;
  },

  async getAdminAnalytics(): Promise<AccessLog[]> {
    if (isLegacyReady() && supabase) {
      try {
        const { data: logs, error } = await supabase
          .from('procedure_access_logs')
          .select('*')
          .order('accessed_at', { ascending: false })
          .limit(2000); 

        if (error) {
          console.error("Analytics fetch error:", error);
          return [];
        }

        if (!logs || logs.length === 0) return [];

        const userIds = [...new Set(logs.map((l: any) => l.user_id).filter(Boolean))];
        
        let userMap: Record<string, any> = {};
        
        if (userIds.length > 0) {
            const { data: users } = await supabase
                .from('users')
                .select('id, name, email')
                .in('id', userIds);
            
            if (users) {
                users.forEach((u: any) => {
                    userMap[u.id] = u;
                });
            }
        }

        return logs.map((log: any) => ({
          id: log.id,
          user_id: log.user_id,
          procedure_id: log.procedure_id,
          procedure_name: log.procedure_name,
          area: log.area,
          accessed_at: log.accessed_at,
          duration_seconds: log.duration_seconds || 0,
          user_name: userMap[log.user_id]?.name || 'Desconocido',
          user_email: userMap[log.user_id]?.email || 'N/A'
        }));
      } catch (e) {
        console.error("Analytics exception:", e);
        return [];
      }
    }
    return [];
  },

  async createImprovementProposal(proposal: Omit<ImprovementProposal, 'id' | 'created_at' | 'status'>): Promise<boolean> {
    if (isLegacyReady() && supabase) {
        const { error } = await supabase.from('improvement_proposals').insert({
            ...proposal,
            status: 'pending'
        });
        return !error;
    }
    return false;
  },

  async getUserProposals(userId: string): Promise<ImprovementProposal[]> {
    if (isLegacyReady() && supabase) {
        const { data, error } = await supabase
            .from('improvement_proposals')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) return [];
        return data as ImprovementProposal[];
    }
    return [];
  },

  async adminGetProposals(): Promise<ImprovementProposal[]> {
      if (isLegacyReady() && supabase) {
          const { data: proposals, error } = await supabase
            .from('improvement_proposals')
            .select('*')
            .order('created_at', { ascending: false });

          if (error || !proposals) return [];

          const userIds = [...new Set(proposals.map((p: any) => p.user_id))];
          let userMap: Record<string, any> = {};

          if (userIds.length > 0) {
            const { data: users } = await supabase
                .from('users')
                .select('id, name, email, avatar_url')
                .in('id', userIds);
            
            if (users) {
                users.forEach((u: any) => userMap[u.id] = u);
            }
          }

          return proposals.map((p: any) => ({
              ...p,
              user_name: userMap[p.user_id]?.name || 'Desconocido',
              user_email: userMap[p.user_id]?.email || 'N/A',
              user_avatar: userMap[p.user_id]?.avatar_url
          }));
      }
      return [];
  },

  async adminUpdateProposalStatus(id: string, status: string, feedback: string): Promise<boolean> {
      if (isLegacyReady() && supabase) {
          const { error } = await supabase
              .from('improvement_proposals')
              .update({ status, admin_feedback: feedback })
              .eq('id', id);
          return !error;
      }
      return false;
  },

  async adminDeleteProposal(id: string): Promise<boolean> {
      if (isLegacyReady() && supabase) {
          const { error } = await supabase
              .from('improvement_proposals')
              .delete()
              .eq('id', id);
          return !error;
      }
      return false;
  },

  async logSecurityAlert(userId: string, userName: string, userEmail: string, area: string, resourceName: string, eventType: string): Promise<boolean> {
    if (isLegacyReady() && supabase) {
      try {
        const { error } = await supabase
          .from('security_alerts')
          .insert({
            user_id: userId,
            user_name: userName,
            user_email: userEmail,
            area: area,
            resource_name: resourceName,
            event_type: eventType,
            details: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                screenRes: `${window.screen.width}x${window.screen.height}`,
                timestamp: new Date().toISOString()
            }
          });
        
        if (error) throw (error as any);
        return true;
      } catch (e) {
        console.error("Error logging security alert:", e);
        return false;
      }
    }
    return false;
  },

  async adminGetSecurityAlerts(): Promise<any[]> {
      if (isLegacyReady() && supabase) {
          const { data, error } = await (supabase
            .from('security_alerts')
            .select('*') as any)
            .order('created_at', { ascending: false });
          return data || [];
      }
      return [];
  }
};
