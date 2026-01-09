import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Document, updateDocumentMetadata } from "@/lib/documents";
import { toast } from "@/components/ui/use-toast";

interface Props {
  document: Document;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  permissionRole?: "editor" | "viewer";
}

export function EditDocumentDialog({
  document,
  open,
  onClose,
  onSaved,
  permissionRole = "editor",
}: Props) {
  const [name, setName] = useState(document.name);
  const [description, setDescription] = useState(document.description ?? "");
  const [logicalType, setLogicalType] = useState(document.logical_type ?? "");
  const [category, setCategory] = useState(document.category ?? "");
  const [status, setStatus] = useState(document.status ?? "pendiente");
  const [tags, setTags] = useState(
    document.tags ? document.tags.join(", ") : ""
  );

  const [accessLevel, setAccessLevel] =
    useState<"private" | "read_only" | "edit">(
      document.access_level ?? "private"
    );

  const isReadOnly = permissionRole === "viewer";

  useEffect(() => {
    setName(document.name);
    setDescription(document.description ?? "");
    setLogicalType(document.logical_type ?? "");
    setCategory(document.category ?? "");
    setStatus(document.status ?? "pendiente");
    setTags(document.tags ? document.tags.join(", ") : "");
    setAccessLevel(document.access_level ?? "private");
  }, [document]);

  const save = async () => {
    if (isReadOnly) {
      toast({
        variant: "destructive",
        title: "Solo lectura",
        description: "No tienes permisos para editar este documento",
      });
      return;
    }

    await updateDocumentMetadata(document.id, {
      name,
      description,
      logical_type: logicalType || null,
      category: category || null,
      status,
      access_level: accessLevel,
      tags: tags
        ? tags.split(",").map((t) => t.trim())
        : null,
    });

    onSaved?.();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar metadatos del documento</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <input
            className="w-full border rounded px-3 py-2"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            disabled={isReadOnly}
          />

          <textarea
            className="w-full border rounded px-3 py-2"
            placeholder="Descripción"
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            disabled={isReadOnly}
          />

          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Tipo lógico"
            value={logicalType}
            onChange={(e) => setLogicalType(e.currentTarget.value)}
            disabled={isReadOnly}
          />

          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Categoría"
            value={category}
            onChange={(e) => setCategory(e.currentTarget.value)}
            disabled={isReadOnly}
          />

          <select
            className="w-full border rounded px-3 py-2"
            value={status}
            onChange={(e) => setStatus(e.currentTarget.value)}
            disabled={isReadOnly}
          >
            <option value="pendiente">Pendiente</option>
            <option value="aprobado">Aprobado</option>
            <option value="archivado">Archivado</option>
          </select>

          <select
            className="w-full border rounded px-3 py-2"
            value={accessLevel}
            onChange={(e) =>
              setAccessLevel(
                e.currentTarget.value as "private" | "read_only" | "edit"
              )
            }
            disabled={isReadOnly}
          >
            <option value="private">Privado</option>
            <option value="read_only">Solo lectura</option>
            <option value="edit">Editable</option>
          </select>

          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Tags separados por coma"
            value={tags}
            onChange={(e) => setTags(e.currentTarget.value)}
            disabled={isReadOnly}
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={isReadOnly}>
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
