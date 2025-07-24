# Markdown WYSIWYG Editor


A simple, reliable VS Code extension that provides a Notion-like WYSIWYG editing experience for Markdown files.

## Features


- **True WYSIWYG editing** - Edit formatted text directly, no split view needed
- **Real-time sync** - Changes are automatically saved to your .md file
- **Clean, minimal UI** - GitHub-flavored markdown styling
- **Dark mode support** - Automatically adapts to your VS Code theme
- **Floating toolbar** - Easy access to formatting options
- **Cursor AI compatible** - Works seamlessly with Cursor's AI features

## Supported Markdown


- **Headers** (H1-H3)
- **Bold** and **italic** text
- **Lists** (bullet points)
- **Checkboxes** (task lists)
- **Code blocks** and `inline code`
- **Blockquotes**
- **Horizontal rules**

## Keyboard Shortcuts


- **Ctrl/Cmd+B** - Bold
- **Ctrl/Cmd+I** - Italic
- **Ctrl/Cmd+1/2/3** - Headers
- **Ctrl/Cmd+L** - List
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
- **Option **: Right-click → "Open With... → Text Editor" for raw markdown

## Development


```
bash
npm install
npm run compile

```


Press F5 in VS Code to test the extension.

## License


MIT