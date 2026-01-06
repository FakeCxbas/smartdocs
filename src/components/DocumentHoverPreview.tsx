import { motion, AnimatePresence } from "framer-motion";
import { Document } from "@/lib/documents";

interface Props {
  document: Document;
  previewUrl: string | null;
  visible: boolean;
}

export function DocumentHoverPreview({ document, previewUrl, visible }: Props) {
  if (!previewUrl) return null;

  const isImage = document.document_type === "image";
  const isPdf = document.document_type === "pdf";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.15 }}
          className="absolute z-40 top-full mt-2 w-72 h-44 bg-card border rounded-xl shadow-xl overflow-hidden"
        >
          {isImage && (
            <img
              src={previewUrl}
              className="w-full h-full object-cover"
              alt={document.name}
            />
          )}

          {isPdf && (
            <iframe
              src={previewUrl}
              className="w-full h-full"
              title={document.name}
            />
          )}

          {!isImage && !isPdf && (
            <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
              Vista previa no disponible
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
