import 'dotenv/config';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const PORT = 3131;
const TIMELINE_PATH = process.env.TIMELINE_PATH;

if (!TIMELINE_PATH) {
  console.error('❌  TIMELINE_PATH nie gestel in .env nie');
  process.exit(1);
}

// ─────────────────────────────────────────────
// GEREEDSKAP (dieselfde logika as server.js)
// ─────────────────────────────────────────────
const tools = {

  list_project_files: async () => {
    const ignore = ['node_modules', '.git', 'mcp-server', '__pycache__', '.DS_Store'];
    function walk(dir, prefix = '') {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      const lines = [];
      for (const entry of entries) {
        if (ignore.includes(entry.name)) continue;
        if (entry.name.startsWith('.')) continue;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          lines.push(`${prefix}📁 ${entry.name}/`);
          lines.push(...walk(fullPath, prefix + '  '));
        } else {
          const kb = (fs.statSync(fullPath).size / 1024).toFixed(0);
          lines.push(`${prefix}📄 ${entry.name} (${kb}KB)`);
        }
      }
      return lines;
    }
    return walk(TIMELINE_PATH).join('\n');
  },

  read_file: async ({ filename }) => {
    const fullPath = path.join(TIMELINE_PATH, filename);
    if (!fullPath.startsWith(TIMELINE_PATH)) return 'Toegang geweier';
    if (!fs.existsSync(fullPath)) return `Lêer nie gevind: ${filename}`;
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n').length;
    const kb = (Buffer.byteLength(content) / 1024).toFixed(0);
    return `── ${filename} (${lines} reëls, ${kb}KB) ──\n\n${content}`;
  },

  write_file: async ({ filename, content, message }) => {
    const fullPath = path.join(TIMELINE_PATH, filename);
    if (!fullPath.startsWith(TIMELINE_PATH)) return 'Toegang geweier';
    if (fs.existsSync(fullPath)) fs.copyFileSync(fullPath, fullPath + '.bak');
    try { execSync(`git -C "${TIMELINE_PATH}" add "${filename}" && git -C "${TIMELINE_PATH}" commit -m "VOOR: ${message}" --allow-empty`, { stdio: 'pipe' }); } catch {}
    fs.writeFileSync(fullPath, content, 'utf8');
    try { execSync(`git -C "${TIMELINE_PATH}" add "${filename}" && git -C "${TIMELINE_PATH}" commit -m "Claude: ${message}"`, { stdio: 'pipe' }); } catch {}
    return `✅ ${filename} geskryf\n💾 Rugsteun: ${filename}.bak\n📝 Git: "Claude: ${message}"`;
  },

  search_in_files: async ({ query, filename }) => {
    const targets = filename
      ? [path.join(TIMELINE_PATH, filename)]
      : ['index.html', 'server.py'].map(f => path.join(TIMELINE_PATH, f));
    const results = [];
    for (const filePath of targets) {
      if (!fs.existsSync(filePath)) continue;
      const lines = fs.readFileSync(filePath, 'utf8').split('\n');
      const matches = lines
        .map((line, i) => line.toLowerCase().includes(query.toLowerCase()) ? `  Reël ${i + 1}: ${line.trim()}` : null)
        .filter(Boolean);
      if (matches.length) {
        results.push(`── ${path.basename(filePath)}: ${matches.length} treffer(s) ──`);
        results.push(...matches.slice(0, 20));
        if (matches.length > 20) results.push(`  ... en ${matches.length - 20} meer`);
      }
    }
    return results.length ? results.join('\n') : `Geen treffers vir "${query}"`;
  },

  git_log: async ({ count = 10 }) => {
    try {
      return execSync(`git -C "${TIMELINE_PATH}" log --oneline -${count}`, { encoding: 'utf8', stdio: 'pipe' }) || 'Geen commits';
    } catch { return 'Git nie beskikbaar nie'; }
  },
};

// ─────────────────────────────────────────────
// HTTP BEDIENER
// ─────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  // CORS — laat dev.html toe om te koppel
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // Bedien dev.html by die wortelpad
  if (req.url === '/' && req.method === 'GET') {
    const devPath = path.join(TIMELINE_PATH, 'dev.html');
    if (fs.existsSync(devPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(devPath, 'utf8'));
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('dev.html nie gevind in ' + TIMELINE_PATH);
    }
    return;
  }

  // Gesondheidskontrole
  if (req.url === '/ping' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, path: TIMELINE_PATH }));
    return;
  }

  // Gereedskapaanroep
  if (req.url === '/tool' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { tool, args } = JSON.parse(body);
        if (!tools[tool]) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `Onbekende gereedskap: ${tool}` }));
          return;
        }
        console.log(`⚙  ${tool}(${JSON.stringify(args)})`);
        const result = await tools[tool](args || {});
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ result }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  res.writeHead(404); res.end();
});

server.listen(PORT, 'localhost', () => {
  console.log(`\n🤖  Timeline Dev Bridge gereed`);
  console.log(`    Paneel:  http://localhost:${PORT}`);
  console.log(`    Ping:    http://localhost:${PORT}/ping`);
  console.log(`    Projek:  ${TIMELINE_PATH}`);
  console.log(`\n    Maak oop: http://localhost:${PORT}\n`);
});
