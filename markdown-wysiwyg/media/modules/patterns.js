// patterns.js - Define all markdown patterns that trigger rendering
const patterns = [
    {
        name: 'header',
        test: (line) => /^#{1,6}\s/.test(line),
        description: 'Headers: # ## ### etc.'
    },
    {
        name: 'list',
        test: (line) => /^[\-\*]\s/.test(line),
        description: 'Lists: - or *'
    }
];

// Function to check if we should render
function shouldRender(currentLine, fullTextBefore) {
    return patterns.some(pattern => pattern.test(currentLine));
}

// Export for use in main editor
window.markdownPatterns = {
    patterns,
    shouldRender
};