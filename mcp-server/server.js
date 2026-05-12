import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const TIMELINE_PATH = process.env.TIMELINE_PATH;

if (!TIMELINE_PATH) {
  console.error('TIMELINE_PATH nie gestel in .env nie');
  process.exit(1);
}

const server = new McpServer({
  name: 'timeline-dev-assistant',
  version: '1.0.0',
});

// ─────────────────────────────────────────────
// GEREESKAP 1: Lys alle projekslêers
// ─────────────────────────────────────────────
server.tool(
  'list_project_files',
  'Lys alle lêers in die Timeline-projek',
  {},
  async () => {
    const ignore = ['node_modules', '.git', 'mcp-server', '__pycache__', '.DS_Store'];

    function walk(dir, prefix = '') {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      const lines = [];
      for (const entry of entries) {
        if (ignore.includes(entry.name)) continue;
        if (entry.name.startsWith('.') && entry.name !== '.env') continue;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          lines.push(`${prefix}📁 ${entry.name}/`);
          lines.push(...walk(fullPath, prefix + '  '));
        } else {
          const size = fs.statSync(fullPath).size;
          const kb = (size / 1024).toFixed(0);
          lines.push(`${prefix}📄 ${entry.name} (${kb}KB)`);
        }
      }
      return lines;
    }

    const tree = walk(TIMELINE_PATH);
    return {
      content: [{ type: 'text', text: tree.join('\n') }],
    };
  }
);

// ─────────────────────────────────────────────
// GEREESKAP 2: Lees 'n lêer
// ─────────────────────────────────────────────
server.tool(
  'read_file',
  'Lees die inhoud van enige projekslêer',
  { filename: z.string().describe('Lêernaam of relatiewe pad, bv. index.html of server.py') },
  async ({ filename }) => {
    const fullPath = path.join(TIMELINE_PATH, filename);

    if (!fullPath.startsWith(TIMELINE_PATH)) {
      return { content: [{ type: 'text', text: 'Toegang geweier: buite projekgids' }] };
    }

    if (!fs.existsSync(fullPath)) {
      return { content: [{ type: 'text', text: `Lêer nie gevind: ${filename}` }] };
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n').length;
    const kb = (Buffer.byteLength(content) / 1024).toFixed(0);

    return {
      content: [{
        type: 'text',
        text: `── ${filename} (${lines} reëls, ${kb}KB) ──\n\n${content}`,
      }],
    };
  }
);

// ─────────────────────────────────────────────
// GEREESKAP 3: Skryf 'n lêer terug (na git commit)
// ─────────────────────────────────────────────
server.tool(
  'write_file',
  "Skryf gewysigde inhoud terug na 'n projekslêer. Git commit gebeur outomaties voor skryf.",
  {
    filename: z.string().describe('Lêernaam, bv. index.html'),
    content: z.string().describe('Die volledige nuwe inhoud van die lêer'),
    message: z.string().describe('Git commit boodskap wat beskryf wat verander het'),
  },
  async ({ filename, content, message }) => {
    const fullPath = path.join(TIMELINE_PATH, filename);

    if (!fullPath.startsWith(TIMELINE_PATH)) {
      return { content: [{ type: 'text', text: 'Toegang geweier: buite projekgids' }] };
    }

    // Rugsteun voor skryf
    const backupPath = fullPath + '.bak';
    if (fs.existsSync(fullPath)) {
      fs.copyFileSync(fullPath, backupPath);
    }

    // Git commit van huidige toestand voor verandering
    try {
      execSync(`git -C "${TIMELINE_PATH}" add "${filename}"`, { stdio: 'pipe' });
      execSync(`git -C "${TIMELINE_PATH}" commit -m "VOOR: ${message}" --allow-empty`, { stdio: 'pipe' });
    } catch (e) {
      // Git fout is nie 'n blokkering nie — gaan voort
    }

    // Skryf nuwe inhoud
    fs.writeFileSync(fullPath, content, 'utf8');

    // Git commit van nuwe toestand
    try {
      execSync(`git -C "${TIMELINE_PATH}" add "${filename}"`, { stdio: 'pipe' });
      execSync(`git -C "${TIMELINE_PATH}" commit -m "Claude: ${message}"`, { stdio: 'pipe' });
    } catch (e) {
      // Dalk geen veranderinge — ook ok
    }

    const lines = content.split('\n').length;
    return {
      content: [{
        type: 'text',
        text: `✅ ${filename} geskryf (${lines} reëls)\n💾 Rugsteun: ${filename}.bak\n📝 Git: "Claude: ${message}"`,
      }],
    };
  }
);

// ─────────────────────────────────────────────
// GEREESKAP 4: Soek teks in projekslêers
// ─────────────────────────────────────────────
server.tool(
  'search_in_files',
  "Soek 'n string of patroon in projekslêers",
  {
    query: z.string().describe('Die teks om te soek'),
    filename: z.string().optional().describe('Spesifieke lêer om in te soek, of leeg vir alle lêers'),
  },
  async ({ query, filename }) => {
    const targets = filename
      ? [path.join(TIMELINE_PATH, filename)]
      : ['index.html', 'server.py'].map(f => path.join(TIMELINE_PATH, f));

    const results = [];

    for (const filePath of targets) {
      if (!fs.existsSync(filePath)) continue;
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const matches = [];

      lines.forEach((line, i) => {
        if (line.toLowerCase().includes(query.toLowerCase())) {
          matches.push(`  Reël ${i + 1}: ${line.trim()}`);
        }
      });

      if (matches.length > 0) {
        const name = path.basename(filePath);
        results.push(`── ${name}: ${matches.length} treffer(s) ──`);
        results.push(...matches.slice(0, 20)); // max 20 per lêer
        if (matches.length > 20) results.push(`  ... en ${matches.length - 20} meer`);
      }
    }

    return {
      content: [{
        type: 'text',
        text: results.length > 0
          ? results.join('\n')
          : `Geen treffers vir "${query}" gevind nie`,
      }],
    };
  }
);

// ─────────────────────────────────────────────
// GEREESKAP 5: Git geskiedenis
// ─────────────────────────────────────────────
server.tool(
  'git_log',
  'Wys die laaste git commits vir die projek',
  { count: z.number().optional().describe('Hoeveel commits om te wys (verstek 10)') },
  async ({ count = 10 }) => {
    try {
      const log = execSync(
        `git -C "${TIMELINE_PATH}" log --oneline -${count}`,
        { encoding: 'utf8', stdio: 'pipe' }
      );
      return { content: [{ type: 'text', text: log || 'Geen commits gevind nie' }] };
    } catch (e) {
      return { content: [{ type: 'text', text: 'Git nie beskikbaar of geen commits nie' }] };
    }
  }
);

// ─────────────────────────────────────────────
// Begin bediener
// ─────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
console.error('Timeline MCP-bediener gereed ✓');
