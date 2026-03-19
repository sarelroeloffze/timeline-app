# Timeline App — Building Desktop Installers

## Quick Start (Local Build)

### Prerequisites
- **Node.js 18+** — download from [nodejs.org](https://nodejs.org)
- **npm** — comes with Node.js

### Build on Windows
```cmd
cd timeline
build.bat
```
This produces `dist/Timeline Setup 1.0.0.exe` — a Windows installer.

### Build on macOS
```bash
cd timeline
chmod +x build.sh
./build.sh mac
```
This produces `dist/Timeline-1.0.0.dmg` and `dist/Timeline-1.0.0-mac.zip`.

### Build Both Platforms
- **Windows .exe** can be built from Windows or Linux (with Wine)
- **macOS .dmg** can only be built on macOS
- **macOS .zip** can only be built on macOS

---

## Cloud Build (GitHub Actions) — Recommended

The easiest way to build for **both** platforms is using GitHub Actions, which provides both Windows and macOS build machines for free.

### Setup Steps

1. **Create a GitHub repository** and push the timeline folder contents:
   ```bash
   cd timeline
   git init
   git add -A
   git commit -m "Initial commit"
   gh repo create timeline-app --private --push --source .
   ```

2. **Trigger a build** — push to `main` or go to Actions → "Build Timeline App" → "Run workflow"

3. **Download installers** — after the build completes (~5 min), go to the Actions run and download:
   - `Timeline-Windows` — contains the `.exe` installer
   - `Timeline-macOS` — contains `.dmg` and `.zip`

### Creating a Release

Tag a version to auto-create a GitHub Release with both installers:
```bash
git tag v1.0.0
git push origin v1.0.0
```

---

## Development Mode

Run the app without building an installer:
```bash
npm install
npm start
```

---

## Project Structure (Electron)

```
timeline/
  main.js              ← Electron main process (replaces server.py)
  preload.js           ← Secure IPC bridge for renderer
  index.html           ← The timeline app (unchanged)
  licenseValidator.js  ← License key validation
  icon.png             ← App icon (512×512)
  package.json         ← Dependencies + build config
  build.sh             ← macOS/Linux build script
  build.bat            ← Windows build script
  .github/
    workflows/
      build.yml        ← GitHub Actions CI/CD
  server.py            ← Original Python backend (not used by Electron)
  requirements.txt     ← Python deps (not used by Electron)
```

### How Electron Replaces server.py

The Python backend (`server.py`) did two things:
1. Serve `index.html`
2. Proxy requests to the Claude API (`/api/claude` endpoint)

In the Electron version, `main.js` does both — it runs a local HTTP server inside the app so that `index.html`'s `fetch('/api/claude')` calls continue to work without any changes to the frontend code.

The Claude API key is read from the `ANTHROPIC_API_KEY` environment variable, same as before.

---

## Setting the API Key

The app reads `ANTHROPIC_API_KEY` from environment variables:

**Windows:**
```cmd
set ANTHROPIC_API_KEY=sk-ant-...
npm start
```

**macOS/Linux:**
```bash
export ANTHROPIC_API_KEY=sk-ant-...
npm start
```

For the built installer, set the environment variable system-wide or in a shortcut.
