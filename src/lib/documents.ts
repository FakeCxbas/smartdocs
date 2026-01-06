import { supabase } from "../integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

export interface Document {
  id: string;
  user_id: string;
  name: string;
  file_path: string;
  file_size: number;
  document_type: string;
  created_at: string;
}


export async function getDocuments(userId: string): Promise<Document[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al obtener documentos:', error);
    throw error;
  }

  return data ?? [];
}



/* ================================
   SUBIR DOCUMENTO (CORRECTO)
================================ */
export async function uploadDocument(file: File, userId: string) {
  // extensión segura
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "bin";

  // nombre seguro (sin espacios ni símbolos)
  const fileId = uuidv4();
  const filePath = `${userId}/${fileId}.${extension}`;

  // 1. Subir a Storage
  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(filePath, file, {
      upsert: false,
    });

  if (uploadError) {
    console.error("Error al subir archivo:", uploadError);
    throw uploadError;
  }

  // 2. Guardar metadata en la tabla
  const { error: dbError } = await supabase
    .from("documents")
    .insert({
      user_id: userId,
      name: file.name,       // nombre ORIGINAL solo para mostrar
      file_path: filePath,   // nombre seguro
      file_size: file.size,
    });

  if (dbError) {
    console.error("Error al guardar documento:", dbError);
    throw dbError;
  }
}

/* ================================
   ELIMINAR DOCUMENTO
================================ */
export async function deleteDocument(doc: Document) {
  await supabase.storage.from("documents").remove([doc.file_path]);
  await supabase.from("documents").delete().eq("id", doc.id);
}

/* ================================
   DESCARGAR DOCUMENTO
================================ */
export async function downloadDocument(doc: Document) {
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(doc.file_path, 60);

  if (error || !data) {
    throw error;
  }

  // ⬇️ FORZAR DESCARGA REAL
  const response = await fetch(data.signedUrl);
  const blob = await response.blob();

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = doc.name; // 👈 nombre real del archivo
  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/* ================================
   UTILIDAD: tamaño legible
================================ */
export function formatFileSize(bytes: number): string {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}