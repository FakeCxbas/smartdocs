// src/lib/documents.ts

import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

/* ================================
   TIPOS
================================ */

export type DocumentType =
  | "pdf"
  | "word"
  | "excel"
  | "image"
  | "text"
  | "other";

export interface Document {
  id: string;
  user_id: string;
  name: string;
  file_path: string;
  file_size: number;
  document_type: DocumentType;
  access_level?: "private" | "read_only" | "edit";

  created_at: string;
  updated_at: string | null;
  updated_by: string | null;

  // 🔹 METADATOS (TESIS)
  description: string | null;
  category: string | null;
  logical_type: string | null;
  status: string | null;
  tags: string[] | null;
  content?: string;

}

export type PermissionRole = "editor" | "viewer";

export type DocumentWithRole = Document & {
  permission_role?: PermissionRole;
  shared_at?: string;
};

/* ================================
   UTILIDADES
================================ */

export function formatFileSize(bytes: number): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/* ================================
   DETECTAR TIPO
================================ */

export function detectDocumentType(file: File): DocumentType {
  const mime = file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("text/")) return "text";

  if (["doc", "docx"].includes(ext ?? "")) return "word";
  if (["xls", "xlsx"].includes(ext ?? "")) return "excel";
  if (ext === "pdf") return "pdf";
  if (["txt", "md"].includes(ext ?? "")) return "text";

  return "other";
}

/* ================================
   OBTENER DOCUMENTOS
================================ */

export async function getDocuments(userId: string): Promise<DocumentWithRole[]> {


  /* =====================================================
     1️⃣ DOCUMENTOS PROPIOS
  ===================================================== */
  const { data: ownDocs, error: ownError } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", userId);

  if (ownError) {
    console.error("Error obteniendo documentos propios:", ownError);
    throw ownError;
  }

  const ownDocsWithRole: DocumentWithRole[] = (ownDocs ?? []).map(doc => ({
    ...doc,
    permission_role: "editor",
    // 🔹 para propios, usamos su última edición
    shared_at: doc.updated_at ?? doc.created_at,
  }));

  /* =====================================================
     2️⃣ PERMISOS DE DOCUMENTOS COMPARTIDOS
  ===================================================== */
  const { data: sharedPerms, error: permsError } = await supabase
    .from("document_permissions")
    .select("document_id, role, created_at")
    .eq("user_id", userId);

  if (permsError) {
    console.error("Error obteniendo permisos:", permsError);
    throw permsError;
  }

  // 🔹 Tipado explícito (PASO 2)
  const typedSharedPerms =
    (sharedPerms ?? []) as {
      document_id: string;
      role: PermissionRole;
      created_at: string;
    }[];

  const sharedIds = typedSharedPerms.map(p => p.document_id);

  /* =====================================================
     3️⃣ TRAER DOCUMENTOS COMPARTIDOS
  ===================================================== */
  let sharedDocs: Document[] = [];

  if (sharedIds.length > 0) {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .in("id", sharedIds);

    if (error) {
      console.error("Error obteniendo documentos compartidos:", error);
      throw error;
    }

    sharedDocs = data ?? [];



    // 🧠 Cargar contenido SOLO para TXT (búsqueda interna)
    for (const doc of sharedDocs) {
      if (doc.document_type === "text") {
        const { data } = await supabase.storage
          .from("documents")
          .download(doc.file_path);

        if (data) {
          doc.content = await data.text();
    }
  }
}


    
  }

  


  const sharedDocsWithRole: DocumentWithRole[] = sharedDocs.map(doc => {
    const perm = typedSharedPerms.find(p => p.document_id === doc.id);

    return {
      ...doc,
      permission_role:
        perm?.role === "editor" || perm?.role === "viewer"
          ? perm.role
          : "viewer",

      // 🔹 fecha REAL de acceso al documento
      shared_at: perm?.created_at ?? doc.created_at,
    };
  });

  /* =====================================================
     4️⃣ UNIR Y ORDENAR (CORRECTO)
  ===================================================== */
  const allDocs: DocumentWithRole[] = [
    ...ownDocsWithRole,
    ...sharedDocsWithRole,
  ].sort(
    (a, b) =>
      new Date(
        b.shared_at ?? b.updated_at ?? b.created_at
      ).getTime() -
      new Date(
        a.shared_at ?? a.updated_at ?? a.created_at
      ).getTime()
  );

  return allDocs;
}


/* ================================
   SUBIR DOCUMENTO
================================ */

export async function uploadDocument(file: File, userId: string) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const fileId = uuidv4();
  const filePath = `${userId}/${fileId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Error subiendo archivo:", uploadError);
    throw uploadError;
  }

  const { error: dbError } = await supabase.from("documents").insert({
    user_id: userId,
    name: file.name,
    file_path: filePath,
    file_size: file.size,
    document_type: detectDocumentType(file),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    updated_by: userId,
    description: null,
    category: null,
    logical_type: null,
    status: "pendiente",
    tags: null,
  });

  if (dbError) {
    console.error("Error guardando metadata:", dbError);
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

  const res = await fetch(data.signedUrl);
  const blob = await res.blob();

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = doc.name;
  a.click();
  URL.revokeObjectURL(url);
}

/* ================================
   ACTUALIZAR METADATOS
================================ */

type AccessLevelUpdate = "private" | "read_only" | "edit" | "editable";

export async function updateDocumentMetadata(
  id: string,
  updates: Partial<
    Pick<
      Document,
      "name" | "description" | "category" | "logical_type" | "status" | "tags"
    > & {
      access_level?: AccessLevelUpdate;
    }
  >
) {
  const { error } = await supabase
    .from("documents")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Error actualizando metadatos:", error);
    throw error;
  }
}

/* ================================
   OCR → CREAR NUEVO TXT
================================ */

export async function createTextDocumentFromOCR(
  original: Document,
  text: string
) {
  const name = original.name.replace(/\.[^/.]+$/, "") + "_ocr.txt";
  const path = `${original.user_id}/${crypto.randomUUID()}.txt`;

  const blob = new Blob([text], { type: "text/plain" });

  await supabase.storage.from("documents").upload(path, blob);

  await supabase.from("documents").insert({
    user_id: original.user_id,
    name,
    file_path: path,
    file_size: text.length,
    document_type: "text",
    updated_at: new Date().toISOString(),
    updated_by: original.user_id,
  });
}
