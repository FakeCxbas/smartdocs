import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, LogOut, FolderOpen, HardDrive, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FileUploader } from "@/components/FileUploader";
import { DocumentList } from "@/components/DocumentList";

import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

import {
  Document,
  getDocuments,
  uploadDocument,
  downloadDocument,
  deleteDocument,
  formatFileSize,
} from "@/lib/documents";

export default function Dashboard() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  /* =========================
     PROTECCIÓN DE RUTA
  ========================= */
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, loading, navigate]);

  /* =========================
     CARGAR DOCUMENTOS
  ========================= */
  const loadDocuments = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const docs = await getDocuments(user.id);
      setDocuments(docs);
    } catch (error) {
      toast({
        title: "Error al cargar documentos",
        description:
          error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) loadDocuments();
  }, [user, loadDocuments]);

  /* =========================
     SUBIR ARCHIVOS
  ========================= */
  const handleUpload = async (files: File[]) => {
    if (!user) return;

    setIsUploading(true);
    let success = 0;

    for (const file of files) {
      try {
        await uploadDocument(file, user.id);
        success++;
      } catch (error) {
        toast({
          title: `Error al subir ${file.name}`,
          description:
            error instanceof Error ? error.message : "Error desconocido",
          variant: "destructive",
        });
      }
    }

    if (success > 0) {
      toast({
        title: "¡Archivos subidos!",
        description: `${success} archivo${success > 1 ? "s" : ""} subido${
          success > 1 ? "s" : ""
        } correctamente`,
      });
      await loadDocuments();
    }

    setIsUploading(false);
  };

  /* =========================
     DESCARGAR
  ========================= */
  const handleDownload = async (doc: Document) => {
    try {
      await downloadDocument(doc);
      toast({
        title: "Descarga iniciada",
        description: `Descargando ${doc.name}`,
      });
    } catch (error) {
      toast({
        title: "Error al descargar",
        description:
          error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    }
  };

  /* =========================
     ELIMINAR
  ========================= */
  const handleDelete = async (doc: Document) => {
    try {
      await deleteDocument(doc);
      setDocuments(prev => prev.filter(d => d.id !== doc.id));
      toast({
        title: "Documento eliminado",
        description: doc.name,
      });
    } catch (error) {
      toast({
        title: "Error al eliminar",
        description:
          error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    }
  };

  /* =========================
     DESCARGAR TODO
  ========================= */
  const handleDownloadAll = async () => {
    toast({
      title: "Descargando documentos",
      description: `Iniciando descarga de ${documents.length} archivos`,
    });

    for (const doc of documents) {
      try {
        await downloadDocument(doc);
        await new Promise(r => setTimeout(r, 300));
      } catch {
        toast({
          title: `Error con ${doc.name}`,
          description: "No se pudo descargar",
          variant: "destructive",
        });
      }
    }
  };

  /* =========================
     CERRAR SESIÓN (FIX REAL)
  ========================= */
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/auth", { replace: true });
    } catch {
      toast({
        title: "Error al cerrar sesión",
        variant: "destructive",
      });
    }
  };

  const totalSize = documents.reduce((acc, d) => acc + d.file_size, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full" />
      </div>
    );
  }

  /* =========================
     UI
  ========================= */
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xl font-bold">SmartDocs</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.email}
            </span>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Estadísticas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4 sm:grid-cols-2 mb-8"
        >
          <div className="p-6 bg-card border rounded-xl">
            <div className="flex items-center gap-4">
              <FolderOpen className="w-6 h-6 text-primary" />
              <div>
                <p className="text-2xl font-bold">{documents.length}</p>
                <p className="text-sm text-muted-foreground">Documentos</p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-card border rounded-xl">
            <div className="flex items-center gap-4">
              <HardDrive className="w-6 h-6 text-primary" />
              <div>
                <p className="text-2xl font-bold">
                  {formatFileSize(totalSize)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Almacenamiento usado
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Subida */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Subir archivos</h2>
          <FileUploader onUpload={handleUpload} isUploading={isUploading} />
        </div>

        {/* Lista */}
        <div>
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-semibold">Mis documentos</h2>
            {documents.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleDownloadAll}>
                <Download className="w-4 h-4 mr-2" />
                Descargar todo
              </Button>
            )}
          </div>

          <DocumentList
            documents={documents}
            onDownload={handleDownload}
            onDelete={handleDelete}
            isLoading={isLoading}
          />
        </div>
      </main>
    </div>
  );
}
