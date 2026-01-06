import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileX, Search } from "lucide-react";
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

type SortOption = "recent" | "oldest" | "name" | "size";

export function DocumentList({
  documents,
  onDownload,
  onDelete,
  isLoading,
}: DocumentListProps) {
  const [filter, setFilter] = useState<DocumentType | "all">("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("recent");

  const processedDocuments = useMemo(() => {
    let result = [...documents];

    // 🔍 BUSCAR
    if (search.trim()) {
      result = result.filter((doc) =>
        doc.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // 🧩 FILTRAR POR TIPO
    if (filter !== "all") {
      result = result.filter((doc) => doc.document_type === filter);
    }

    // 🔀 ORDENAR
    switch (sort) {
      case "oldest":
        result.sort(
          (a, b) =>
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()
        );
        break;

      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;

      case "size":
        result.sort((a, b) => b.file_size - a.file_size);
        break;

      default: // recent
        result.sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );
}


    return result;
  }, [documents, filter, search, sort]);

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
     EMPTY GLOBAL
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
          Sube tu primer documento para empezar
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ================================
          BÚSQUEDA + ORDEN
      ================================ */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        {/* 🔍 BUSCADOR */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar documentos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* 🔀 ORDENAR */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="recent">Más recientes</option>
          <option value="oldest">Más antiguos</option>
          <option value="name">Nombre A–Z</option>
          <option value="size">Tamaño</option>
        </select>
      </div>

      {/* ================================
          FILTROS POR TIPO
      ================================ */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-full border transition-all",
              filter === f.value
                ? "bg-primary/10 border-primary text-primary"
                : "bg-transparent border-border text-muted-foreground hover:bg-muted/60"
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
          {processedDocuments.map((doc) => (
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
          EMPTY RESULT
      ================================ */}
      {processedDocuments.length === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-muted-foreground text-center py-8"
        >
          No se encontraron documentos
        </motion.p>
      )}
    </div>
  );
}
