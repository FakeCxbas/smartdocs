import { motion } from "framer-motion";
import {
  FileText,
  FileImage,
  FileSpreadsheet,
  FileType,
  Download,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFileSize, Document } from "@/lib/documents";
import { useEffect, useRef, useState } from "react";
import { DocumentPreview } from "./DocumentPreview";
import { DocumentHoverPreview } from "./DocumentHoverPreview";
import { supabase } from "@/integrations/supabase/client";

function getIcon(type: Document["document_type"]) {
  switch (type) {
    case "pdf":
      return <FileType className="w-8 h-8 text-red-500" />;
    case "image":
      return <FileImage className="w-8 h-8 text-purple-500" />;
    case "excel":
      return <FileSpreadsheet className="w-8 h-8 text-green-500" />;
    case "word":
      return <FileText className="w-8 h-8 text-blue-500" />;
    default:
      return <FileText className="w-8 h-8 text-muted-foreground" />;
  }
}

export function DocumentCard({
  document,
  onDownload,
  onDelete,
}: {
  document: Document;
  onDownload: (document: Document) => void;
  onDelete: (document: Document) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showHover, setShowHover] = useState(false);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

  const loadPreview = async () => {
    if (previewUrl) return;
    const { data } = await supabase.storage
      .from("documents")
      .createSignedUrl(document.file_path, 120);
    if (data?.signedUrl) setPreviewUrl(data.signedUrl);
  };

  const onHoverStart = () => {
    hoverTimeout.current = setTimeout(() => {
      loadPreview();
      setShowHover(true);
    }, 300);
  };

  const onHoverEnd = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setShowHover(false);
  };

  return (
    <>
      <motion.div
        layout
        whileHover={{ scale: 1.02 }}
        onHoverStart={onHoverStart}
        onHoverEnd={onHoverEnd}
        onClick={loadPreview}
        className="relative p-4 bg-card border border-border rounded-xl flex items-center justify-between gap-4 cursor-pointer hover:shadow-md transition-shadow"
      >
        <div className="flex items-center gap-3">
          {getIcon(document.document_type)}
          <div>
            <p className="font-medium truncate max-w-[180px]">
              {document.name}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatFileSize(document.file_size)}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {document.document_type}
            </p>
          </div>
        </div>

        <div
          className="flex gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Button variant="ghost" size="icon" onClick={() => onDownload(document)}>
            <Download className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(document)}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>

        <DocumentHoverPreview
          document={document}
          previewUrl={previewUrl}
          visible={showHover}
        />
      </motion.div>

      <DocumentPreview
        document={previewUrl ? document : null}
        previewUrl={previewUrl}
        onClose={() => setPreviewUrl(null)}
      />
    </>
  );
}
