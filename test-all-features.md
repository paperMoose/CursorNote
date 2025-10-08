# Comprehensive Markdown Test

This document tests all markdown features now supported by the editor.

## Headers

### H3 Header
#### H4 Header
##### H5 Header
###### H6 Header

## Inline Formatting

**Bold text** and __also bold__
*Italic text* and _also italic_
~~Strikethrough text~~
`Inline code`
**Bold with *nested italic***
Mix of **bold**, *italic*, ~~strikethrough~~, and `code`

## Links and Images

[Link to example](https://example.com)
![Alt text for image](https://via.placeholder.com/150)

## Escape Sequences

You can escape special characters: \*not italic\* \*\*not bold\*\* \`not code\` \[not a link\]

## Lists

### Unordered Lists

- First item
- Second item
- Third item
  - Indented item
  - Another indented
    - Double indented

### Ordered Lists

1. First numbered item
2. Second numbered item
3. Third numbered item
  1. Indented numbered
  2. Another indented
    1. Double indented

### Checkboxes

- [ ] Todo item
- [x] Completed item
- [ ] Another todo
  - [ ] Indented checkbox
  - [x] Completed indented

### Mixed List Content

- List with **bold** and *italic*
- List with `code` inline
- List with [links](https://example.com)

## Code Blocks

Basic code block:
```
function hello() {
  console.log("Hello");
}
```

Code block with language hint:
```javascript
function hello() {
  console.log("Hello, World!");
  return true;
}
```

## Tables

### Simple Table

| Column 1 | Column 2 | Column 3 |
| --- | --- | --- |
| Data 1 | Data 2 | Data 3 |
| More 1 | More 2 | More 3 |

### Table with Inline Formatting

| Feature | Status | Example |
| --- | --- | --- |
| **Bold** | *Supported* | Use `**text**` |
| *Italic* | ~~Not working~~ | Use `*text*` |
| `Code` | **Yes** | Use backticks |
| [Links](https://example.com) | Working | `[text](url)` |
| ~~Strikethrough~~ | **New!** | Use `~~text~~` |

### Complex Table

| Syntax | Rendered | Notes |
| --- | --- | --- |
| `**bold**` | **bold** | Strong emphasis |
| `*italic*` | *italic* | Emphasis |
| `~~strike~~` | ~~strike~~ | Deleted text |
| `` `code` `` | `code` | Inline code |
| `[link](url)` | [link](https://example.com) | Hyperlink |

## Blockquotes

> This is a blockquote
> It can span multiple lines

> Blockquote with **bold** and *italic*

## Horizontal Rules

---

## Edge Cases

### Bold and Italic Together

***Bold and italic***
**Bold with *italic inside***
*Italic with **bold inside***

### Code with Special Characters

`console.log("<script>")`
`x = a && b || c`
`if (x > 0 && y < 10)`

### Table with Pipes in Code

| Syntax | Example |
| --- | --- |
| Pipe in code | `x \| y` |
| Multiple pipes | `a \| b \| c` |

### Not a Table (missing separator)

| Just a line | with pipes | but no separator below
This is not a table

### Mixed Content

1. First ordered item with **bold**
2. Second with *italic* and `code`
3. Third with [link](https://example.com) and ~~strikethrough~~

- [ ] Todo with **bold** text
- [x] Completed with *italic* text
- [ ] Todo with `code` snippet
