import { supabase } from "../integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

/* ================================
   TIPOS
================================ */
export type DocumentType =
  | "pdf"
  | "word"
  | "excel"
  | "image"
  | "other";

export interface Document {
  id: string;
  user_id: string;
  name: string;
  file_path: string;
  file_size: number;
  document_type: DocumentType;
  created_at: string;
}

/* ================================
   DETECTAR TIPO DE DOCUMENTO
================================ */
export function detectDocumentType(file: File): DocumentType {
  const mime = file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();

  // MIME (prioridad)
  if (mime === "application/pdf") return "pdf";
  if (
    mime === "application/msword" ||
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) return "word";
  if (
    mime === "application/vnd.ms-excel" ||
    mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) return "excel";
  if (mime.startsWith("image/")) return "image";

  // Fallback por extensión
  if (ext === "pdf") return "pdf";
  if (["doc", "docx"].includes(ext ?? "")) return "word";
  if (["xls", "xlsx"].includes(ext ?? "")) return "excel";
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext ?? "")) return "image";

  return "other";
}

/* ================================
   OBTENER DOCUMENTOS
================================ */
export async function getDocuments(userId: string): Promise<Document[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al obtener documentos:", error);
    throw error;
  }

  return (data ?? []) as Document[];
}

/* ================================
   SUBIR DOCUMENTO
================================ */
export async function uploadDocument(file: File, userId: string) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const fileId = uuidv4();
  const filePath = `${userId}/${fileId}.${extension}`;

  const documentType = detectDocumentType(file);

  // 1️⃣ Storage
  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(filePath, file);

  if (uploadError) {
    console.error("Error al subir archivo:", uploadError);
    throw uploadError;
  }

  // 2️⃣ Base de datos
  const { error: dbError } = await supabase
    .from("documents")
    .insert({
      user_id: userId,
      name: file.name,
      file_path: filePath,
      file_size: file.size,
      document_type: documentType, // ✅ CLAVE
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

  if (error || !data) throw error;

  const response = await fetch(data.signedUrl);
  const blob = await response.blob();

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = doc.name;
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
