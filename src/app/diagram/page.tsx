'use client';

import { useState, ChangeEvent } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud } from 'lucide-react';
import { ExportXmlAngular } from '@/lib/xml';

export default function DiagramPage() {
  const [xmlFile, setXmlFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) setXmlFile(e.target.files[0]);
  };

  const handleGenerate = async () => {
    if (!xmlFile) return;
    setProcessing(true);
    try {
      await ExportXmlAngular(xmlFile, 'diagram');
    } catch (err) {
      console.error(err);
      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: { message: 'Ocurrió un error al generar el proyecto 😢', variant: 'destructive' },
        }),
      );
    } finally {
      setProcessing(false);
      setXmlFile(null);
    }
  };

  return (
    <section className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Angular Generador</CardTitle>
        </CardHeader>

        <CardContent>
          <label
            htmlFor="xml-input"
            className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed rounded-xl
                       hover:bg-muted/40 transition-colors cursor-pointer"
          >
            {xmlFile ? (
              <>
                <UploadCloud className="w-10 h-10 text-accent mb-2" />
                <p className="text-sm font-medium">{xmlFile.name}</p>
                <span className="text-xs text-muted-foreground mt-1">
                  Pulsa “Generar proyecto” para continuar
                </span>
              </>
            ) : (
              <>
                <UploadCloud className="w-10 h-10 text-accent mb-2" />
                <p className="text-sm text-muted-foreground">Drag your Diagram or click to choose</p>
              </>
            )}

            <input
              id="xml-input"
              type="file"
              accept=".xml"
              onChange={handleSelect}
              className="hidden"
            />
          </label>
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          <Button
            variant="secondary"
            disabled={processing || !xmlFile}
            onClick={() => setXmlFile(null)}
          >
            Clear
          </Button>
          <Button disabled={processing || !xmlFile} onClick={handleGenerate}>
            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {processing ? 'Generando...' : 'Generate'}
          </Button>
        </CardFooter>
      </Card>
    </section>
  );
}
