"use client";

import { type Editor } from 'grapesjs';
import { useEffect, useState } from 'react';
import '@grapesjs/studio-sdk/style';
import StudioEditorComponent from '@/components/StudioEditorComponent';
import ExportButton from './components/GrapesFooter';
import { ChatDrawer } from '@/components/ChatDrawer';
import { useAuth } from '@/context/AuthContext';
import { WebSocketProvider } from '@/context/WebSocketContext';

export default function StudioEditorPage() {
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