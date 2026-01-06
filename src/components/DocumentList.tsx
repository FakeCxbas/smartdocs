import { AnimatePresence, motion } from 'framer-motion';
import { FileX } from 'lucide-react';
import { DocumentCard } from './DocumentCard';
import { Document } from '@/lib/documents';

interface DocumentListProps {
  documents: Document[];
  onDownload: (doc: Document) => Promise<void>;
  onDelete: (doc: Document) => Promise<void>;
  isLoading: boolean;
}

export function DocumentList({ documents, onDownload, onDelete, isLoading }: DocumentListProps) {
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
          Sube tu primer documento arrastrándolo aquí o haciendo clic en el área de subida
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <AnimatePresence mode="popLayout">
        {documents.map((doc) => (
          <DocumentCard
            key={doc.id}
            document={doc}
            onDownload={onDownload}
            onDelete={onDelete}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
