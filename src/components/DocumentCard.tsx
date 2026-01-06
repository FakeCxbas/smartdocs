import { motion } from "framer-motion";
import { FileText, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/documents";

interface Document {
  id: string;
  name: string;
  file_size: number;
  document_type: string;
}

interface Props {
  document: Document;
  onDownload: (document: Document) => void;
  onDelete: (document: Document) => void;
}

export function DocumentCard({ document, onDownload, onDelete }: Props) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-4 bg-card border border-border rounded-xl flex items-center justify-between gap-4"
    >
      {/* INFO DEL DOCUMENTO */}
      <div className="flex items-center gap-3">
        <FileText className="w-8 h-8 text-primary" />

        <div>
          <p className="font-medium text-foreground">
            {document.name}
          </p>

          <p className="text-sm text-muted-foreground">
            {formatFileSize(document.file_size)}
          </p>

          <p className="text-xs text-muted-foreground capitalize">
            {(document.document_type ?? "otro").replace("_", " ")}
          </p>
        </div>
      </div>

      {/* ACCIONES */}
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDownload(document)}
        >
          <Download className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(document)}
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    </motion.div>
  );
}
