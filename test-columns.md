# Column Layout Test

This document tests the column layout feature in the WYSIWYG editor.

## Two Column Example

<div class="columns">
<div class="column">

### Left Column

This is content in the left column. You can have:

- **Bold text**
- *Italic text*
- Regular paragraphs
- Lists

</div>
<div class="column">

### Right Column

This is content in the right column. It can include:

1. Numbered lists
2. Code blocks
3. Any markdown syntax

</div>
</div>

## Three Column Example

<div class="columns">
<div class="column">

### Column 1

First column with some content and a `code snippet`.

</div>
<div class="column">

### Column 2

Second column with **bold text** and more information.

</div>
<div class="column">

### Column 3

Third column with *italic text* and [a link](https://example.com).

</div>
</div>

## Mixed Content

Here's regular content outside of columns.

<div class="columns">
<div class="column">

**Left side:** Important information here that needs to be highlighted.

> A blockquote can go in a column too!

</div>
<div class="column">

**Right side:** Additional context and details.

```javascript
// Even code blocks work
function hello() {
  return "world";
}
```

</div>
</div>

Back to regular single-column content.
