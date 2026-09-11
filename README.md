# Keepding

A fast, offline-first personal library and memo board for Google Chrome. Inspired by the clarity of Linkding and the visual flow of Google Keep.

[![Chrome Manifest V3](https://img.shields.io/badge/Manifest-V3-18181b.svg?style=flat-square)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![License: MIT](https://img.shields.io/badge/License-MIT-18181b.svg?style=flat-square)](LICENSE)

---

## Highlights

- **Offline & Local-First**: All bookmarks, notes, images, and clips are stored securely in browser IndexedDB. Zero cloud tracking, zero network dependencies.
- **Keep + Linkding Card Flow**:
  - Notes are displayed directly on cards with Markdown formatting (blockquotes, code blocks, lists).
  - Quick note creation bar at the top of the dashboard for capturing thoughts on the fly.
  - Pin important cards (`📌`) to the top of your stream.
- **Multi-Modal Web Capture**:
  - **Links**: Save webpage or right-click any link to bookmark.
  - **Text Clips**: Highlight text on any page, right-click *"收藏选中文本到笔记"*, or open the popup to auto-capture quotes.
  - **Images**: Right-click any image on the web and choose *"收藏图片到笔记"* to save the visual clip directly to your collection.
- **Fast Search & Syntax**: Real-time filtering across notes, titles, URLs, and tags. Supports `#tag`, `!unread`, `!note`, `!image`, and `site:domain`.
- **Lossless Import & Export**: Full JSON backups and standard Netscape HTML bookmarks (compatible with Chrome, Firefox, Safari, Pocket, Raindrop).

---

## Installation

### From Source

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
   - Go to `chrome://extensions`.
   - Enable **Developer mode** in the top right.
   - Click **Load unpacked** and select the `dist/` directory.

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Cmd+Shift+L` / `Ctrl+Shift+L` | Open quick bookmark popup |
| `Cmd+Shift+O` / `Ctrl+Shift+O` | Open library memo board |
| `Cmd+S` / `Ctrl+S` | Save in popup |
| `/` or `Cmd+K` | Focus search bar (in library) |
| `Esc` | Close modal or clear search |

---

## Development

```bash
# Watch mode
npm run dev

# Tests
npm test

# Build production bundle and Chrome Web Store zip
npm run package
```

---

## License

MIT
