# AI Agent Instructions - Tashi Email Client

This document provides guidance for AI coding agents (Kimi, Claude, etc.) working on this repository.

> **📚 Looking for comprehensive context?** Check the [`.context/`](.context/) folder for detailed documentation on:
> - [Project Overview](.context/project/overview.md)
> - [Architecture](.context/codebase/architecture.md)
> - [Development Workflows](.context/development/workflows.md)
> - [Coding Conventions](.context/codebase/conventions.md)

## Quick Reference

| Context | Location |
|---------|----------|
| **Project Overview** | [`.context/project/overview.md`](.context/project/overview.md) |
| **Tech Stack** | [`.context/project/tech-stack.md`](.context/project/tech-stack.md) |
| **Architecture** | [`.context/codebase/architecture.md`](.context/codebase/architecture.md) |
| **Directory Structure** | [`.context/codebase/structure.md`](.context/codebase/structure.md) |
| **Coding Conventions** | [`.context/codebase/conventions.md`](.context/codebase/conventions.md) |
| **Development Setup** | [`.context/development/setup.md`](.context/development/setup.md) |
| **Commands** | [`.context/development/commands.md`](.context/development/commands.md) |
| **Testing** | [`.context/development/testing.md`](.context/development/testing.md) |
| **Git Workflows** | [`.context/development/workflows.md`](.context/development/workflows.md) |
| **Branding** | [`.context/project/branding.md`](.context/project/branding.md) |

## 🏗️ Repository Structure

This is a **fork** of the Velo email client with custom branding. The repository uses a dual-branch strategy:

| Branch | Purpose | Tracks | Do Not Modify |
|--------|---------|--------|---------------|
| `main` | Clean upstream sync | `upstream/main` (original Velo) | Rebrand changes |
| `tashi` | Custom branded version | Your custom changes | Direct upstream commits |

### Remotes
- **`origin`** → `https://github.com/os7borne/tashi.git` (your fork)
- **`upstream`** → `https://github.com/avihaymenahem/velo.git` (original Velo)

---

## 🔄 Syncing with Original Developer

To get latest updates from the original Velo repository:

```bash
# 1. Fetch latest from original developer
git checkout main
git pull upstream main

# 2. Push clean main to your fork
git push origin main

# 3. Merge updates into your custom branch
git checkout tashi
git merge main

# 4. Resolve conflicts if any, then push
git push origin tashi
```

---

## 🛠️ Building the App

### Build Tashi (Custom Branded)
```bash
git checkout tashi
npm install
npm run tauri build
```

### Build Original Velo
```bash
git checkout main
npm install
npm run tauri build
```

### Development Mode
```bash
git checkout tashi  # or main
npm run tauri dev
```

---

## 🎨 Rebrand Changes (Tashi Branch)

The following changes have been made to create the Tashi brand:

### Core Configuration
| File | Change |
|------|--------|
| `package.json` | `"name": "tashi"` |
| `src-tauri/Cargo.toml` | `name = "tashi"` |
| `src-tauri/tauri.conf.json` | `productName: "Tashi"`, `identifier: "com.tashi.app"`, `sqlite:tashi.db` |

### UI/UX Changes
| File | Change |
|------|--------|
| `src/styles/globals.css` | Flat design (#fafafa light, #0f172a dark), subtle dot pattern instead of gradient blobs |
| `splashscreen.html` | Solid background, "Tashi" title |
| `src/components/email/CategoryTabs.tsx` | Solid color fades instead of gradients |

### User-Facing Text
| File | Change |
|------|--------|
| `index.html` | `<title>Tashi</title>` |
| `src/components/layout/TitleBar.tsx` | "Tashi" window title |
| `src/components/settings/SettingsPage.tsx` | App name, links to tashi.app, copyright |
| `src/services/notifications/notificationManager.ts` | `"Tashi"` notification title |
| `src/services/badgeManager.ts` | `Tashi - X unread` tooltip |
| `src-tauri/src/lib.rs` | Tray menu "Show Tashi", tooltip "Tashi" |
| `src-tauri/src/oauth.rs` | OAuth success page "Tashi" |

### Documentation
| File | Change |
|------|--------|
| `README.md` | Updated links to os7borne/tashi, flat design description |
| `LICENSE` | Copyright "Tashi" |

---

## ⚠️ Agent Guidelines

### When working on `tashi` branch:
✅ **DO:**
- Make UI/UX customizations
- Add new features
- Fix bugs
- Update branding
- Modify the flat design
- Add custom color schemes

❌ **DON'T:**
- Directly pull from upstream here (use merge from main)
- Revert the rebrand changes
- Change core app identifier (unless explicitly asked)

### When working on `main` branch:
✅ **DO:**
- Sync with upstream: `git pull upstream main`
- Push to origin: `git push origin main`
- Test that vanilla Velo builds

❌ **DON'T:**
- Make any custom changes here
- Modify branding
- Add tashi-specific features
- Commit directly (always sync from upstream)

---

## 📝 Common Tasks

### Add a new feature to Tashi
```bash
git checkout tashi
git merge main  # ensure latest upstream first
# make your changes
git add .
git commit -m "feat: description"
git push origin tashi
```

### Update Tashi with latest Velo changes
```bash
git checkout main
git pull upstream main
git push origin main
git checkout tashi
git merge main
# resolve conflicts if any
git push origin tashi
```

### Check which branch you're on
```bash
git branch --show-current
```

---

## 🔧 Tech Stack (Both Branches)

| Component | Technology |
|-----------|------------|
| Framework | Tauri v2 (Rust) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| State | Zustand 5 |
| Editor | TipTap v3 |
| Email | Gmail API, IMAP/SMTP (async-imap + lettre) |
| Database | SQLite + FTS5 |

---

## 🐛 Troubleshooting

### "This is the Velo repo, not Tashi"
→ You're on `main` branch. Run: `git checkout tashi`

### "My changes disappeared"
→ Check which branch you're on: `git branch`

### "Can't push to main"
→ You shouldn't push custom changes to main. Switch to tashi: `git checkout tashi`

### "Conflicts when merging main into tashi"
→ This is expected when upstream changes files you modified. Resolve by:
1. Keeping your Tashi branding changes
2. Accepting upstream's feature changes
3. Test the build after resolution

---

## 📦 Build Outputs

After `npm run tauri build`:

| Platform | Output Path |
|----------|-------------|
| macOS | `src-tauri/target/release/bundle/dmg/` |
| Windows | `src-tauri/target/release/bundle/msi/` |
| Linux | `src-tauri/target/release/bundle/deb/` |

---

*Last updated: March 2026*
*For questions about the original Velo project, see: https://github.com/avihaymenahem/velo*
