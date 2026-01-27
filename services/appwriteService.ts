
import { Area, Procedure, User, Status, ADMIN_EMAILS, MASTER_VIEWER_EMAILS, ADMIN_HARDWARE_IDS, Department, OnlineUser, ConsultationMessage, ConsultationReply, Folder, DownloadRequest, AccessLog, ImprovementProposal, SecurityIncident } from '../types';
import { MOCK_USERS, MOCK_PROCEDURES } from './mockData';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

// --- CONFIGURACIÓN DE SUPABASE (DUAL CLIENT ARCHITECTURE) ---

const CONFIG_LEGACY = {
  SUPABASE_URL: 'https://etjhwybavjcygkllbaye.supabase.co',
  SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0amh3eWJhdmpjeWdrbGxiYXllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNjUwOTUsImV4cCI6MjA3OTc0MTA5NX0.zV3n3CErV3hL6gGDZofETZufFpnfz7d0OgNVyjmvOm4'
};

const CONFIG_MASTER = {
  SUPABASE_URL: 'https://hourctostlvdsshmgorf.supabase.co',
  SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvdXJjdG9zdGx2ZHNzaG1nb3JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MTQ3MTUsImV4cCI6MjA3NDk5MDcxNX0.8ORfYwoEWxgBmdkCgCKLwDAffpo4Fzzp2Cdk9qDO2_U'
};

const isLegacyReady = () => CONFIG_LEGACY.SUPABASE_URL !== '' && CONFIG_LEGACY.SUPABASE_KEY !== '';
const isMasterReady = () => CONFIG_MASTER.SUPABASE_URL !== '' && CONFIG_MASTER.SUPABASE_KEY !== '';

let supabase: SupabaseClient | null = null;       
let supabaseMaster: SupabaseClient | null = null; 

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
const STORAGE_KEY_DEVICE_ID = 'codex_device_unique_token';
const STORAGE_KEY_MASTER_SEAL = 'codex_terminal_master_seal'; 

export const normalizeString = (str: string) => {
    return str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim() : "";
};

