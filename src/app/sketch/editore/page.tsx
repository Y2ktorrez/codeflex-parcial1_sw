"use client";

import { type Editor } from 'grapesjs';
import { useState } from 'react';
import '@grapesjs/studio-sdk/style';
import StudioEditorComponent from '@/components/StudioEditorComponent';
import { ChatDrawer } from '@/components/ChatDrawer';
import { WebSocketProvider } from '@/context/WebSocketContext';
import ExportButton from '../components/SketchFooter';

export default function SketchPage() {
  const [editor, setEditor] = useState<Editor>();

  return (
    <WebSocketProvider> {/* << AQUÍ */}
      <main className="flex h-screen flex-col p-5 gap-2 relative">
        <div className="flex items-center gap-5">
          <ExportButton editor={editor} />
        </div>

        <div className="flex-1 w-full h-full overflow-hidden">
          <StudioEditorComponent onReady={setEditor} />
        </div>

        <ChatDrawer />
      </main>
    </WebSocketProvider>
  );
}