import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyEmail() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <div className="bg-background p-8 rounded-xl shadow-lg max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>

        <h1 className="text-2xl font-semibold mb-2">
          Cuenta verificada
        </h1>

        <p className="text-muted-foreground mb-6">
          Tu correo electrónico fue verificado correctamente.
          Ya puedes cerrar esta ventana o volver a SmartDocs.
        </p>

        <Button
          className="w-full"
          onClick={() => window.close()}
        >
          Cerrar ventana
        </Button>
      </div>
    </div>
  );
}
