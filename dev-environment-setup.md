# Family Feud — Dev Environment Setup & Teardown (Windows)

Instructions to turn a non-developer **Windows** machine into one that can build and run the Family Feud app (React + Vite), and to **cleanly reverse every change** afterwards so the machine returns to its original state.

> **Read this first.** The app needs exactly one core runtime: **Node.js** (which includes **npm**). Everything else is project-local — installed *inside the project folder* by `npm install` and removed simply by deleting that folder. The only system-wide change is Node.js itself.

> ⚠️ **MANUAL-INTERVENTION POINTS** are flagged with 🔶 throughout. Have the human review those rather than letting the agent run them unattended.

---

## 0. What actually gets installed (mental model)

| Thing | Scope | How it's removed |
|---|---|---|
| **Node.js + npm** | System-wide | Uninstall Node (steps below) |
| **nvm-windows** (version manager) — *recommended* | System-wide (per-user) | Uninstall it; Node goes with it |
| Project dependencies (`node_modules`) | **Project folder only** | Delete the project folder |
| Global npm packages | System-wide | Only created if you run `npm i -g …` — this project needs **none** |

**Key principle:** if you use nvm-windows and install **zero global packages**, teardown is trivial — uninstall nvm-windows, delete the project folder, done. This guide takes that path.

🔶 **Decide before starting:** does the human already have Node.js installed for other reasons? Open a terminal and run `node -v`. If it prints a version and they rely on it elsewhere, **do not uninstall Node during teardown** — skip that step. The teardown section assumes Node was installed *for this project*.

🔶 **Terminal choice:** use **Windows PowerShell** (or Windows Terminal). Some commands below are PowerShell-specific. Run as a normal user unless a step says otherwise.

---

## 1. Setup

### Recommended: install Node via nvm-windows

```powershell
# 1. Install nvm-windows using winget (built into Windows 10/11)
winget install CoreyButler.NVMforWindows

# 2. OPEN A NEW TERMINAL so PATH updates take effect, then:
nvm install lts
nvm use lts

# 3. Verify
node -v
npm -v
```

🔶 **If `winget` is not available** (older Windows, or it returns "not recognized"): download `nvm-setup.exe` manually from the nvm-windows releases page (github.com/coreybutler/nvm-windows/releases) and run the installer GUI. Let the human click through it — it asks where to install nvm and the Node symlink; the defaults are fine.

🔶 **Conflict check:** nvm-windows should be installed while no other Node is present. If `node -v` already printed a version *before* this step, the human should decide whether to uninstall that existing Node first (Settings → Apps → "Node.js" → Uninstall) to avoid PATH conflicts. Do not do this automatically.

*Alternative (direct installer):* download the LTS `.msi` from nodejs.org and run it. Simpler to install, but teardown means uninstalling via Settings → Apps, and you can't easily switch Node versions later. nvm-windows is preferred.

---

## 2. Create & install the project

Once `node -v` and `npm -v` both report versions:

```powershell
# From the folder where you want the project to live:
npm create vite@latest family-feud -- --template react
cd family-feud
npm install            # installs React, Vite, etc. into .\node_modules

# If the blueprint opts to use a state library (optional):
# npm install zustand

# Generate the questions data (per the blueprint):
node scripts/parse-questions.mjs

# Run it:
npm run dev            # http://localhost:5173
```

🔶 **Do not run `npm install -g <anything>`.** Keeping all dependencies project-local is what makes teardown clean. If the agent thinks a global package is needed, it should flag it to the human first.

**Network note:** `npm install` downloads packages from the public npm registry, so the machine needs internet access during setup. Nothing is sent out beyond standard package fetches.

---

## 3. Teardown — return the machine to its original state

Do these in order. Steps 1–2 are always safe; step 3 (removing Node) is conditional.

### Step 1 — Delete the project (always safe)

```powershell
# Removes the app AND all its local dependencies (node_modules) in one go.
cd ..
Remove-Item -Recurse -Force family-feud
```

That single deletion reverses everything `npm install` did. Nothing from the project is left on the system.

### Step 2 — Clear the npm cache (optional tidiness)

```powershell
npm cache clean --force
# Cache location if you'd rather delete it by hand:
#   %AppData%\npm-cache   (paste into File Explorer address bar)
```

### Step 3 — Remove Node.js 🔶 (ONLY if it was installed for this project)

🔶 **Skip this entirely if the human had Node before, or wants to keep it.** Confirm first.

**If you used nvm-windows:**
```powershell
nvm uninstall lts
# Then remove nvm-windows itself:
winget uninstall CoreyButler.NVMforWindows
#   (or: Settings → Apps → "NVM for Windows" → Uninstall)
```

**If you used the direct .msi installer:**
🔶 Manual: Settings → Apps → "Node.js" → Uninstall. Have the human do this through the GUI.

### Step 4 — Verify the machine is clean

```powershell
node -v      # should report "not recognized" if Node was removed
npm -v       # same
```

If both report "not recognized" (and you intended to remove Node), and the project folder is gone, the machine is back to its pre-project state.

---

## 4. Summary checklist

**Setup**
- [ ] Check for existing Node (`node -v`) — 🔶 decide whether to preserve it
- [ ] Install nvm-windows (winget, or 🔶 manual .exe)
- [ ] Open a NEW terminal, then `nvm install lts` / `nvm use lts`
- [ ] Verify `node -v` and `npm -v`
- [ ] Scaffold project, `npm install`, generate questions, `npm run dev`

**Teardown**
- [ ] Delete the project folder (removes node_modules)
- [ ] (Optional) clear npm cache
- [ ] 🔶 Uninstall Node + nvm-windows **only if installed for this project**
- [ ] Verify `node`/`npm` are gone

---

*Companion to `family-feud-blueprint.md`. This guide concerns the environment only; the blueprint concerns the application.*
