-- ==========================================
-- CODEX System v1.7 - Database Schema File
-- ==========================================

-- Tabla de Mensajes de Chat Administrativo
CREATE TABLE IF NOT EXISTS admin_chat_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_email text NOT NULL,
  sender_name text NOT NULL,
  chat_room text NOT NULL,
  message_text text NOT NULL,
  seen_by text[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Si la tabla ya existe y necesitas agregar la columna 'seen_by':
ALTER TABLE admin_chat_messages ADD COLUMN IF NOT EXISTS seen_by text[] DEFAULT '{}';

-- Políticas de Seguridad de Fila (RLS) en Supabase para el Chat Administrativo:
-- Habilitar RLS en la tabla
ALTER TABLE admin_chat_messages ENABLE ROW LEVEL SECURITY;

-- 1. Política para permitir que cualquier usuario autenticado (administradores autorizados) lea los mensajes
CREATE POLICY "Permitir lectura a usuarios autenticados" ON admin_chat_messages
  FOR SELECT TO authenticated USING (true);

-- 2. Política para permitir la inserción de nuevos mensajes de administradores
CREATE POLICY "Permitir inserción de mensajes a autenticados" ON admin_chat_messages
  FOR INSERT TO authenticated WITH CHECK (true);

-- 3. Política para permitir actualizaciones (como marcar vistos en seen_by)
CREATE POLICY "Permitir actualizaciones de mensajes a autenticados" ON admin_chat_messages
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 4. Política para permitir el borrado de mensajes (DELETE)
CREATE POLICY "Permitir borrado de mensajes a autenticados" ON admin_chat_messages
  FOR DELETE TO authenticated USING (true);
