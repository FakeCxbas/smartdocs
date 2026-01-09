// src/components/DocumentTextEditor.tsx

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase"; // ⚠️ asegúrate que este path existe
import { Button } from "@/components/ui/button";
import type { DocumentWithRole } from "@/lib/documents"; // 🔧 FIX

interface Props {
  document: DocumentWithRole; // 🔧 FIX
  onDirty: () => void;
  onSaving: () => void;
  onSaved: () => void;
  restoredContent?: string | null;
  onRestoreApplied?: () => void;
}

const AUTOSAVE_DELAY = 3000;

export function DocumentTextEditor({
  document,
  onDirty,
  onSaving,
  onSaved,
  restoredContent,
  onRestoreApplied,
}: Props) {
  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* =========================
     APLICAR CONTENIDO RESTAURADO
  ========================= */
  useEffect(() => {
    if (restoredContent != null) {
      setContent(restoredContent);
      setOriginalContent(restoredContent);

      onDirty();
      onRestoreApplied?.();
    }
  }, [restoredContent]);

  const autosaveTimer = useRef<NodeJS.Timeout | null>(null);

  /* =========================
     CARGAR TXT
  ========================= */
  useEffect(() => {
    let active = true;

    const load = async () => {
      const { data } = await supabase.storage
        .from("documents")
        .createSignedUrl(document.file_path, 60);

      if (!data?.signedUrl) return;

      const res = await fetch(`${data.signedUrl}&v=${Date.now()}`);
      const text = await res.text();

      if (active) {
        setContent(text);
        setOriginalContent(text);
        setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [document.file_path]);

  /* =========================
     GUARDAR VERSIÓN
  ========================= */
  const saveVersion = async () => {
    if (!originalContent) return;

    await supabase.from("document_versions").insert({
      document_id: document.id,
      content: originalContent,
    });
  };

  /* =========================
     GUARDAR TXT
  ========================= */
  const save = async () => {
    if (saving || content === originalContent) return;

    setSaving(true);
    onSaving();

    // 1️⃣ Guardar versión ANTERIOR
    await saveVersion();

    // 2️⃣ Subir nuevo contenido
    const blob = new Blob([content], {
      type: "text/plain;charset=utf-8",
    });

    const { error } = await supabase.storage
      .from("documents")
      .upload(document.file_path, blob, {
        upsert: true,
        contentType: "text/plain",
      });

    if (!error) {
      setOriginalContent(content);
      onSaved();
    }

    setSaving(false);
  };

  /* =========================
     AUTOSAVE
  ========================= */
  useEffect(() => {
    if (content === originalContent) return;

    onDirty();

    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
    }

    autosaveTimer.current = setTimeout(save, AUTOSAVE_DELAY);

    return () => {
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
      }
    };
  }, [content]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        Cargando contenido…
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-3 p-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="flex-1 w-full resize-none rounded-md border p-3 text-sm font-mono"
        spellCheck={false}
      />

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving || content === originalContent}>
          Guardar ahora
        </Button>
      </div>
    </div>
  );
}
