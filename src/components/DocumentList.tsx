import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileX } from "lucide-react";
import { DocumentCard } from "./DocumentCard";
import { Document, DocumentType } from "@/lib/documents";
import { cn } from "@/lib/utils";

interface DocumentListProps {
  documents: Document[];
  onDownload: (doc: Document) => Promise<void>;
  onDelete: (doc: Document) => Promise<void>;
  isLoading: boolean;
}

const FILTERS: { label: string; value: DocumentType | "all" }[] = [
  { label: "Todos", value: "all" },
  { label: "PDF", value: "pdf" },
  { label: "Word", value: "word" },
  { label: "Excel", value: "excel" },
  { label: "Imágenes", value: "image" },
  { label: "Otros", value: "other" },
];

export function DocumentList({
  documents,
  onDownload,
  onDelete,
  isLoading,
}: DocumentListProps) {
  const [filter, setFilter] = useState<DocumentType | "all">("all");

  const filteredDocuments =
    filter === "all"
      ? documents
      : documents.filter((doc) => doc.document_type === filter);

  /* ================================
     LOADING
  ================================ */
  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-[88px] bg-muted/50 rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  /* ================================
     EMPTY STATE
  ================================ */
  if (documents.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="p-4 rounded-full bg-muted/50 mb-4">
          <FileX className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">
          No hay documentos
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Sube tu primer documento arrastrándolo aquí o haciendo clic en el área
          de subida
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ================================
          FILTROS
      ================================ */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-full border transition-all",
              "hover:bg-muted/60",
              filter === f.value
                ? "bg-primary/10 border-primary text-primary"
                : "bg-transparent border-border text-muted-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ================================
          LISTA
      ================================ */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filteredDocuments.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onDownload={onDownload}
              onDelete={onDelete}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* ================================
          EMPTY FILTER
      ================================ */}
      {filteredDocuments.length === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-muted-foreground text-center py-8"
        >
          No hay documentos de este tipo
        </motion.p>
      )}
    </div>
  );
}
