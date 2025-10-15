# Markdown WYSIWYG Editor

A Notion-like WYSIWYG editor for VS Code that makes editing Markdown files natural and intuitive.

## Features

✨ **Real-time rendering** - See formatting as you type
📝 **True WYSIWYG** - Edit formatted text directly, no split view
⚡ **Auto-sync** - Changes automatically save to `.md` files
🎨 **GitHub-flavored** - Familiar markdown styling
🌓 **Dark mode** - Adapts to your VS Code theme
🔗 **Footnotes** - Full citation support with automatic reference linking
💬 **Blockquotes** - Multi-line blockquote support
📋 **Tables** - Visual table editing and rendering
✅ **Task lists** - Interactive checkboxes
🎯 **Smart rendering** - Auto-renders markdown patterns on the fly

## Supported Markdown

- **Headers** (H1-H6)
- **Bold** (`**text**` or `__text__`) and *italic* (`*text*` or `_text*`) formatting
- **Bullet lists** and **numbered lists** with indentation
- **Task lists** with interactive checkboxes `- [ ]` and `- [x]`
- **Blockquotes** - Multi-line with `>` prefix
- **Footnotes** - References `[^id]` and definitions `[^id]: text`
- **Links** `[text](url)` - Click to open files/URLs
- **Inline code** `` `code` `` and code blocks with language hints
- **Tables** with headers and borders
- **Horizontal rules** `---`
- **Images** `![alt](url)`
- **Strikethrough** `~~text~~`

## Keyboard Shortcuts


- **Ctrl/Cmd+B** - Bold
- **Ctrl/Cmd+I** - Italic
- **Ctrl/Cmd+1/2/3** - Headers
- **Ctrl/Cmd+L** - List
- **Tab** - Indent list item or checkbox
- **Shift+Tab** - Unindent list item or checkbox
- **Enter** in code block - New line
- **Shift+Enter** in code block - Exit code block
- **Shift+Enter** in list - Exit list

## Usage


1. Install the extension
2. Open any `.md` file
3. Click "Open With..." and select "Markdown WYSIWYG Editor"
4. Start editing!

To make it the default editor for all markdown files:
- Right-click a `.md` file
- Select "Open With... > Configure Default Editor"
- Choose "Markdown WYSIWYG Editor"

## Working with Cursor AI


Your files remain as `.md` files. To edit with Cursor AI:
- **Option 1**: Tell Cursor what you want (e.g., "add a table of contents")
- **Option 2**: Right-click → "Open With... → Text Editor" for raw markdown

## Development

```bash
npm install
npm run compile
```


Press F5 in VS Code to test the extension.

## License


MIT