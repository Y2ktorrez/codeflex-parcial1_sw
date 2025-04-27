import JSZip from "jszip";
import * as FileSaver from "file-saver";
import { ParsedClass, ParseModelXml } from "./parce";

export async function ExportXmlAngular(xmlFile: File, projectName = "diagram") {
  if (!xmlFile) return;

  const xmlText = await xmlFile.text();
  const clases: ParsedClass[] = await ParseModelXml(xmlText);

  console.log(clases);

  const zip = new JSZip();
  zip.file("model.json", JSON.stringify(clases, null, 2));

  const script = `#!/usr/bin/env bun

console.log(\`

░█▀▀░█▀█░█▀▄░█▀▀░█▀▀░█░░░█▀▀░█░█░░░░█▀█░▀█▀
░█░░░█░█░█░█░█▀▀░█▀▀░█░░░█▀▀░▄▀▄░░░░█▀█░░█░
░▀▀▀░▀▀▀░▀▀░░▀▀▀░▀░░░▀▀▀░▀▀▀░▀░▀░▀░░▀░▀░▀▀▀

 \`);

console.log('Generating resources, please wait ...');

const { exec } = require("child_process");
const fs = require("fs/promises");
const path = require("path");

const execCmd = (cmd, options = {}) =>
  new Promise((resolve, reject) =>
    exec(cmd, options, (err, stdout, stderr) => (err ? reject(stderr) : resolve(stdout)))
  );

const pascalCase = (str) =>
  str
    .replace(/[_\\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""))
    .replace(/^./, (c) => c.toUpperCase());

const kebabCase = (str) => str.toLowerCase().replace(/[_\\s]+/g, "-");

async function generateAngularProject(appName) {
  await execCmd(\`bunx @angular/cli@19 new \${appName} --routing --style=css --skip-install --defaults\`, { stdio: 'inherit' });
}

async function copyModelJson(appName) {
  await fs.copyFile("model.json", path.join(appName, "model.json"));
  const raw = await fs.readFile("model.json", "utf8");
  return JSON.parse(raw).filter((c) => c.name && typeof c.name === "string");
}

async function createComponent(appName, clase) {
  const kebab = kebabCase(clase.name);
  const className = pascalCase(clase.name) + "Component";
  const pageDir = path.join(appName, "src/app/pages", kebab);

  await execCmd(\`bunx ng generate component pages/\${kebab} --module=app.module.ts\`, { cwd: appName });
  await fs.mkdir(pageDir, { recursive: true });

  const ts = \`
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-\${kebab}',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './\${kebab}.component.html',
  styleUrls: ['./\${kebab}.component.css']
})
export class \${className} {
  model: any = { \${clase.attribute.map((a) => \`\${a.name}: ''\`).join(", ")} };
  items: any[] = [];
  editIndex: number | null = null;

  submit() {
    if (this.editIndex !== null) {
      this.items[this.editIndex] = { ...this.model };
      this.editIndex = null;
    } else {
      this.items.push({ ...this.model });
    }
    this.model = {};
  }

  edit(index: number) {
    this.model = { ...this.items[index] };
    this.editIndex = index;
  }

  cancelEdit() {
    this.model = {};
    this.editIndex = null;
  }

  remove(index: number) {
    this.items.splice(index, 1);
  }
}
\`.trim();

  const html = \`
<div class="crud-container">
  <h2>\${clase.name}</h2>
  <form class="crud-form" (ngSubmit)="submit()">
    \${clase.attribute
      .map(
        (a) => \`
    <div class="form-field">
      <label>\${a.name}</label>
      <input [(ngModel)]="model.\${a.name}" name="\${a.name}" type="text" required />
    </div>\`
      )
      .join("\\n")}
    <button type="submit">{{ editIndex !== null ? 'Actualizar' : 'Agregar' }}</button>
    <button type="button" class="cancel" *ngIf="editIndex !== null" (click)="cancelEdit()">Cancelar</button>
  </form>
  <table>
    <thead>
      <tr>
        \${clase.attribute.map((a) => \`<th>\${a.name}</th>\`).join("\\n")}
        <th>Acciones</th>
      </tr>
    </thead>
    <tbody>
      <tr *ngFor="let item of items; let i = index">
        \${clase.attribute.map((a) => \`<td>{{ item.\${a.name} }}</td>\`).join("\\n")}
        <td>
          <button (click)="edit(i)">✏️</button>
          <button (click)="remove(i)">🗑️</button>
        </td>
      </tr>
    </tbody>
  </table>
</div>\`.trim();

  const css = \`
.crud-container {
  max-width: 800px;
  margin: auto;
  padding: 16px;
  font-family: sans-serif;
}
.crud-form {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
  background: #f9f9f9;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #ddd;
}
.form-field {
  flex: 1 1 45%;
  display: flex;
  flex-direction: column;
}
.form-field label {
  margin-bottom: 4px;
  font-weight: bold;
}
input[type="text"] {
  padding: 6px 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
}
button {
  padding: 6px 12px;
  margin-top: auto;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button.cancel {
  background: #ccc;
}
table {
  width: 100%;
  border-collapse: collapse;
}
table th, table td {
  padding: 8px;
  border: 1px solid #ddd;
  text-align: left;
}
table th {
  background: #f0f0f0;
}\`.trim();

  await Promise.all([
    fs.writeFile(path.join(pageDir, \`\${kebab}.component.ts\`), ts),
    fs.writeFile(path.join(pageDir, \`\${kebab}.component.html\`), html),
    fs.writeFile(path.join(pageDir, \`\${kebab}.component.css\`), css),
  ]);
}

async function generateRoutes(appName, valid) {
  const routesFile = path.join(appName, "src/app/app.routes.ts");
  const imports = valid
    .map((c) => {
      const kebab = kebabCase(c.name);
      const className = pascalCase(c.name) + "Component";
      return \`import { \${className} } from './pages/\${kebab}/\${kebab}.component';\`;
    })
    .join("\\n");

  const routes = valid
    .map((c, i) => {
      const kebab = kebabCase(c.name);
      const className = pascalCase(c.name) + "Component";
      return \`  { path: \${i === 0 ? \`''\` : \`'\${kebab}'\`}, component: \${className} },\`;
    })
    .join("\\n");

  const fileContent = \`// AUTO-GENERATED FILE
\${imports}

export const routes = [
\${routes}
  { path: '**', redirectTo: '' }
];\`;

  await fs.writeFile(routesFile, fileContent);
}

async function updateAppComponent(appName, valid) {
  const html = \`
<div class="layout">
  <aside class="sidebar">
    <ul>
      \${valid
        .map((c) => {
          const kebab = kebabCase(c.name);
          return \`<li><a routerLink="/\${kebab}" routerLinkActive="active">\${c.name}</a></li>\`;
        })
        .join("\\n")}
    </ul>
  </aside>
  <main class="content">
    <router-outlet></router-outlet>
  </main>
</div>\`;

  const ts = \`
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {}\`;

  const css = \`
.layout {
  display: flex;
  height: 100vh;
}
.sidebar {
  width: 240px;
  background: #f4f4f4;
  padding: 20px;
  box-shadow: 2px 0 5px rgba(0,0,0,0.1);
}
.sidebar ul {
  list-style: none;
  padding: 0;
}
.sidebar li {
  margin: 12px 0;
}
.sidebar a {
  text-decoration: none;
  color: #333;
  font-weight: bold;
}
.sidebar a.active {
  color: #1976d2;
}
.content {
  flex: 1;
  padding: 20px;
}\`;

  await Promise.all([
    fs.writeFile(path.join(appName, "src/app/app.component.html"), html),
    fs.writeFile(path.join(appName, "src/app/app.component.ts"), ts),
    fs.writeFile(path.join(appName, "src/app/app.component.css"), css),
  ]);
}

async function waitForFile(filePath, retries = 10, interval = 500) {
  for (let i = 0; i < retries; i++) {
    try {
      await fs.access(filePath);
      return;
    } catch {
      await new Promise((res) => setTimeout(res, interval));
    }
  }
  throw new Error(\`Timeout esperando el archivo: \${filePath}\`);
}

async function main() {
  const appName = path.basename(__filename, ".js");
  if (!appName) process.exit(1);

  await generateAngularProject(appName);
  const valid = await copyModelJson(appName);

  for (const clase of valid) {
    await createComponent(appName, clase);
  }

  await generateRoutes(appName, valid);
  await updateAppComponent(appName, valid);

  await waitForFile(path.join(appName, "package.json"));
  await execCmd("bun install", { cwd: appName });

console.log(\`✅ All ready. Make a:\n cd \${appName} and Then: bun start\`);
  
}

main().catch(() => {
  process.exit(1);
});
`;

  zip.file(`${projectName}.js`, script, { unixPermissions: "755" });

  const blob = await zip.generateAsync({ type: "blob" });
  FileSaver.saveAs(blob, `${projectName}-codeflex.zip`);
}