export const appwriteService = {
  
  getDeviceId(): string {
    let deviceId = localStorage.getItem(STORAGE_KEY_DEVICE_ID);
    if (!deviceId) {
        // Generación de Huella Digital (Fingerprint) más estable
        const screenSpecs = `${window.screen.width}x${window.screen.height}`;
        const cpuCores = navigator.hardwareConcurrency || 4;
        const platform = navigator.platform || 'unknown';
        const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
        
        // Formato estable: HW-SPEC-CORES-RANDOM
        deviceId = `HW-${screenSpecs}-${cpuCores}-${randomPart}`;
        localStorage.setItem(STORAGE_KEY_DEVICE_ID, deviceId);
    }
    return deviceId;
  },

  async isThisAdminHardware(): Promise<boolean> {
    const hasMasterSeal = localStorage.getItem(STORAGE_KEY_MASTER_SEAL) === 'SECURE_MASTER_AUTHORIZED';
    if (hasMasterSeal) return true;
    const currentDeviceId = this.getDeviceId();
    if (ADMIN_HARDWARE_IDS.includes(currentDeviceId)) return true;
    if (!isLegacyReady() || !supabase) return false;
    try {
        const { data: owners } = await supabase
            .from('user_authorized_ips')
            .select('user_id')
            .eq('ip_address', currentDeviceId);
        if (!owners || owners.length === 0) return false;
        const ownerIds = owners.map(o => o.user_id);
        const { data: adminCheck } = await supabase
            .from('users')
            .select('email')
            .in('id', ownerIds);
        return adminCheck?.some(u => ADMIN_EMAILS.includes(u.email.toLowerCase())) || false;
    } catch (e) { return false; }
  },

  async login(email: string, password?: string): Promise<User> {
    if (!password) {
        const user = MOCK_USERS[0];
        const extendedUser = { ...user, allowedAreas: [user.area] }; 
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(extendedUser));
        return extendedUser;
    }

    if (isLegacyReady() && supabase) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw new Error(authError.message);
        if (!authData.user) throw new Error("No se pudo obtener el usuario.");

        const currentDeviceId = this.getDeviceId(); 
        const normalizedEmail = email.toLowerCase();
        const isAdminByEmail = ADMIN_EMAILS.includes(normalizedEmail);
        const isMasterViewer = MASTER_VIEWER_EMAILS.includes(normalizedEmail);
        const isAdminHardware = await this.isThisAdminHardware();

        if (isAdminByEmail) {
            localStorage.setItem(STORAGE_KEY_MASTER_SEAL, 'SECURE_MASTER_AUTHORIZED');
        }

        let { data: profileData } = await supabase.from('users').select('*').eq('id', authData.user.id).maybeSingle();
        if (!profileData) {
            await supabase.auth.signOut();
            throw new Error("ACCESO DENEGADO: Su cuenta no está autorizada en CODEX.");
        }

        const isAdminByRole = profileData.role === 'admin';
        const isFullAdmin = isAdminByEmail || isAdminByRole;
        const hasGlobalVisibility = isFullAdmin || isMasterViewer;

        // --- SISTEMA DE REGISTRO DE HARDWARE (AHORA INCLUYE ADMINS PARA TRAZABILIDAD) ---
        const { data: authorizedDevicesData } = await supabase.from('user_authorized_ips').select('ip_address').eq('user_id', authData.user.id);
        let authorizedIds = (authorizedDevicesData || []).map((i: any) => i.ip_address);

        if (!authorizedIds.includes(currentDeviceId)) {
            const maxAllowed = profileData.max_devices || (isFullAdmin ? 10 : 3);
            if (authorizedIds.length >= maxAllowed) {
                await supabase.auth.signOut();
                throw new Error(`DISPOSITIVO NO AUTORIZADO: Límite de ${maxAllowed} equipos alcanzado.`);
            } else {
                await supabase.from('user_authorized_ips').insert({
                    user_id: authData.user.id,
                    ip_address: currentDeviceId,
                    device_name: isFullAdmin ? `Terminal Admin ${authorizedIds.length + 1}` : `Terminal ${authorizedIds.length + 1}`
                });
                authorizedIds.push(currentDeviceId);
            }
        }

        // Actualizar metadatos de conexión
        let currentIp = '';
        try {
            const ipRes = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipRes.json();
            currentIp = ipData.ip;
        } catch (e) {}
        
        await supabase.from('users').update({ 
            last_ip: currentIp || profileData?.last_ip, 
            last_device_id: currentDeviceId 
        }).eq('id', authData.user.id);

        let allowedAreas: string[] = [];
        const { data: accessData } = await supabase.from('user_area_access').select('area_name').eq('user_id', authData.user.id);
        if (accessData && accessData.length > 0) {
            allowedAreas = Array.from(new Set(accessData.map((a: any) => (a.area_name || '').toUpperCase())));
        }
        const primaryArea = ((profileData?.area as string) || Area.IT).toUpperCase();
        if (allowedAreas.length === 0) allowedAreas = [primaryArea];

        if (hasGlobalVisibility) {
            const { data: allDepts } = await supabase.from('departments').select('name').order('name');
            if (allDepts) allowedAreas = Array.from(new Set(allDepts.map((d: any) => (d.name || '').toUpperCase())));
        }

        const { data: signatureData } = await supabase.from('privacy_signatures').select('*').eq('user_id', authData.user.id).maybeSingle();

        return {
            $id: profileData?.id || authData.user.id,
            name: profileData?.name || email.split('@')[0],
            email: email,
            area: primaryArea,
            allowedAreas: allowedAreas,
            role: isFullAdmin ? 'admin' : (profileData?.role || 'viewer'),
            privacyAccepted: !!signatureData,
            signedName: signatureData?.signed_name,
            signedDepartment: signatureData?.signed_department,
            lastIp: currentIp || profileData?.last_ip,
            lastDeviceId: currentDeviceId, 
            authorizedDevices: authorizedIds,
            avatarUrl: profileData?.avatar_url,
            maxDevices: profileData?.max_devices || (isFullAdmin ? 10 : 3),
            isAdminHardware: isAdminHardware || isFullAdmin
        };
      } catch (error: any) { throw error; }
    }
    throw new Error("Error de conexión.");
  },

  async getCurrentUser(): Promise<User | null> {
    if (isLegacyReady() && supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();
        if (!profile) return null;
        
        const currentLocalDeviceId = this.getDeviceId();
        const normalizedEmail = (user.email || '').toLowerCase();
        const isAdminHardware = await this.isThisAdminHardware();
        const isAdminByEmail = ADMIN_EMAILS.includes(normalizedEmail);
        const isMasterViewer = MASTER_VIEWER_EMAILS.includes(normalizedEmail);
        const isAdminByRole = profile.role === 'admin';
        
        const isFullAdmin = isAdminByEmail || isAdminByRole;
        const hasGlobalVisibility = isFullAdmin || isMasterViewer;

        const { data: authorizedDevicesData } = await supabase.from('user_authorized_ips').select('ip_address').eq('user_id', user.id);
        const authorizedIds = (authorizedDevicesData || []).map((i: any) => i.ip_address);

        let allowedAreas: string[] = [];
        const { data: accessData } = await supabase.from('user_area_access').select('area_name').eq('user_id', user.id);
        if (accessData) allowedAreas = accessData.map((a: any) => (a.area_name || '').toUpperCase());
        const primaryArea = ((profile?.area as string) || Area.IT).toUpperCase();
        if (allowedAreas.length === 0) allowedAreas = [primaryArea];

        if (hasGlobalVisibility) {
            const { data: allDepts } = await supabase.from('departments').select('name').order('name');
            if (allDepts) allowedAreas = Array.from(new Set(allDepts.map((d: any) => (d.name || '').toUpperCase())));
        }

        const { data: signatureData } = await supabase.from('privacy_signatures').select('*').eq('user_id', user.id).maybeSingle();

        return {
            $id: user.id,
            name: profile?.name || user.email?.split('@')[0] || 'Usuario',
            email: user.email || '',
            area: primaryArea,
            allowedAreas: allowedAreas,
            role: isFullAdmin ? 'admin' : (profile?.role || 'viewer'),
            privacyAccepted: !!signatureData,
            signedName: signatureData?.signed_name,
            signedDepartment: signatureData?.signed_department,
            lastIp: profile?.last_ip,
            lastDeviceId: currentLocalDeviceId, 
            authorizedDevices: authorizedIds,
            avatarUrl: profile?.avatar_url,
            maxDevices: profile?.max_devices || (isFullAdmin ? 10 : 3),
            isAdminHardware: isAdminHardware || isFullAdmin
        };
      } catch (e) { return null; }
    }
    return null;
  },

  async logout(): Promise<void> {
    if (isLegacyReady() && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_MASTER_SEAL);
  },

  subscribeToPresence(user: User, onSync: (users: OnlineUser[]) => void, onForceLogout?: (targetId: string) => void): RealtimeChannel | null {
    if (!isLegacyReady() || !supabase) return null;
    try {
        const deviceId = this.getDeviceId();
        // CLAVE ÚNICA POR DISPOSITIVO: Esto evita que una sesión pise a otra en el monitor
        const presenceKey = `${user.$id}:${deviceId}`;

        const channel = supabase.channel('codex_global_presence', {
            config: { presence: { key: presenceKey } },
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
                                onlineAt: p.onlineAt,
                                ip: p.ip || 'No detectada'
                            });
                         }
                    });
                }
                onSync(users);
            });

        if (onForceLogout) {
            channel.on('broadcast', { event: 'force_logout' }, (payload: any) => {
                // Si el broadcast es para este usuario específico o global
                if (payload.payload?.userId === user.$id) {
                    onForceLogout(payload.payload.userId);
                }
            });
        }

        channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.track({
                    userId: user.$id,
                    name: user.name,
                    email: user.email,
                    area: user.area,
                    role: user.role,
                    onlineAt: new Date().toISOString(),
                    ip: deviceId // Usamos el ID de Hardware en lugar de la IP real en este campo para el monitor
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

  async uploadUserAvatar(userId: string, file: File): Promise<string | null> {
    if (isLegacyReady() && supabase) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        const publicUrl = data.publicUrl;

        await supabase
          .from('users')
          .update({ avatar_url: publicUrl })
          .eq('id', userId);

        return publicUrl;
      } catch (e) {
        return null;
      }
    }
    return null;
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
            return !error;
          } catch(e) { return false; }
      }
      return false;
  },

  async deleteArea(name: string): Promise<boolean> {
      if (isLegacyReady() && supabase) {
          try {
            const { error } = await supabase.from('departments').delete().eq('name', name);
            return !error;
          } catch(e) { return false; }
      }
      return false;
  },

  async renameArea(oldName: string, newName: string): Promise<boolean> {
      if (isLegacyReady() && supabase) {
          try {
            const { error } = await supabase.rpc('api_rename_area', { old_name: oldName, new_name: newName.trim().toUpperCase() });
            return !error;
          } catch(e) { return false; }
      }
      return false;
  },

  async getFolders(area?: string): Promise<Folder[]> {
    const folders: Folder[] = [];
    const queries = [];
    if (isMasterReady() && supabaseMaster) {
        queries.push(supabaseMaster.from('folders').select('*'));
        queries.push(supabaseMaster.from('published_folders').select('*'));
    }
    if (isLegacyReady() && supabase) {
        queries.push(supabase.from('folders').select('*'));
    }

    try {
        const results = await Promise.all(queries);
        const rawFolders: any[] = [];
        results.forEach(res => { if (res.data) rawFolders.push(...res.data); });
        const seenIds = new Set();
        rawFolders.forEach(f => {
            const id = f.origin_folder_id || f.id;
            if (id && !seenIds.has(id)) {
                const folderArea = (f.area || '').toUpperCase();
                if (!area || folderArea === area.toUpperCase()) {
                    seenIds.add(id);
                    folders.push({
                        id,
                        name: (f.folder_name || f.name || 'Sin Nombre').toUpperCase(),
                        parent_id: null,
                        created_at: f.created_at || new Date().toISOString(),
                        area: folderArea
                    });
                }
            }
        });
        return folders.sort((a, b) => a.name.localeCompare(b.name));
    } catch (e) { return []; }
  },

  async getProcedures(user: User, queryText: string = '', areaFilter?: string): Promise<Procedure[]> {
    if (isLegacyReady() && supabase) {
      try {
        let masterQuery = supabaseMaster ? supabaseMaster.from('procedures').select('*') : null;
        if (masterQuery && areaFilter) masterQuery = masterQuery.ilike('area', areaFilter);
        const masterPromise = masterQuery || Promise.resolve({ data: [], error: null });
        let legacyQuery = supabase.from('procedures').select('*');
        if (areaFilter) legacyQuery = legacyQuery.ilike('area', areaFilter);
        const legacyPromise = legacyQuery;
        const [masterRes, legacyRes] = await Promise.all([masterPromise, legacyPromise]);
        let rawData = [...(masterRes.data || []), ...(legacyRes.data || [])];
        if (queryText) {
            const q = queryText.toLowerCase();
            rawData = rawData.filter((d: any) => (d.title || d.name || '').toLowerCase().includes(q) || (d.code || '').toLowerCase().includes(q));
        }
        const mapped = rawData.map((doc: any) => ({
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
             return mapped.filter((d: any) => user.allowedAreas.some(allowed => normalizeString(allowed) === normalizeString(d.area)));
        }
        return mapped;
      } catch (e) { return []; }
    }
    return [];
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
    return undefined;
  },

  async updateProcedureResponsible(id: string, newResponsible: string): Promise<boolean> {
    if (isLegacyReady() && supabase) {
        try {
            const { error: legacyError } = await supabase.from('procedures').update({ responsible: newResponsible }).eq('id', id);
            if (!legacyError) return true;
        } catch (e) { }
    }
    return false;
  },

  async getStats(allowedAreas: string[], isAdmin: boolean = false) {
    if (isLegacyReady() && supabase) {
       try {
           const masterPromise = supabaseMaster ? supabaseMaster.from('procedures').select('*') : Promise.resolve({ data: [] });
           const legacyPromise = supabase.from('procedures').select('*');
           const [m, l] = await Promise.all([masterPromise, legacyPromise]);
           const all = [...(m.data || []), ...(l.data || [])];
           
           const normalizedAllowed = allowedAreas.map(a => normalizeString(a));
           const filtered = all.filter((p: any) => normalizedAllowed.includes(normalizeString(p.area || p.departamento)));
           
           const active = filtered.filter((p: any) => {
               const st = normalizeString(p.status || '');
               return st === 'VIGENTE' || st === 'ACTIVE';
           }).length;
           
           const review = filtered.filter((p: any) => {
               const st = normalizeString(p.status || '');
               return st === 'EN REVISION' || st === 'REVIEW';
           }).length;

           const obsolete = filtered.filter((p: any) => {
               const st = normalizeString(p.status || '');
               return st === 'OBSOLETO' || st === 'CADUCO' || st === 'HISTORICO';
           }).length;

           filtered.sort((a: any, b: any) => {
               const dateA = new Date(a.updated_at || a.updatedAt || 0).getTime();
               const dateB = new Date(b.updated_at || b.updatedAt || 0).getTime();
               return dateB - dateA;
           });

           return { 
               totalActive: active, 
               totalReview: review, 
               totalObsolete: obsolete,
               lastUpdated: filtered[0]?.updated_at || filtered[0]?.updatedAt || null 
           };
       } catch (e) { }
    }
    return { totalActive: 0, totalReview: 0, totalObsolete: 0, lastUpdated: null };
  },

  async logSecurityIncident(incident: Partial<SecurityIncident>): Promise<void> {
    if (isLegacyReady() && supabase) {
        try {
            await supabase.from('security_incidents').insert({
                user_id: incident.user_id,
                user_name: incident.user_name,
                user_email: incident.user_email,
                user_area: incident.user_area,
                procedure_id: incident.procedure_id,
                procedure_name: incident.procedure_name,
                device_id: incident.device_id,
                incident_type: incident.incident_type || 'FOCUS_LOST_ATTEMPT',
                details: incident.details || 'Incidencia de seguridad no descrita.',
                severity: incident.severity || 'CRITICAL'
            });
        } catch (e) { console.error("Error logging security incident:", e); }
    }
  },

  async adminGetSecurityIncidents(): Promise<SecurityIncident[]> {
      if (isLegacyReady() && supabase) {
          try {
              const { data, error } = await supabase
                .from('security_incidents')
                .select('*')
                .order('created_at', { ascending: false });
              if (error) throw error;
              return (data || []) as SecurityIncident[];
          } catch (e) { return []; }
      }
      return [];
  },

  async adminDeleteAllIncidents(): Promise<boolean> {
      if (isLegacyReady() && supabase) {
          try {
            const { error } = await supabase.from('security_incidents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            return !error;
          } catch(e) { return false; }
      }
      return false;
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

  async sendConsultationMessage(userId: string, message: string, area: string, procedureId?: string, procedureName?: string, title?: string, processSection?: string, referenceImage?: string, priority: string = 'normal'): Promise<boolean> {
      if (isLegacyReady() && supabase) {
          const { error } = await supabase.from('consultation_messages').insert({
              user_id: userId, 
              title: title, 
              message: message, 
              procedure_id: procedureId, 
              procedure_name: procedureName, 
              area: area.toUpperCase(), 
              status: 'pending',
              priority: priority,
              process_section: processSection,
              reference_image: referenceImage
          });
          return !error;
      }
      return false;
  },

  async replyToMessage(messageId: string, userId: string, message: string, replyImage?: string): Promise<boolean> {
    if (isLegacyReady() && supabase) {
        const { error } = await supabase.from('consultation_replies').insert({ 
            message_id: messageId, 
            user_id: userId, 
            message: message,
            reply_image: replyImage 
        });
        return !error;
    }
    return false;
  },

  async getResolvedConsultationsByProcedure(procedureId: string): Promise<ConsultationMessage[]> {
      if (isLegacyReady() && supabase) {
          const { data, error } = await supabase
            .from('consultation_messages')
            .select(`*, users (name, email, area, role, avatar_url), consultation_replies (id, message, created_at, user_id, reply_image, users (name, email, role, avatar_url))`)
            .eq('procedure_id', procedureId)
            .in('status', ['reviewed', 'closed'])
            .order('created_at', { ascending: false });
          
          if (error) return [];
          
          return data.map((msg: any) => ({
              id: msg.id, user_id: msg.user_id, title: msg.title, procedure_id: msg.procedure_id, procedure_name: msg.procedure_name, process_section: msg.process_section, reference_image: msg.reference_image, message: msg.message, status: msg.status, priority: msg.priority, created_at: msg.created_at, area: (msg.area || '').toUpperCase(),
              user_name: msg.users?.name || msg.users?.email || 'Usuario', user_email: msg.users?.email || '', user_area: (msg.users?.area || '').toUpperCase(), user_role: msg.users?.role || 'viewer', user_avatar: msg.users?.avatar_url, 
              replies: (msg.consultation_replies || []).map((r: any) => ({
                  id: r.id, message_id: msg.id, user_id: r.user_id, message: r.message, reply_image: r.reply_image, created_at: r.created_at, user_name: r.users?.name || r.users?.email || 'Usuario', user_role: r.users?.role, user_avatar: r.users?.avatar_url
              })).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          }));
      }
      return [];
  },

  async getCollaborativeMessages(allowedAreas: string[]): Promise<ConsultationMessage[]> {
      if (isLegacyReady() && supabase) {
          const normalizedAllowed = allowedAreas.map(a => normalizeString(a));
          const { data, error } = await supabase.from('consultation_messages').select(`*, users (name, email, area, role, avatar_url), consultation_replies (id, message, created_at, user_id, reply_image, users (name, email, role, avatar_url))`).order('created_at', { ascending: false });
          if (error) return [];
          
          const filtered = data.filter((msg: any) => {
              const isAdmin = ADMIN_EMAILS.includes((msg.users?.email || '').toLowerCase());
              if (isAdmin) return true;
              return normalizedAllowed.includes(normalizeString(msg.area || ''));
          });

          return filtered.map((msg: any) => ({
              id: msg.id, user_id: msg.user_id, title: msg.title, procedure_id: msg.procedure_id, procedure_name: msg.procedure_name, process_section: msg.process_section, reference_image: msg.reference_image, message: msg.message, status: msg.status, priority: msg.priority, created_at: msg.created_at, area: (msg.area || '').toUpperCase(),
              user_name: msg.users?.name || msg.users?.email || 'Usuario', user_email: msg.users?.email || '', user_area: (msg.users?.area || '').toUpperCase(), user_role: msg.users?.role || 'viewer', user_avatar: msg.users?.avatar_url, 
              replies: (msg.consultation_replies || []).map((r: any) => ({
                  id: r.id, message_id: msg.id, user_id: r.user_id, message: r.message, reply_image: r.reply_image, created_at: r.created_at, user_name: r.users?.name || r.users?.email || 'Usuario', user_role: r.users?.role, user_avatar: r.users?.avatar_url
              })).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          }));
      }
      return [];
  },

  async adminGetConsultationMessages(): Promise<ConsultationMessage[]> {
      if (isLegacyReady() && supabase) {
          const { data, error } = await supabase.from('consultation_messages').select(`*, users (name, email, area, role, avatar_url), consultation_replies (id, message, created_at, user_id, reply_image, users (name, email, role, avatar_url))`).order('created_at', { ascending: false });
          if (error) return [];
          return data.map((msg: any) => ({
              id: msg.id, user_id: msg.user_id, title: msg.title, procedure_id: msg.procedure_id, procedure_name: msg.procedure_name, process_section: msg.process_section, reference_image: msg.reference_image, message: msg.message, status: msg.status, priority: msg.priority, created_at: msg.created_at, area: (msg.area || '').toUpperCase(),
              user_name: msg.users?.name || msg.users?.email || 'Usuario', user_email: msg.users?.email || '', user_area: (msg.users?.area || '').toUpperCase(), user_role: msg.users?.role || 'viewer', user_avatar: msg.users?.avatar_url, 
              replies: (msg.consultation_replies || []).map((r: any) => ({
                  id: r.id, message_id: msg.id, user_id: r.user_id, message: r.message, reply_image: r.reply_image, created_at: r.created_at, user_name: r.users?.name || r.users?.email || 'Usuario', user_role: r.users?.role, user_avatar: r.users?.avatar_url
              })).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          }));
      }
      return [];
  },

  async adminUpdateMessageStatus(id: string, status: 'reviewed' | 'archived' | 'closed'): Promise<boolean> {
      if (isLegacyReady() && supabase) {
          const { error = null } = await supabase.from('consultation_messages').update({ status }).eq('id', id);
          return !error;
      }
      return false;
  },

  async adminDeleteMessage(id: string): Promise<boolean> {
      if (isLegacyReady() && supabase) {
          const { error = null } = await supabase.from('consultation_messages').delete().eq('id', id);
          return !error;
      }
      return false;
  },

  async requestDownload(userId: string, procedureId: string, procedureName: string): Promise<boolean> {
    if (isLegacyReady() && supabase) {
      const { error } = await supabase.from('download_requests').insert({ user_id: userId, procedure_id: procedureId, procedure_name: procedureName, status: 'pending' });
      return !error;
    }
    return false;
  },

  async getDownloadStatus(userId: string, procedureId: string): Promise<DownloadRequest | null> {
    if (isLegacyReady() && supabase) {
      const { data } = await supabase.from('download_requests').select('*').eq('user_id', userId).eq('procedure_id', procedureId).in('status', ['pending', 'approved', 'rejected']).order('requested_at', { ascending: false }).limit(1).maybeSingle();
      return data;
    }
    return null;
  },

  async consumeDownloadToken(requestId: string): Promise<boolean> {
    if (isLegacyReady() && supabase) {
      const { error } = await supabase.from('download_requests').update({ status: 'consumed' }).eq('id', requestId);
      return !error;
    }
    return false;
  },

  async adminGetDownloadRequests(): Promise<DownloadRequest[]> {
    if (isLegacyReady() && supabase) {
       const { data, error } = await supabase.from('download_requests').select(`*, users (name, email, area)`).in('status', ['pending', 'approved', 'consumed']).order('requested_at', { ascending: false });
       if (error) return [];
       return data.map((r: any) => ({
         id: r.id, user_id: r.user_id, procedure_id: r.procedure_id, procedure_name: r.procedure_name, status: r.status, requested_at: r.requested_at, user_name: r.users?.name || 'Usuario', user_email: r.users?.email || 'N/A', user_area: (r.users?.area || 'N/A').toUpperCase()
       }));
    }
    return [];
  },

  async adminRespondToDownloadRequest(id: string, status: 'approved' | 'rejected'): Promise<boolean> {
    if (isLegacyReady() && supabase) {
      const { error = null } = await supabase.from('download_requests').update({ status, responded_at: new Date().toISOString() }).eq('id', id);
      return !error;
    }
    return false;
  },

  async adminDeleteDownloadRequest(id: string): Promise<boolean> {
    if (isLegacyReady() && supabase) {
        const { error = null } = await supabase.from('download_requests').delete().eq('id', id);
        return !error;
    }
    return false;
  },

  async adminGetAllUsers(): Promise<User[]> {
    if (isLegacyReady() && supabase) {
      try {
          const [usersRes, signaturesRes, devicesRes, accessRes] = await Promise.all([
              supabase.from('users').select('*').order('created_at', { ascending: false }),
              supabase.from('privacy_signatures').select('*'),
              supabase.from('user_authorized_ips').select('user_id, ip_address'),
              supabase.from('user_area_access').select('user_id, area_name')
          ]);
          const sm = new Map();
          signaturesRes.data?.forEach((sig: any) => sm.set(sig.user_id, sig));
          const dm = new Map();
          devicesRes.data?.forEach((dev: any) => {
              if(!dm.has(dev.user_id)) dm.set(dev.user_id, []);
              dm.get(dev.user_id).push(dev.ip_address);
          });
          const am = new Map<string, string[]>();
          accessRes.data?.forEach((acc: any) => {
              if(!am.has(acc.user_id)) am.set(acc.user_id, []);
              am.get(acc.user_id)!.push((acc.area_name || '').toUpperCase());
          });
          return (usersRes.data || []).map((u: any) => {
              const primaryArea = (u.area || '').toUpperCase();
              let allowedAreas = am.get(u.id) || [primaryArea];
              if (allowedAreas.length === 0 && primaryArea) allowedAreas = [primaryArea];
              return {
                  $id: u.id, name: u.name, email: u.email, area: primaryArea, allowedAreas: Array.from(new Set(allowedAreas)), role: u.role, privacyAccepted: sm.has(u.id), signedName: sm.get(u.id)?.signed_name, signedDepartment: sm.get(u.id)?.signed_department, lastIp: u.last_ip || 'N/A', lastDeviceId: u.last_device_id || 'N/A', authorizedDevices: dm.get(u.id) || [], avatarUrl: u.avatar_url, maxDevices: u.max_devices || 3
              };
          });
      } catch (e) { return []; }
    }
    return [];
  },

  async adminDeleteAuthorizedDevice(userId: string, deviceId: string): Promise<boolean> {
      if (isLegacyReady() && supabase) {
          const { error } = await supabase.from('user_authorized_ips').delete().eq('user_id', userId).eq('ip_address', deviceId);
          return !error;
      }
      return false;
  },

  async adminUpdateUserAreas(userId: string, areas: string[]): Promise<boolean> {
    if (isLegacyReady() && supabase) {
        try {
            const { error: delError } = await supabase.from('user_area_access').delete().eq('user_id', userId);
            if (delError) throw delError;
            
            if (areas.length > 0) {
                const inserts = areas.map(area => ({ user_id: userId, area_name: area.toUpperCase() }));
                const { error: insError } = await supabase.from('user_area_access').insert(inserts);
                if (insError) throw insError;
            }
            return true;
        } catch (e) {
            console.error("Error updating user areas", e);
            return false;
        }
    }
    return false;
  },

  async logProcedureAccess(userId: string, procedureId: string, procedureName: string, area: string): Promise<string | null> {
    if (isLegacyReady() && supabase) {
      try {
        const { data, error } = await supabase.from('procedure_access_logs').insert({ user_id: userId, procedure_id: procedureId, procedure_name: procedureName, area: area, accessed_at: new Date().toISOString(), duration_seconds: 0 }).select('id').single();
        return data ? data.id : null;
      } catch (e) { return null; }
    }
    return null;
  },

  async updateAccessDuration(logId: string, durationSeconds: number): Promise<void> {
    if (isLegacyReady() && supabase && logId) {
        supabase.from('procedure_access_logs').update({ duration_seconds: durationSeconds }).eq('id', logId).then();
    }
  },

  async adminDeleteAllAccessLogs(): Promise<boolean> {
      if (isLegacyReady() && supabase) {
          const { error } = await supabase.from('procedure_access_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000'); 
          return !error;
      }
      return false;
  },

  async getAdminAnalytics(): Promise<AccessLog[]> {
    if (isLegacyReady() && supabase) {
      try {
        const { data: logs } = await supabase.from('procedure_access_logs').select('*').order('accessed_at', { ascending: false }).limit(2000); 
        if (!logs) return [];
        const uids = [...new Set(logs.map((l: any) => l.user_id))];
        let um: Record<string, any> = {};
        if (uids.length > 0) {
            const { data } = await supabase.from('users').select('id, name, email').in('id', uids);
            data?.forEach((u: any) => um[u.id] = u);
        }
        return logs.map((log: any) => ({
          id: log.id, user_id: log.user_id, procedure_id: log.procedure_id, procedure_name: log.procedure_name, area: log.area, accessed_at: log.accessed_at, duration_seconds: log.duration_seconds || 0, user_name: um[log.user_id]?.name || 'N/A', user_email: um[log.user_email] || 'N/A'
        }));
      } catch (e) { return []; }
    }
    return [];
  },

  async createImprovementProposal(proposal: any): Promise<boolean> {
    if (isLegacyReady() && supabase) {
        const { error } = await supabase.from('improvement_proposals').insert({ ...proposal, status: 'pending' });
        return !error;
    }
    return false;
  },

  async getUserProposals(userId: string): Promise<ImprovementProposal[]> {
    if (isLegacyReady() && supabase) {
        const { data } = await supabase.from('improvement_proposals').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        return (data as ImprovementProposal[]) || [];
    }
    return [];
  },

  async adminGetProposals(): Promise<ImprovementProposal[]> {
      if (isLegacyReady() && supabase) {
          const { data: p } = await supabase.from('improvement_proposals').select('*').order('created_at', { ascending: false });
          if (!p) return [];
          const uids = [...new Set(p.map((p: any) => p.user_id))];
          let um: Record<string, any> = {};
          if (uids.length > 0) {
            const { data } = await supabase.from('users').select('id, name, email, avatar_url').in('id', uids);
            data?.forEach((u: any) => um[u.id] = u);
          }
          return p.map((p: any) => ({
              ...p, user_name: um[p.user_id]?.name || 'N/A', user_email: um[p.user_id]?.email || 'N/A', user_avatar: um[p.user_id]?.avatar_url
          }));
      }
      return [];
  },

  async adminUpdateProposalStatus(id: string, status: string, feedback: string): Promise<boolean> {
      if (isLegacyReady() && supabase) {
          const { error = null } = await supabase.from('improvement_proposals').update({ status, admin_feedback: feedback }).eq('id', id);
          return !error;
      }
      return false;
  },

  async adminDeleteProposal(id: string): Promise<boolean> {
    if (isLegacyReady() && supabase) {
        const { error = null } = await supabase.from('improvement_proposals').delete().eq('id', id);
        return !error;
    }
    return false;
  }
};
