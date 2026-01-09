import { useState } from "react";
import { extractTextFromFile } from "@/lib/ocr";
import { Button } from "@/components/ui/button";

interface Props {
  onTextExtracted: (text: string) => void;
}

export function OCRUploader({ onTextExtracted }: Props) {
  const [loading, setLoading] = useState(false);

  const handleFile = async (file: File) => {
    setLoading(true);
    const text = await extractTextFromFile(file);
    onTextExtracted(text);
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      {loading && (
        <p className="text-sm text-muted-foreground">
          Digitalizando documento...
        </p>
      )}
    </div>
  );
}
