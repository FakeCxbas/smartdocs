import {
  DOCUMENT_CATEGORIES,
  DocumentCategory,
} from "./constants/documentCategories";
import { useCallback, useState } from 'react';
import { Upload, X, FileIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  onUpload: (files: File[]) => Promise<void>;
  isUploading: boolean;
}

export function FileUploader({ onUpload, isUploading }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [category, setCategory] = useState<DocumentCategory>("administrativos");


  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(prev => [...prev, ...files]);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  }, []);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    await onUpload(
      selectedFiles.map((file) => {
        (file as any).category = category;
        return file;
      })
  );

    setSelectedFiles([]);
  };

  return (
    <div className="space-y-4">
      
      {/*SELECTOR DE CATEGORIA*/}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Categoría del documento
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as DocumentCategory)
          }
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {DOCUMENT_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat
                .replace("_", " ")
                .replace(/\b\w/g, l => l.toUpperCase())}
            </option>
          ))}
        </select>
      </div>



      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer",
          isDragging 
            ? "border-primary bg-primary/5 scale-[1.02]" 
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
        )}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <motion.div
            animate={{ y: isDragging ? -5 : 0 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="p-4 rounded-full bg-primary/10">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-lg font-medium text-foreground">
                {isDragging ? 'Suelta tus archivos aquí' : 'Arrastra archivos o haz clic'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Soporta cualquier tipo de archivo
              </p>
            </div>
          </motion.div>
        </label>
      </motion.div>

      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <motion.div
                  key={`${file.name}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileIcon className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium truncate max-w-[200px]">
                      {file.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 hover:bg-destructive/10 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </motion.div>
              ))}
            </div>

            <Button 
              onClick={handleUpload} 
              disabled={isUploading}
              className="w-full"
              size="lg"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Subir {selectedFiles.length} archivo{selectedFiles.length > 1 ? 's' : ''}
                </>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
