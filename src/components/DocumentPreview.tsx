// src/components/DocumentPreview.tsx

import { DocumentOCRDialog } from "./DocumentOCRDialog";
import { AnimatePresence, motion } from "framer-motion";
import { X, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DocumentWithRole } from "@/lib/documents"; // ✅ correcto
import { DocumentTextEditor } from "./DocumentTextEditor";
import { ConfirmCloseDialog } from "./ConfirmCloseDialog";
import { DocumentVersionsPanel } from "./DocumentVersionsPanel";
import { useState } from "react";

interface Props {
  document: DocumentWithRole; // 🔧 FIX
  previewUrl: string;
  onClose: () => void;
}

export function DocumentPreview({
  document,
  previewUrl,
  onClose,
}: Props) {
  const isText = document.document_type === "text";
  const isImage = document.document_type === "image";
  const isPdf = document.document_type === "pdf";

  const [showOCR, setShowOCR] = useState(false);

  const [status, setStatus] = useState<
    "saved" | "unsaved" | "saving"
  >("saved");

  const [confirmClose, setConfirmClose] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [restoredContent, setRestoredContent] =
    useState<string | null>(null);

  const statusMap = {
    saved: { text: "Guardado", color: "text-green-500" },
    unsaved: { text: "Cambios sin guardar", color: "text-yellow-500" },
    saving: { text: "Guardando…", color: "text-blue-500" },
  };

  const requestClose = () => {
    if (status === "unsaved") {
      setConfirmClose(true);
    } else {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        onClick={requestClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-background w-full max-w-5xl h-[85vh] rounded-xl flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
        >
          {/* HEADER */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-3 min-w-0">
              <h2 className="text-sm font-medium truncate">
                {document.name}
              </h2>

              {isText && (
                <span
                  className={`text-xs ${statusMap[status].color}`}
                >
                  ● {statusMap[status].text}
                </span>
              )}
            </div>

            <div className="flex gap-2">
              {isText && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowVersions(true)}
                >
                  <History className="w-4 h-4" />
                </Button>
              )}

              {(isImage || isPdf) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowOCR(true)}
                >
                  🧠 Digitalizar
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={requestClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* CONTENT */}
          <div className="flex-1 overflow-hidden">
            {isText && (
              <DocumentTextEditor
                document={document}
                onDirty={() => setStatus("unsaved")}
                onSaving={() => setStatus("saving")}
                onSaved={() => setStatus("saved")}
                restoredContent={restoredContent}
                onRestoreApplied={() =>
                  setRestoredContent(null)
                }
              />
            )}

            {isImage && (
              <img
                src={previewUrl}
                className="w-full h-full object-contain bg-black"
              />
            )}

            {isPdf && (
              <iframe
                src={previewUrl}
                className="w-full h-full"
              />
            )}
          </div>

          {/* HISTORIAL */}
          {showVersions && (
            <DocumentVersionsPanel
              documentId={document.id}
              onRestore={(content) => {
                setRestoredContent(content);
                setShowVersions(false);
                setStatus("unsaved");
              }}
            />
          )}

          {/* CONFIRMAR CIERRE */}
          <ConfirmCloseDialog
            open={confirmClose}
            onCancel={() => setConfirmClose(false)}
            onConfirm={onClose}
          />
        </motion.div>
      </motion.div>

      {showOCR && (
        <DocumentOCRDialog
          document={document}
          onClose={() => setShowOCR(false)}
        />
      )}
    </AnimatePresence>
  );
}
