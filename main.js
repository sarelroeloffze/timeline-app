/**
 * Timeline App — Electron main process
 * =====================================
 * Replaces server.py: serves index.html + provides Claude API proxy via IPC.
 * Also runs a lightweight local HTTP server so that index.html's fetch('/api/claude')
 * continues to work without modification.
 */

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const http = require('http');
const fs   = require('fs');

// ─── Claude API backend (replaces server.py) ────────────────────────────────

let Anthropic;
try {
  Anthropic = require('@anthropic-ai/sdk');
} catch {
  Anthropic = null;
}

const SYSTEM_TEMPLATE = `You are an AI assistant built into a historical timeline app. \
You help users research, explore, and populate their timeline with people and events.

**Current timeline data:**
{context}

**Your capabilities:**
- Answer questions about historical people, events, and time periods
- Suggest people or events to add to the timeline
- Edit or improve existing entries (update roles, dates, descriptions)
- Analyse patterns, connections, and gaps in the existing data
- Date format: negative integers = BC (e.g. -44 = 44 BC), positive = AD, or ISO "YYYY-MM-DD"

**When proposing to ADD a PERSON**, output a JSON code block:
\`\`\`json
{"action":"add_person","name":"Julius Caesar","birth":-100,"death":-44,"role":"Roman general and dictator","color":"#f59e0b"}
\`\`\`

**When proposing to ADD an EVENT**, output a JSON code block:
\`\`\`json
{"action":"add_event","title":"Battle of Actium","start":-31,"end":null,"description":"Naval battle that ended the Roman Republic.","category":"Historical"}
\`\`\`

**When proposing to EDIT an existing PERSON** (use the exact id from context), output:
\`\`\`json
{"action":"edit_person","id":"p2","name":"Marie Curie","birth":"1867-11-07","death":"1934-07-04","role":"Physicist, chemist, first woman to win Nobel Prize","color":"#22d3ee"}
\`\`\`

**When proposing to EDIT an existing EVENT** (use the exact id from context), output:
\`\`\`json
{"action":"edit_event","id":"21","title":"Birth of Jesus","start":-4,"description":"Jesus is born in Bethlehem, circa 4 BC.","category":"Religion"}
\`\`\`

Only include fields you want to change in edit blocks — omit unchanged fields.
Available categories: Religion, Politics, Science, Aviation, Historical, Award, Personal.
Color suggestions — gold #f59e0b, purple #c084fc, cyan #22d3ee, red #f87171, green #4ade80, blue #60a5fa, orange #fb923c.

You may propose multiple actions in one response — give a short explanation first, then the JSON block(s).
Do NOT propose ADD actions for people or events that are already in the timeline.
Keep replies focused and concise.`;

function fmtYear(y) {
  if (y == null) return '?';
  if (typeof y === 'number') {
    return y <= 0 ? `${Math.abs(y)} BC` : `${y} AD`;
  }
  return String(y).slice(0, 10);
}

function buildSystemPrompt(context) {
  const people = context.people || [];
  const events = context.events || [];
  const eras   = context.eras   || [];
  const ctxLines = [];

  if (people.length) {
    ctxLines.push(
      `People (${people.length}):\n` +
      people.map(p =>
        `  [${p.id || '?'}] ${p.name || '?'} (${fmtYear(p.birth)}–${fmtYear(p.death)}) — ${p.role || ''}`
      ).join('\n')
    );
  } else {
    ctxLines.push('People: none added yet');
  }

  if (events.length) {
    ctxLines.push(
      `Events (${events.length}):\n` +
      events.map(e => {
        const endPart = e.end ? `-${fmtYear(e.end)}` : '';
        const descPart = e.description ? ` -- ${String(e.description).slice(0, 80)}` : '';
        return `  [${e.id || '?'}] ${e.title || '?'} (${fmtYear(e.start)}${endPart}) [${e.category || ''}]${descPart}`;
      }).join('\n')
    );
  } else {
    ctxLines.push('Events: none added yet');
  }

  if (eras.length) {
    ctxLines.push(
      'Time periods: ' +
      eras.map(e => `${e.label || '?'} (${e.yearStart}–${e.yearEnd || 'present'})`).join(', ')
    );
  }

  return SYSTEM_TEMPLATE.replace('{context}', ctxLines.join('\n'));
}

// ─── Local HTTP server (so index.html fetch('/api/claude') works) ───────────

let apiKey = process.env.ANTHROPIC_API_KEY || '';

