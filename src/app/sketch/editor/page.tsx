'use client';

import { useEffect, useState } from 'react';
import { type Editor } from 'grapesjs';
import StudioEditorComponent from '@/components/StudioEditorComponent';
import { ChatDrawer } from '@/components/ChatDrawer';
import { WebSocketProvider } from '@/context/WebSocketContext';
import ExportButtonSketch from '../components/SketchFooter';
import { useEditorStore } from '@/lib/editor.store';
import { BocetoImport } from '@/lib/boceto';

export default function EditorPage() {
  const [editor, setEditor] = useState<Editor>();
  const { imageFile, setImageFile } = useEditorStore();

  useEffect(() => {
    if (editor && imageFile) {
      const loadBoceto = async () => {
        try {
          await BocetoImport(editor, imageFile);
          setImageFile(null); // Limpiar después
        } catch (error) {
          console.error('Error cargando boceto:', error);
        }
      };
      loadBoceto();
    }
  }, [editor, imageFile, setImageFile]);

  return (
    <WebSocketProvider>
      <main className="flex h-screen flex-col p-5 gap-2 relative">
        <div className="flex items-center gap-5">
          <ExportButtonSketch editor={editor} />
        </div>
        <div className="flex-1 w-full h-full overflow-hidden">
          <StudioEditorComponent onReady={setEditor} />
        </div>
        <ChatDrawer />
      </main>
    </WebSocketProvider>
  );
}
