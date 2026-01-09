import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface Props {
  documentId: string;
  open: boolean;
  onClose: () => void;
}

export function ShareDocumentDialog({ documentId, open, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("viewer");
  const [loading, setLoading] = useState(false);

  const share = async () => {
    if (!email) return;

    setLoading(true);

    // 1️⃣ buscar usuario por email (CORRECTO CON RPC)
    const { data: userId, error: userError } = await supabase.rpc(
      "get_user_id_by_email",
      {
        email_input: email.trim().toLowerCase(),
      }
    );

    if (userError || !userId) {
      toast({
        variant: "destructive",
        title: "Usuario no encontrado",
        description: "Ese email no está registrado en SmartDocs",
      });
      setLoading(false);
      return;
    }

    // 2️⃣ insertar permiso
    const { error: permError } = await supabase
      .from("document_permissions")
      .insert({
        document_id: documentId,
        user_id: userId,
        role,
      });

    if (permError) {
      toast({
        variant: "destructive",
        title: "Error al compartir",
        description: permError.message,
      });
    } else {
      toast({
        title: "Documento compartido",
        description: `Se compartió con ${email}`,
      });
      onClose();
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Compartir documento</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            placeholder="Email del usuario"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Select value={role} onValueChange={(v) => setRole(v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="viewer">Solo lectura</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={share} disabled={loading}>
            Compartir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
