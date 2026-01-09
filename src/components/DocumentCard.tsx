import { Share2 } from "lucide-react";
import { ShareDocumentDialog } from "./ShareDocumentDialog";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  FileImage,
  FileSpreadsheet,
  FileType,
  Download,
  Trash2,
  Pencil,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { DocumentWithRole } from "@/lib/documents"; // 🔧 FIX
import { formatFileSize } from "@/lib/documents";
import { supabase } from "@/integrations/supabase/client";
import { DocumentPreview } from "./DocumentPreview";
import { EditDocumentDialog } from "./EditDocumentDialog";

/* ================================
   ICONO POR TIPO
================================ */
function getIcon(type: DocumentWithRole["document_type"]) {
  switch (type) {
    case "pdf":
      return <FileType className="w-8 h-8 text-red-500" />;
    case "image":
      return <FileImage className="w-8 h-8 text-purple-500" />;
    case "excel":
      return <FileSpreadsheet className="w-8 h-8 text-green-500" />;
    case "word":
    case "text":
      return <FileText className="w-8 h-8 text-blue-500" />;
    default:
      return <FileText className="w-8 h-8 text-muted-foreground" />;
  }
}

function formatDate(date?: string) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString();
}

interface Props {
  document: DocumentWithRole; // 🔧 FIX
  onDownload: (document: DocumentWithRole) => void; // 🔧 FIX
  onDelete: (document: DocumentWithRole) => void; // 🔧 FIX
  onUpdated?: () => void;
}

export function DocumentCard({
  document,
  onDownload,
  onDelete,
  onUpdated,
}: Props) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [shareOpen, setShareOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  /* ================================
     USUARIO ACTUAL
  ================================ */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);

  const isOwner = currentUserId === document.user_id;
  const isShared = currentUserId !== null && document.user_id !== currentUserId;
  const canEdit = document.permission_role !== "viewer";
  const canDownload = document.permission_role !== "viewer";
  const lastEdit = document.updated_at ?? document.created_at;

  /* ================================
     PREVIEW
  ================================ */
  const openPreview = async () => {
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(document.file_path, 60);

    if (error || !data?.signedUrl) {
      console.error("Error creando previewUrl", error);
      return;
    }

    setPreviewUrl(data.signedUrl);
    setPreviewOpen(true);
  };

  const closePreview = () => {
    setPreviewOpen(false);
    setPreviewUrl("");
  };

  /* ================================
     RENDER
  ================================ */
  return (
    <>
      <motion.div
        layout
        layoutId={document.id}
        whileHover={{ scale: 1.01 }}
        onClick={openPreview}
        className="relative p-4 bg-card border border-border rounded-xl flex items-start justify-between gap-4 cursor-pointer hover:shadow-md transition-shadow"
      >
        {/* INFO */}
        <div className="flex gap-3">
          {getIcon(document.document_type)}

          <div className="space-y-0.5 max-w-[200px]">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{document.name}</p>

              {isShared && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                  Compartido
                </span>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              {formatFileSize(document.file_size)}
            </p>

            <p className="text-xs text-muted-foreground capitalize">
              Tipo: {document.document_type}
            </p>

            <p className="text-xs text-muted-foreground">
              Autor: {isOwner ? "Tú" : document.user_id}
            </p>

            <p className="text-xs text-muted-foreground">
              Creado: {formatDate(document.created_at)}
            </p>

            <p className="text-xs text-muted-foreground">
              Última edición: {formatDate(lastEdit)}
            </p>
          </div>
        </div>

        {/* ACCIONES */}
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          {isOwner && canEdit && (
            <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)}>
              <Pencil className="w-4 h-4" />
            </Button>
          )}

          {canDownload && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDownload(document)}
            >
              <Download className="w-4 h-4" />
            </Button>
          )}

          {isOwner && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShareOpen(true)}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          )}

          {isOwner && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(document)}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          )}
        </div>
      </motion.div>

      {/* PREVIEW */}
      {previewOpen && previewUrl && (
        <DocumentPreview
          document={document}
          previewUrl={previewUrl}
          onClose={closePreview}
        />
      )}

      {/* SHARE */}
      {shareOpen && (
        <ShareDocumentDialog
          documentId={document.id}
          open={shareOpen}
          onClose={() => setShareOpen(false)}
        />
      )}

      {/* EDITAR */}
      {editOpen && (
        <EditDocumentDialog
          document={document}
          permissionRole={document.permission_role} // 🔧 FIX
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false);
            onUpdated?.();
          }}
        />
      )}
    </>
  );
}
