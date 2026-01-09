// src/components/DocumentVersionsPanel.tsx

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

interface Version {
  id: string;
  content: string;
  created_at: string;
}

interface Props {
  documentId: string;
  onRestore: (content: string) => void;
}

export function DocumentVersionsPanel({
  documentId,
  onRestore,
}: Props) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("document_versions")
        .select("id, content, created_at")
        .eq("document_id", documentId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setVersions(data);
      }

      setLoading(false);
    };

    load();
  }, [documentId]);

  if (loading) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Cargando versiones…
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No hay versiones previas
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
      {versions.map((v, index) => (
        <div
          key={v.id}
          className="border rounded-lg p-3 flex items-center justify-between gap-3"
        >
          <div className="text-sm">
            <p className="font-medium">
              Versión {versions.length - index}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(v.created_at).toLocaleString()}
            </p>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onRestore(v.content)}
          >
            Restaurar
          </Button>
        </div>
      ))}
    </div>
  );
}
