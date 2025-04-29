'use client';

import { useState, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useEditorStore } from '@/lib/editor.store';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud } from 'lucide-react';

export default function BocetoPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const { setImageFile: saveImage } = useEditorStore();
  const router = useRouter();

  const handleSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) setImageFile(e.target.files[0]);
  };

  const handleGenerate = async () => {
    if (!imageFile) return;
    setProcessing(true);
    saveImage(imageFile); // Guardar en Zustand
    router.push('/sketch/editor'); // Ir al editor
  };

  return (
    <section className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Subir Imagen - Crear HTML</CardTitle>
        </CardHeader>

        <CardContent>
          <label
            htmlFor="image-input"
            className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed rounded-xl hover:bg-muted/40 transition-colors cursor-pointer"
          >
            {imageFile ? (
              <>
                <UploadCloud className="w-10 h-10 text-accent mb-2" />
                <p className="text-sm font-medium">{imageFile.name}</p>
                <span className="text-xs text-muted-foreground mt-1">
                  Pulsa “Generar Página” para continuar
                </span>
              </>
            ) : (
              <>
                <UploadCloud className="w-10 h-10 text-accent mb-2" />
                <p className="text-sm text-muted-foreground">
                  Arrastra tu imagen o haz click para elegir
                </p>
              </>
            )}
            <input
              id="image-input"
              type="file"
              accept="image/*"
              onChange={handleSelect}
              className="hidden"
            />
          </label>
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          <Button
            variant="secondary"
            disabled={processing || !imageFile}
            onClick={() => setImageFile(null)}
          >
            Limpiar
          </Button>
          <Button disabled={processing || !imageFile} onClick={handleGenerate}>
            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {processing ? 'Generando...' : 'Generar Página'}
          </Button>
        </CardFooter>
      </Card>
    </section>
  );
}
