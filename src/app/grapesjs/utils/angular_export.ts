import JSZip from "jszip";
import * as FileSaver from 'file-saver';
import type { Editor } from "@grapesjs/studio-sdk/dist/typeConfigs/gjsExtend.js";

export async function ExportToAngular(editor: Editor, projectName: string="export_angular") {
  if (!editor) return;

  const pages = editor.Pages.getAll();
  const names = pages.map(p => p.get('name'));
  const uniqueNames = new Set(names);

  if (uniqueNames.size !== names.length) {
    window.dispatchEvent(
      new CustomEvent('toast', {
        detail: {
          message: 'Hay páginas con nombres duplicados. Cámbialas antes de exportar.',
          variant: 'warning'
        }
      })
    )
    return; 
  }

  const zip = new JSZip();

  const originalProject = editor.getProjectData();

  const pagesWithCode: Array<{
    id: string;
    name: string;
    html: string;
    css: string;
  }> = [];
  for (const page of originalProject.pages) {
    editor.loadProjectData({ ...originalProject, pages: [page] });
    const html = editor.getHtml();
    const css = editor.getCss() || '';
    pagesWithCode.push({ id: page.id, name: page.name, html, css });
  }

  editor.loadProjectData(originalProject);

  const projectWithCode = { ...originalProject, pages: pagesWithCode };
  zip.file(`${projectName}.json`, JSON.stringify(projectWithCode, null, 2));

  const scriptContent = `#!/usr/bin/env bun
console.log(\`

░█▀▀░█▀█░█▀▄░█▀▀░█▀▀░█░░░█▀▀░█░█░░░░█▀█░▀█▀
░█░░░█░█░█░█░█▀▀░█▀▀░█░░░█▀▀░▄▀▄░░░░█▀█░░█░
░▀▀▀░▀▀▀░▀▀░░▀▀▀░▀░░░▀▀▀░▀▀▀░▀░▀░▀░░▀░▀░▀▀▀

 \`);

console.log('Generating resources, please wait ...');

import { $ } from 'bun';
import { join, basename } from 'path';
import { readFileSync, writeFileSync, copyFileSync } from 'fs';

// Obtener el nombre del archivo actual sin la extensión .ts
const scriptPath = process.argv[1];
const projectName = basename(scriptPath, '.ts');

if (!projectName) {
  console.error("Error: El nombre del proyecto no puede ser vacío.");
  process.exit(1);
}

const appName = \`\${projectName}\`;
await $\`bun x @angular/cli@19 new \${appName} --routing --style=css --skip-install --defaults\`;

copyFileSync(\`\${appName}.json\`, \`\${appName}/grapesjs-project.json\`);

// En Bun podemos usar import directamente
const project = JSON.parse(readFileSync(\`\${appName}.json\`, 'utf-8'));

for (const page of project.pages) {
  const nameKebab = page.name.toLowerCase().replace(/\\s+/g, '-');
  await $\`cd \${appName} && bun x ng generate component pages/\${nameKebab} --flat=false --module=app.module.ts\`;
  
  writeFileSync(
    join(appName, 'src/app/pages', nameKebab, \`\${nameKebab}.component.html\`),
    page.html,
    'utf-8'
  );
  
  writeFileSync(
    join(appName, 'src/app/pages', nameKebab, \`\${nameKebab}.component.css\`),
    page.css,
    'utf-8'
  );
}

// Generar archivos de rutas
(() => {
  const imports = project.pages.map(page => {
    const kebab = page.name.toLowerCase().replace(/\\s+/g, '-');
    const className = page.name
      .split(/\\s+/g)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join('') + 'Component';
     return \`import { \${className} } from './pages/\${kebab}/\${kebab}.component';\`;
  }).join('\\n');

  const routes = project.pages.map((page, i) => {
    const kebab = page.name.toLowerCase().replace(/\\s+/g, '-');
    const className = page.name
      .split(/\\s+/g)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join('') + 'Component';
    const pathStr = i === 0 ? "''" : \`'\${kebab}'\`;
    return \`  { path: \${pathStr}, component: \${className} },\`;
  }).join('\\n');

  const routesFileContent = \`// Este archivo es generado automáticamente
\${imports}  // Incluir los imports generados

export const routes = [
\${routes}  // Incluir las rutas generadas
  { path: '**', redirectTo: '' }  // Ruta de fallback
];
\`;

  writeFileSync(
    join(appName, 'src/app/app.routes.ts'),
    routesFileContent,
    'utf-8'
  );
})();

// Sobreescribir app.component.html con <router-outlet> y menú
(() => {
  const navLinks = project.pages.map((page, i) => {
    const kebab = page.name.toLowerCase().replace(/\\s+/g, '-');
    const label = page.name;
    const link = i === 0 ? '/' : '/' + kebab;
    return \`<a routerLink="\${link}">\${label}</a>\`;
  }).join(' | ');

  const appCompHtml = \`<nav>\${navLinks}</nav>
<hr/>
<router-outlet></router-outlet>\`;

const appCompTs = \`
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';  // Importamos RouterModule aquí
import { routes } from './app.routes';  // Importa las rutas definidas

@Component({
  selector: 'app-root',
  standalone: true,  // Este es un componente standalone
  imports: [RouterModule],  // Aquí agregamos RouterModule dinámicamente
  templateUrl: './app.component.html',
})
export class AppComponent {}
\`;

  writeFileSync(
    join(appName, 'src/app/app.component.ts'),
    appCompTs,
    'utf-8'
  );

  writeFileSync(
    join(appName, 'src/app/app.component.html'),
    appCompHtml,
    'utf-8'
  );
})();

await $\`cd \${appName} && bun install\`;

console.log(\`✅ All ready. Make a:\n cd \${appName} and Then: bun start\`);
`;
  
  // Cambiamos la extensión a .ts para TypeScript con Bun
  zip.file(`${projectName}.ts`, scriptContent, { unixPermissions: "755" });

  const content = await zip.generateAsync({ type: "blob" });
  FileSaver.saveAs(content, `${projectName}.zip`);
}