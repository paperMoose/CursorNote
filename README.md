# Markdown WYSIWYG Editor for VS Code

A Notion-like WYSIWYG editor extension for VS Code that makes editing Markdown files feel natural and intuitive.

## What This Is

This is a **VS Code extension** that provides a WYSIWYG (What You See Is What You Get) editing experience for Markdown files. Instead of seeing raw markdown syntax like `**bold**` and `> blockquote`, you see the formatted result directly in the editor - just like Notion or other modern document editors.

## Key Features

✨ **Real-time rendering** - Bold, italic, headers, lists render as you type
📝 **True WYSIWYG** - Edit formatted text directly, no split view needed
⚡ **Auto-sync** - Changes automatically save to your `.md` files
🎨 **GitHub-flavored** - Familiar markdown styling
🌓 **Dark mode** - Adapts to your VS Code theme
🔗 **Footnotes** - Full support for citations `[^1]` with automatic reference linking
💬 **Blockquotes** - Multi-line blockquote support with proper nesting
📋 **Tables** - Visual table editing and rendering
✅ **Task lists** - Interactive checkboxes
🎯 **Inline code** and code blocks with syntax highlighting

## Supported Markdown Features

- Headers (H1-H6)
- **Bold** (`**text**`) and *italic* (`*text*`) formatting
- Bullet and numbered lists with indentation
- Task lists with checkboxes `- [ ]` and `- [x]`
- Blockquotes (multi-line `>`)
- Footnotes and citations `[^id]`
- Links `[text](url)` - clickable to open files
- Inline `code` and code blocks with language hints
- Tables with headers
- Horizontal rules `---`
- Images

## Quick Start

### Install from VSIX (Development)

```bash
# Navigate to the extension directory
cd markdown-wysiwyg

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Package the extension
npx vsce package

# Install the VSIX
code --install-extension markdown-wysiwyg-*.vsix
```

### Use the Extension

1. Open any `.md` file in VS Code
2. Right-click the file tab
3. Select "Reopen Editor With..." → "Markdown WYSIWYG Editor"
4. Start editing!

To set as default for all markdown files:
- Right-click any `.md` file
- "Open With..." → "Configure Default Editor for '*.md'"
- Select "Markdown WYSIWYG Editor"

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd+B` | **Bold** |
| `Ctrl/Cmd+I` | *Italic* |
| `Ctrl/Cmd+1/2/3` | Headers H1/H2/H3 |
| `Ctrl/Cmd+L` | Create list |
| `Tab` | Indent list item/checkbox |
| `Shift+Tab` | Unindent list item/checkbox |
| `Enter` in code block | New line in block |
| `Shift+Enter` in code block | Exit code block |
| `Shift+Enter` in list | Exit list |

## Repository Structure

```
CursorNote/
├── markdown-wysiwyg/        # VS Code extension
│   ├── src/                 # TypeScript source
│   │   ├── extension.ts     # Extension entry point
│   │   └── markdownEditor.ts # Custom editor provider
│   ├── media/               # Web view assets
│   │   ├── editor.js        # Main editor logic
│   │   ├── editor.css       # Styling
│   │   └── modules/         # Modular components
│   ├── out/                 # Compiled JavaScript
│   ├── package.json         # Extension manifest
│   ├── README.md            # Extension documentation
│   └── PUBLISHING.md        # Marketplace publishing guide
├── test-all-features.md     # Feature test file
└── test-table.md            # Table test file
```

## Development

### Prerequisites

- Node.js 16.x or higher
- VS Code 1.74.0 or higher
- TypeScript 4.9+

### Setup

```bash
# Install dependencies
cd markdown-wysiwyg
npm install

# Compile TypeScript
npm run compile

# Watch mode for development
npm run watch
```

### Testing

Press `F5` in VS Code to launch Extension Development Host with your changes loaded.

### Building VSIX

```bash
# Package for distribution
npx vsce package

# This creates: markdown-wysiwyg-X.Y.Z.vsix
```

## Publishing to VS Code Marketplace

See [PUBLISHING.md](markdown-wysiwyg/PUBLISHING.md) for detailed instructions on:
- Creating a publisher account
- Getting an access token
- Publishing your extension
- Updating versions

Quick publish:
```bash
npx vsce login your-publisher-id
npx vsce publish
```

## How It Works

The extension uses VS Code's [Custom Editor API](https://code.visualstudio.com/api/extension-guides/custom-editors) to provide a custom editing experience:

1. **Custom Editor Provider** registers as a handler for `.md` files
2. **Webview** displays the rendered markdown with contenteditable
3. **Markdown Parser** converts markdown → HTML for display
4. **HTML Converter** converts edited HTML back → markdown
5. **Auto-rendering** detects patterns and re-renders on the fly
6. **Cursor preservation** maintains cursor position during re-renders

Key innovations:
- **Zero-latency rendering**: Patterns trigger immediate re-render
- **Intelligent paragraph detection**: Auto-wraps plain text in `<p>` tags
- **Inline markdown processing**: Bold/italic/links processed in all contexts
- **Multi-line blockquotes**: Consecutive `>` lines grouped properly
- **Footnote collection**: Definitions extracted and rendered at document end

## Architecture

```
┌─────────────────────────────────────────────┐
│  VS Code Extension Host                     │
│  ┌───────────────────────────────────────┐  │
│  │  Custom Editor Provider               │  │
│  │  - Handles .md files                  │  │
│  │  - Creates webview                    │  │
│  │  - Syncs with filesystem              │  │
│  └───────────────────────────────────────┘  │
│                    ↕                         │
│  ┌───────────────────────────────────────┐  │
│  │  Webview (editor.js)                  │  │
│  │  ┌─────────────────────────────────┐  │  │
│  │  │ markdownToHtml()                │  │  │
│  │  │ - Parse markdown → HTML         │  │  │
│  │  │ - Process inline formatting     │  │  │
│  │  │ - Handle blockquotes/footnotes  │  │  │
│  │  └─────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────┐  │  │
│  │  │ htmlToMarkdown()                │  │  │
│  │  │ - Convert HTML → markdown       │  │  │
│  │  │ - Preserve structure            │  │  │
│  │  └─────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────┐  │  │
│  │  │ Cursor Management               │  │  │
│  │  │ - Save/restore cursor position  │  │  │
│  │  └─────────────────────────────────┘  │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## Contributing

Contributions welcome! Areas for improvement:
- [ ] More markdown features (definition lists, footnotes with multiple paragraphs)
- [ ] Image paste/upload
- [ ] LaTeX math support
- [ ] Better table editing (add/remove rows/columns)
- [ ] Find and replace
- [ ] Collaborative editing

## License

MIT License - see [LICENSE.txt](markdown-wysiwyg/LICENSE.txt)

## Credits

Built with:
- [VS Code Extension API](https://code.visualstudio.com/api)
- [vsce](https://github.com/microsoft/vscode-vsce) - Extension packaging tool
- TypeScript

---

**Note**: This extension keeps your files as standard `.md` markdown files. You can edit them with any text editor or use the WYSIWYG view - your choice!
