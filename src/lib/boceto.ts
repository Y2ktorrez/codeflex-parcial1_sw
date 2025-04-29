import type { Editor } from '@grapesjs/studio-sdk/dist/typeConfigs/gjsExtend.js';

/**
 * Envía la captura a GPT-4.1 nano (visión) y devuelve HTML editable.
 * 1. Convierte la imagen a Base64
 * 2. Llama a la API de OpenAI
 * 3. Extrae el bloque ```html … ``` que devuelve el modelo
 * 4. Crea una página nueva en GrapesJS con ese contenido
 */
export async function BocetoImport(
  editor: Editor,
  imageFile: File,
  pageName = 'imagen_a_html'
) {
  const apiKey = process.env.PUBLIC_OPENAI_API_KEY;
  if (!apiKey) throw new Error('PUBLIC_OPENAI_API_KEY env var missing');

  // File → base64
  const toBase64 = (file: File) =>
    new Promise<string>((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result as string);
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });

  const base64 = await toBase64(imageFile);

  const prompt = `You are a frontend developer and I will give you a screenshot of a user interface. Your task is to generate a clean HTML layout with inline CSS that can be directly used in GrapesJS.

Important constraints:
Do NOT include <html>, <head>, or <body> tags. Wrap everything in a single <div> as the root.
Use only plain HTML and inline CSS. Do not use Tailwind, Bootstrap, or external styles.
Use semantic tags where appropriate: <form>, <input>, <button>, <textarea>, <table>, etc.
Make every part of the layout editable in GrapesJS. This means:
Avoid content inside <td> or <th> that is plain static text.
Wrap table cell content in <div> or <span> inside each <td> or <th>, so they can be edited individually.
Use flexbox for layout when needed.
Avoid JavaScript.
The code must be simple, readable, and directly usable in GrapesJS Studio.

Your output must be:

\`\`\`html
<!-- Just the HTML code inside a <div>, ready to paste in GrapesJS -->`;

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

  // Extraemos bloque html
  const match = content.match(/```html([\\s\\S]*?)```/i);
  const html = (match ? match[1] : content).trim();

  // Inyectamos en GrapesJS
  const nuevaPagina = editor.Pages.add({
    name: pageName,
  });

  // 2. Insertar el HTML generado por IA
  nuevaPagina?.getMainComponent().append(html);

  // 3. Seleccionar automáticamente esa nueva página
  editor.Pages.select(nuevaPagina || "home");
}