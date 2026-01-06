import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Document } from "@/lib/documents";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

interface Props {
  document: Document | null;
  previewUrl: string | null;
  onClose: () => void;
}

export function DocumentPreview({ document, previewUrl, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!document || !previewUrl) return null;

  const isImage = document.document_type === "image";
  const isPdf = document.document_type === "pdf";

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          key="modal"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-card w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl border overflow-hidden"
        >
          {/* HEADER */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <p className="font-medium truncate">{document.name}</p>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* CONTENT */}
          <div className="h-full bg-muted/20 flex items-center justify-center">
            {isImage && (
              <img
                src={previewUrl}
                alt={document.name}
                className="max-h-full max-w-full object-contain"
              />
            )}

            {isPdf && (
              <iframe
                src={previewUrl!}
                title={document.name}
                className="w-full h-full"
              />
            )}

            {!isImage && !isPdf && (
              <div className="text-muted-foreground text-sm">
                Vista previa no disponible para este tipo de archivo
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
