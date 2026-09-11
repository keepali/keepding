<div align="center">

# Keepding

**A fast, offline-first personal memo board and bookmark manager for Google Chrome.**  
*Inspired by the speed and simplicity of Linkding, and the visual flow of Google Keep.*

[English](README.md) | [简体中文](README.zh-CN.md)

<p align="center">
  <img src="public/icons/icon.svg" width="80" height="80" alt="Keepding Logo" />
</p>

[![Chrome Manifest V3](https://img.shields.io/badge/Manifest-V3-18181b.svg?style=flat-square)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![License: MIT](https://img.shields.io/badge/License-MIT-18181b.svg?style=flat-square)](LICENSE)

</div>

---

## Key Highlights

- **100% Offline & Private**: All notes, bookmarks, images, and text clips are stored exclusively on your local machine using browser IndexedDB. Zero cloud telemetry, zero remote tracking.
- **Card-Based Stream (Keep + Linkding)**:
  - Markdown notes and quotes are rendered directly on cards rather than hidden behind collapse menus.
  - Quick note creation bar at the top of the dashboard for capturing thoughts on the fly.
  - Pin important cards (`📌`) to the top of your stream.
- **Multi-Modal Web Capture**:
  - **Links**: Save webpage or right-click any link to bookmark.
  - **Text Clips**: Highlight text on any page, right-click *"Save selection to note"*, or open the popup (`Cmd+Shift+L`) to auto-capture quotes.
  - **Images**: Right-click any image on the web and select *"Save image to note"* to save visual clips directly with source page attribution.
- **Full Internationalization (i18n)**:
  - English by default, with one-click toggle to Chinese (`EN / 中文`).
  - Right-click context menus automatically follow your selected language.
- **Fast Search & Syntax**:
  - Real-time instant filtering across notes, titles, URLs, and tags.
  - Query syntax support: `#tag`, `!unread`, `!note`, `!image`, and `site:domain`.
- **Lossless Import & Export**:
  - Full JSON backups (including notes, images, tags, timestamps).
  - Standard Netscape HTML bookmarks (compatible with Chrome, Firefox, Safari, Pocket, Raindrop).

---

## Installation

### Load Unpacked (Chrome Developer Mode)

1. Clone the repository:
   ```bash
   git clone git@github.com:keepali/keepding.git
   cd keepding
   ```

2. Install dependencies and build:
   ```bash
   pnpm install
   npm run build
   ```

3. Load the extension in Chrome:
   - Open `chrome://extensions` in your browser.
   - Toggle **Developer mode** in the upper-right corner.
   - Click **Load unpacked** and select the `dist/` directory inside this project.

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Cmd+Shift+L` / `Ctrl+Shift+L` | Open quick bookmark & note popup |
| `Cmd+Shift+O` / `Ctrl+Shift+O` | Open full library dashboard |
| `Cmd+S` / `Ctrl+S` | Save bookmark (inside popup) |
| `/` or `Cmd+K` | Focus search bar (inside dashboard) |
| `Esc` | Close modal or clear search query |

---

## Development

```bash
# Start Vite in watch mode
npm run dev

# Run automated tests
npm test

# Build production bundle and package Chrome Web Store zip
npm run package
```

---

## License

[MIT](LICENSE) © [keepali](https://github.com/keepali)
