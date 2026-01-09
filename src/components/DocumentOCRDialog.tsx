import { useState } from "react";
import { Button } from "@/components/ui/button";
import { extractTextFromFile } from "@/lib/ocr";
import { createTextDocumentFromOCR, Document } from "@/lib/documents";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  document: Document;
  onClose: () => void;
}

export function DocumentOCRDialog({ document, onClose }: Props) {
  const [loading, setLoading] = useState(false);

  const handleOCR = async () => {
    setLoading(true);

    const { data } = await supabase.storage
      .from("documents")
      .download(document.file_path);

    if (!data) {
      setLoading(false);
      return;
    }

    const file = new File([data], document.name);

    const text = await extractTextFromFile(file);

    await createTextDocumentFromOCR(document, text);

    setLoading(false);
    onClose();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-background rounded-xl w-full max-w-md p-6 space-y-4">
        <h3 className="text-lg font-semibold">
          Digitalizar documento
        </h3>

        <p className="text-sm text-muted-foreground">
          El archivo original no se modifica.
          Se crea un nuevo TXT editable.
        </p>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleOCR} disabled={loading}>
            {loading ? "Procesando…" : "Digitalizar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
