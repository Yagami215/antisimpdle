# 🚀 Antisimpdle - GitHub Pages Deployment & Local Editor Guide

This guide explains how to host **Antisimpdle** on GitHub Pages as a daily Wordle-style game and how to maintain the local member editor without uploading it to the website.

---

## 📋 Summary of Files

### ✅ FILES TO UPLOAD TO GITHUB (The Public Game)
These are the only files and folders required for the website to run on GitHub Pages:

| File / Folder | Purpose |
|---|---|
| `index.html` | The main game webpage (Home screen, Classic mode, Modals) |
| `style.css` | Game visual styling, LoLdle theme, animations, dark mode |
| `app.js` | Complete game logic, daily member selection, midnight timer, stats |
| `members.js` / `members.json` | Member database |
| `quotes.js` / `quotes.json` | Quote guessing dataset |
| `emojis.js` / `emojis.json` | Emoji guessing dataset |
| `pictures.js` / `pictures.json` | Picture guessing dataset |
| `cases.js` / `cases.json` | Case opening dataset |
| `members/` | **Folder** containing all member folders, `info.json`, and avatars |
| `slike/` | **Folder** for Picture guessing game images |
| `case opening/` (Public contents) | `common/`, `uncommon/`, `rare/`, `epic/`, `legendary/`, `mythic/`, `secret/`, `orbs/`, `vault/`, `lootbox design.png`, `case open.mov`, `item obtain.mp3` |
| `api/` | Serverless API (`open-case.js`, `media.js`, `_vaultData.json`, `api/vault/`) for Verity/Rainbow server-gated decryption (Vercel) |
| `vercel.json` | Vercel serverless routing configuration |
| `.gitignore` | Prevents local editor files and raw secret media from being uploaded |
| `background.png` & icons | `favicon.ico`, `icon.png`, wallpapers |

---

### 🛑 FILES TO KEEP LOCAL ONLY (EXCLUDED BY `.gitignore`)
These files are only for your local computer to edit member stats and manage categories:

| File / Folder | Reason to Keep Local |
|---|---|
| `case opening/verity/` & `rainbow/` | **Raw unencrypted server-gated source files** (Ignored by `.gitignore`; server decrypts from `api/vault/`) |
| `case opening/divine/`, `HELL/`, `milestones/` | **Raw unencrypted WASM source files** (Ignored by `.gitignore`; decrypted from `case opening/vault/`) |
| `editor.html`, `editor.js`, `editor.css` | The admin editor dashboard |
| `server.py`, `start-editor.bat` | Local Python API server for saving changes to disk |
| `parse_cases.py`, `parse_pictures.py`, `parse_quotes.py` | Local compilation and encryption scripts |
| `init_categories.py`, `members.txt`, `kvotes.txt`, `vault.wat` | Local source files and migration scratch files |
| `start-editor.bat` | Windows shortcut launcher to start the editor |
| `init_categories.py` | Internal migration script |
| `members.txt` | Raw input scratch list |

---

## 🌐 How to Host on GitHub Pages (Step-by-Step)

### Option A: Uploading via GitHub Website (Drag & Drop)
1. Go to [github.com](https://github.com) and log into your account.
2. Click **New** repository.
3. Name it (for example: `antisimpdle`). Set it to **Public**. Click **Create repository**.
4. In the empty repository screen, click **"uploading an existing file"**.
5. Drag and drop the following items from your folder:
   - `index.html`
   - `style.css`
   - `app.js`
   - `members.js`
   - `members.json`
   - `background.png`
   - The entire `members` folder
   - `.gitignore`
6. Click **Commit changes**.
7. In your GitHub repository, click **Settings** (top right gear).
8. In the left sidebar, click **Pages**.
9. Under **Branch**, select `main` (or `master`) and folder `/(root)`, then click **Save**.
10. Wait 1–2 minutes. GitHub will provide your live URL:
    `https://<your-username>.github.io/antisimpdle/`

---

## 🔄 How the Daily Reset Works (100% Automated)
- **Zero Server Maintenance**: No backend, database, or cron job is needed!
- **Universal Synchronization**: A deterministic algorithm (Mulberry32 PRNG + Fisher-Yates cycle permutation) selects the exact same secret member for every player in the world on a given day.
- **Fair Play**: Every member on your server is guaranteed to be chosen exactly once per 76-day cycle before any repeats occur.
- **Midnight Rollover**:
  - A live clock ticks down to midnight in real time (`⏳ Next member in HH:MM:SS`).
  - At midnight (00:00:00), the game automatically refreshes the daily challenge, clears the board, and unlocks the new member for the day.
- **Wordle Streaks & Stats**: Tracks games played, win rate, daily streaks, and guess distribution in browser storage.
- **Practice Mode**: Players who solve today's member can continue playing unlimited random practice members without affecting their daily streak!

---

## 🛠️ How to Edit Members Locally in the Future
Whenever you want to add or update member categories:
1. Double-click `start-editor.bat` on your computer.
2. Edit member categories in your browser at `http://localhost:8000/editor.html`.
3. Click **Save** in the editor. The local server updates `members.json` and `members.js`.
4. Upload **only** the updated `members.js` and `members.json` (and any new avatars in `members/`) to your GitHub repository. The website will immediately update!
