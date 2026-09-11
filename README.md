# Pinscribe

A fast, offline-first bookmark manager with Markdown notes for Google Chrome.

[![Chrome Manifest V3](https://img.shields.io/badge/Manifest-V3-18181b.svg?style=flat-square)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![License: MIT](https://img.shields.io/badge/License-MIT-18181b.svg?style=flat-square)](LICENSE)

---

## Features

- **Offline & Private**: All data is stored locally in your browser via IndexedDB. Zero network requests, zero external analytics.
- **Quick Bookmark**: Press `Cmd+Shift+L` (or `Ctrl+Shift+L`) to save the active tab. Auto-populates title and URL, supports Markdown notes with live preview, and tag suggestions.
- **Library Dashboard**: Clean desktop-grade manager with unread queue, archive, and tag cloud.
- **Instant Search**: Full-text search across titles, URLs, tags, and Markdown notes. Supports query syntax (`#tag`, `!unread`, `!archived`, `site:domain`).
- **Import & Export**: Standard Netscape HTML bookmarks (compatible with Chrome, Firefox, Safari, Pocket, Raindrop) and lossless JSON backups.

---

## Installation

### From Source

1. Clone or download the repository:
   ```bash
   git clone git@github.com:keepali/pinscribe.git
   cd pinscribe
   ```

2. Install dependencies and build:
   ```bash
   pnpm install
   npm run build
   ```

3. Load the extension in Chrome:
   - Open `chrome://extensions` in your browser.
   - Enable **Developer mode** in the top right.
   - Click **Load unpacked** and select the `dist/` directory inside this project.

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Cmd+Shift+L` / `Ctrl+Shift+L` | Open quick bookmark popup |
| `Cmd+Shift+O` / `Ctrl+Shift+O` | Open library manager |
| `Cmd+S` / `Ctrl+S` | Save bookmark (inside popup) |
| `/` or `Cmd+K` | Focus search bar (in library) |
| `Esc` | Close modal or clear search |

---

## Development

```bash
# Start Vite watch mode
npm run dev

# Run test suite
npm test

# Build production bundle and Chrome Web Store zip
npm run package
```

---

## License

MIT
