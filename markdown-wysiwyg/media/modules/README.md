# Modular Architecture

The editor is now split into independent modules that can be modified without affecting each other:

## Modules

### patterns.js
- Defines all markdown patterns that trigger rendering
- Easy to add new patterns without touching other code
- Example: Add a new pattern by adding to the `patterns` array

### parser.js
- Converts markdown to HTML
- Each element type has its own processor class
- Add new elements by creating a new processor class

### cursor.js
- Handles cursor position saving and restoration
- Completely independent from parsing logic
- Provides utilities for getting line information

### converter.js
- Converts HTML back to markdown
- Each HTML element has its own handler
- Add new conversions by adding to the `handlers` object

### editor-modular.js
- Main editor that ties everything together
- Uses all modules but doesn't contain implementation details

## Adding New Features

To add a new markdown element (e.g., tables):

1. Add pattern to `patterns.js`:
```javascript
{
    name: 'table',
    test: (line) => /^\|/.test(line),
    description: 'Tables: | header |'
}
```

2. Add processor to `parser.js`:
```javascript
class TableProcessor extends Processor {
    process(line, state) {
        // Table parsing logic
    }
}
```

3. Add converter to `converter.js`:
```javascript
table: (node) => {
    // Convert HTML table back to markdown
}
```

That's it! No need to touch cursor handling or the main editor logic.