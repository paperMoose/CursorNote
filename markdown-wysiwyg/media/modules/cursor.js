// cursor.js - Handle cursor position saving and restoration
class CursorManager {
    constructor(editor) {
        this.editor = editor;
    }
    
    // Get current cursor position as character offset
    getPosition() {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return 0;
        
        const range = selection.getRangeAt(0);
        const container = range.startContainer;
        const offset = range.startOffset;
        
        // Calculate position in full text
        let position = 0;
        const walker = document.createTreeWalker(
            this.editor,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        let node;
        while (node = walker.nextNode()) {
            if (node === container) {
                position += offset;
                break;
            }
            position += node.textContent.length;
        }
        
        return position;
    }
    
    // Restore cursor to a specific position
    restorePosition(targetPosition) {
        let charCount = 0;
        let found = false;
        
        const restore = (node) => {
            if (found) return;
            
            if (node.nodeType === Node.TEXT_NODE) {
                const nodeLength = node.textContent.length;
                if (charCount + nodeLength >= targetPosition) {
                    const range = document.createRange();
                    const selection = window.getSelection();
                    
                    range.setStart(node, targetPosition - charCount);
                    range.collapse(true);
                    
                    selection.removeAllRanges();
                    selection.addRange(range);
                    found = true;
                    return;
                }
                charCount += nodeLength;
            } else {
                for (let child of node.childNodes) {
                    restore(child);
                }
            }
        };
        
        restore(this.editor);
        
        if (!found) {
            this.editor.focus();
        }
    }
    
    // Get info about current line
    getCurrentLineInfo() {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return null;
        
        const range = selection.getRangeAt(0);
        const container = range.startContainer;
        const offset = range.startOffset;
        
        // Get full text
        const fullText = this.editor.textContent || '';
        const position = this.getPosition();
        
        // Find line boundaries
        const beforePosition = fullText.substring(0, position);
        const lastNewline = beforePosition.lastIndexOf('\n');
        const nextNewline = fullText.indexOf('\n', position);
        
        const lineStart = lastNewline + 1;
        const lineEnd = nextNewline === -1 ? fullText.length : nextNewline;
        
        return {
            fullText,
            position,
            lineStart,
            lineEnd,
            currentLine: fullText.substring(lineStart, position),
            fullLine: fullText.substring(lineStart, lineEnd),
            textBeforeCursor: beforePosition
        };
    }
}

// Export
window.CursorManager = CursorManager;