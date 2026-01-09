// src/components/ConfirmCloseDialog.tsx

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmCloseDialog({
  open,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Cambios sin guardar
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Tienes cambios sin guardar.  
          Si sales ahora, se perderán.
        </p>

        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
          >
            Salir sin guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
