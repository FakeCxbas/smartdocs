import { supabase } from "@/integrations/supabase/client";
import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { FileX, Search } from "lucide-react";
import { DocumentCard } from "./DocumentCard";
import { Document, DocumentType, DocumentWithRole } from "@/lib/documents";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DocumentListProps {
  documents: DocumentWithRole[];
  onDownload: (doc: Document) => Promise<void>;
  onDelete: (doc: Document) => Promise<void>;
  isLoading: boolean;
  onUpdated?: () => void;
}

const FILTERS: { label: string; value: DocumentType | "all" }[] = [
  { label: "Todos", value: "all" },
  { label: "PDF", value: "pdf" },
  { label: "Word", value: "word" },
  { label: "Excel", value: "excel" },
  { label: "Imágenes", value: "image" },
  { label: "Texto", value: "text" },
  { label: "Otros", value: "other" },
];

type SortOption = "edited" | "recent" | "oldest" | "name" | "size";

export function DocumentList({
  documents,
  onDownload,
  onDelete,
  isLoading,
  onUpdated,
}: DocumentListProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<DocumentType | "all">("all");
  const [sort, setSort] = useState<SortOption>("edited");

  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] =
    useState<DocumentWithRole[] | null>(null);

  const processedDocuments = useMemo(() => {
    let result = [...documents];

    if (filter !== "all") {
      result = result.filter((d) => d.document_type === filter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((d) =>
        d.name.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const da = new Date(a.updated_at ?? a.created_at).getTime();
      const db = new Date(b.updated_at ?? b.created_at).getTime();

      if (sort === "recent") return db - da;
      if (sort === "oldest") return da - db;
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "size") return b.file_size - a.file_size;

      return db - da; // edited
    });

    return result;
  }, [documents, filter, search, sort]);

  const handleDeepSearch = async () => {
    if (!search.trim()) return;

    setSearching(true);
    const q = search.toLowerCase();
    const results: DocumentWithRole[] = [];

    for (const doc of processedDocuments) {
      if (doc.document_type !== "text") continue;

      try {
        const { data } = await supabase.storage
          .from("documents")
          .createSignedUrl(doc.file_path, 60);

        if (!data?.signedUrl) continue;

        const res = await fetch(data.signedUrl);
        const text = await res.text();

        if (text.toLowerCase().includes(q)) {
          results.push(doc);
        }
      } catch {}
    }

    setSearchResults(results);
    setSearching(false);
  };

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

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <FileX className="w-10 h-10 text-muted-foreground mb-4" />
        <p>No hay documentos</p>
      </div>
    );
  }

  const listToRender = searchResults ?? processedDocuments;

  return (
    <div className="space-y-4">
      {/* BUSCADOR + ORDEN */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value);
              setSearchResults(null);
            }}
            placeholder="Buscar documentos..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm"
          />
        </div>

        <select
          value={sort}
          onChange={(e) =>
            setSort(e.currentTarget.value as SortOption)
          }
          className="px-3 py-2 rounded-lg border text-sm"
        >
          <option value="edited">Última edición</option>
          <option value="recent">Más recientes</option>
          <option value="oldest">Más antiguos</option>
          <option value="name">Nombre A–Z</option>
          <option value="size">Tamaño</option>
        </select>
      </div>

      {/* FILTROS */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-full border",
              filter === f.value
                ? "bg-primary/10 border-primary text-primary"
                : "border-border text-muted-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* BUSCAR DENTRO */}
      <div className="flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          placeholder="Buscar dentro de documentos TXT..."
          className="flex-1 px-3 py-2 border rounded-md"
        />
        <Button onClick={handleDeepSearch} disabled={searching}>
          {searching ? "Buscando..." : "Buscar"}
        </Button>
      </div>

      {/* LISTA */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {listToRender.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onDownload={onDownload}
              onDelete={onDelete}
              onUpdated={onUpdated}
            />
          ))}
        </AnimatePresence>
      </div>

      {listToRender.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No se encontraron documentos
        </p>
      )}
    </div>
  );
}
