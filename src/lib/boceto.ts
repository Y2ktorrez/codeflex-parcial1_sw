// src/lib/boceto-import.ts
import type { Editor } from '@grapesjs/studio-sdk/dist/typeConfigs/gjsExtend.js';

/**
 * Envía la imagen a OpenAI y genera un HTML editable para GrapesJS.
 */
export async function BocetoImport(
  editor: Editor,
  imageFile: File,
  pageName = 'imagen-a-html'
) {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) throw new Error('NEXT_PUBLIC_OPENAI_API_KEY env var missing');

  // Convertir a Base64
  const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const base64 = await toBase64(imageFile);

  const prompt = `You are a frontend developer and I will give you a screenshot of a user interface. Your task is to generate a clean HTML layout with inline CSS that can be directly used in GrapesJS.

Important constraints:
- Do NOT include <html>, <head>, or <body> tags. Wrap everything inside a single <div> as the root.
- Use only plain HTML and inline CSS. No frameworks.
- Use semantic tags: <form>, <input>, <button>, <textarea>, <table>, etc.
- Make every part editable in GrapesJS.
- Wrap table cell content inside <div> or <span>.
- Use flexbox for layout when needed.
- Avoid JavaScript.
- Keep the code simple, clean, and readable.

Respond with only:

\`\`\`html
<!-- HTML code here -->
\`\`\`
`;

  const body = {
    model: 'gpt-4.1-nano',
    max_tokens: 2048,
    temperature: 0.1,
    messages: [
      { role: 'system', content: 'You convert UI screenshots into editable HTML.' },
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: base64 } }
        ]
      }
    ]
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI error: ${err}`);
  }

  const json = await response.json();
  const content: string = json.choices?.[0]?.message?.content ?? '';

  // Extraer HTML
  const match = content.match(/```html([\s\S]*?)```/i);
  const html = (match ? match[1] : content).trim();

  // Crear nueva página en GrapesJS
  const nuevaPagina = editor.Pages.add({ name: pageName });
  nuevaPagina?.getMainComponent().append(html);
  editor.Pages.select(nuevaPagina || 'home');
}