function createLocalServer() {
  const server = http.createServer(async (req, res) => {
    // Serve index.html at root
    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
      const htmlPath = path.join(__dirname, 'index.html');
      const html = fs.readFileSync(htmlPath, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    // Health endpoint
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', key_set: !!apiKey }));
      return;
    }

    // Claude API proxy
    if (req.method === 'POST' && req.url === '/api/claude') {
      let body = '';
      for await (const chunk of req) body += chunk;

      if (!Anthropic) {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        });
        res.write(`data: ${JSON.stringify({ type: 'error', message: 'Anthropic SDK not available. Run npm install first.' })}\n\n`);
        res.end();
        return;
      }

      if (!apiKey) {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        });
        res.write(`data: ${JSON.stringify({ type: 'error', message: 'ANTHROPIC_API_KEY not set. Set it in Settings or as environment variable.' })}\n\n`);
        res.end();
        return;
      }

      let parsed;
      try { parsed = JSON.parse(body); } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
        return;
      }

      const messages = parsed.messages || [];
      const context  = parsed.context  || {};
      const system   = buildSystemPrompt(context);

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      });

      try {
        const client = new Anthropic({ apiKey });
        const stream = client.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 4096,
          system,
          messages,
        });

        stream.on('text', (text) => {
          res.write(`data: ${JSON.stringify({ type: 'text', text })}\n\n`);
        });

        stream.on('end', () => {
          res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
          res.end();
        });

        stream.on('error', (err) => {
          res.write(`data: ${JSON.stringify({ type: 'error', message: String(err) })}\n\n`);
          res.end();
        });
      } catch (err) {
        res.write(`data: ${JSON.stringify({ type: 'error', message: String(err) })}\n\n`);
        res.end();
      }
      return;
    }

    // Serve static files from the app directory
    const safePath = path.join(__dirname, req.url.split('?')[0]);
    if (fs.existsSync(safePath) && fs.statSync(safePath).isFile()) {
      const ext = path.extname(safePath).toLowerCase();
      const mimeTypes = {
        '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
        '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
      };
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(safePath).pipe(res);
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      console.log(`Local server running on http://127.0.0.1:${port}`);
      resolve(port);
    });
  });
}

// ─── Electron window ────────────────────────────────────────────────────────

let mainWindow;

async function createWindow() {
  const port = await createLocalServer();

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'Timeline',
    backgroundColor: '#0a0f1e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    // Remove default menu bar on Windows/Linux
    autoHideMenuBar: true,
  });

  // Load from local server so fetch('/api/claude') works
  mainWindow.loadURL(`http://127.0.0.1:${port}`);

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ─── IPC handlers ───────────────────────────────────────────────────────────

ipcMain.handle('get-api-key', () => apiKey);

ipcMain.handle('set-api-key', (_event, key) => {
  apiKey = key;
  process.env.ANTHROPIC_API_KEY = key;
  return true;
});

ipcMain.handle('show-open-dialog', async (_event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-save-dialog', async (_event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

// ─── Backup folder operations ───────────────────────────────────────────────

ipcMain.handle('choose-backup-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Choose Backup Folder',
    buttonLabel: 'Select Folder',
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

ipcMain.handle('write-backup-file', async (_event, folderPath, filename, jsonContent) => {
  try {
    const filePath = path.join(folderPath, filename);
    fs.writeFileSync(filePath, jsonContent, 'utf-8');
    return { success: true, path: filePath };
  } catch (err) {
    return { success: false, error: String(err) };
  }
});

ipcMain.handle('list-backup-files', async (_event, folderPath, timelineName) => {
  try {
    if (!fs.existsSync(folderPath)) return [];
    const allFiles = fs.readdirSync(folderPath);
    // Match pattern: {timelineName}-backup-*.json
    const pattern = `${timelineName}-backup-`;
    const backups = allFiles
      .filter(f => f.startsWith(pattern) && f.endsWith('.json'))
      .map(f => ({
        name: f,
        path: path.join(folderPath, f),
        stat: fs.statSync(path.join(folderPath, f)),
      }))
      .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs); // newest first
    return backups.map(b => ({ name: b.name, path: b.path, mtime: b.stat.mtimeMs }));
  } catch (err) {
    console.error('list-backup-files error:', err);
    return [];
  }
});

ipcMain.handle('delete-backup-files', async (_event, filePaths) => {
  try {
    for (const filePath of filePaths) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
});

// ─── App lifecycle ──────────────────────────────────────────────────────────

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
