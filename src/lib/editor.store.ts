// src/lib/editor.store.ts
import { create } from 'zustand';

interface EditorStore {
  imageFile: File | null;
  setImageFile: (file: File | null) => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  imageFile: null,
  setImageFile: (file) => set({ imageFile: file }),
}));
