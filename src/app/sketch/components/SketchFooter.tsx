import { useState } from "react";
import type { Editor } from "@grapesjs/studio-sdk/dist/typeConfigs/gjsExtend.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { ZapIcon } from "lucide-react";
import { ExportToAngular } from "@/app/grapesjs/utils/angular_export";

export default function ExportButtonSketch({ editor }: { editor?: Editor }) {
  const [projectName, setProjectName] = useState("codeflex-io");
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExport = async () => {
    if (!editor) return;
    setIsProcessing(true);

    try {
      const exportName = projectName.includes("codeflex.io")
        ? projectName
        : `${projectName}`;

      await ExportToAngular(editor, exportName);
      setIsOpen(false);
    } catch (err) {
      console.error(err);
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: {
            message:
              "Error al generar el proyecto Angular, inténtelo de nuevo más tarde.",
            variant: "error",
          },
        })
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border py-3">
      <div className="container mx-auto flex items-center justify-center relative">
        {/* LOGO (posición absoluta a la izquierda) */}
        <div className="absolute left-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="p-1 bg-primary/10 rounded">
              <ZapIcon className="w-4 h-4 text-primary" />
            </div>
            <span className="text-lg font-bold font-mono">
              code<span className="text-primary">flex</span>.ai
            </span>
          </Link>
        </div>

        {/* BOTÓN DE EXPORTACIÓN CENTRADO */}
        <div className="mx-auto">
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="bg-primary/10 hover:bg-primary/20 text-primary hover:text-primary/90 border-border"
              >
                Exportar a Angular
              </Button>
            </PopoverTrigger>

            <PopoverContent 
              className="w-80 p-4 bg-background border-border" 
              align="center"
              sideOffset={10}
            >
              <div className="flex flex-col space-y-4">
                <h3 className="text-lg font-semibold">Exportar Proyecto</h3>
                <p className="text-sm text-muted-foreground">
                  Introduzca el nombre del proyecto Angular que desea generar
                </p>

                <div className="grid gap-2">
                  <Label htmlFor="project-name">Proyecto:</Label>
                  <Input
                    id="project-name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="codeflex-io"
                    className="border-border"
                  />
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="border-border"
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleExport}
                    disabled={isProcessing}
                    className="bg-primary/90 hover:bg-primary text-primary-foreground"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      "Generar"
                    )}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </footer>
  );
}