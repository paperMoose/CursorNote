// parser.js - Simple markdown to HTML parser
class MarkdownParser {
    parse(markdown) {
        const lines = markdown.split('\n');
        let html = '';
        let inList = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Empty line
            if (line.trim() === '') {
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                continue;
            }
            
            // Headers
            const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
            if (headerMatch) {
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                const level = headerMatch[1].length;
                const content = headerMatch[2];
                html += `<h${level}>${this.processInline(content)}</h${level}>`;
            }
            // Lists
            else if (line.match(/^[\-\*]\s+/)) {
                if (!inList) {
                    html += '<ul>';
                    inList = true;
                }
                const content = line.replace(/^[\-\*]\s+/, '');
                html += '<li>' + this.processInline(content) + '</li>';
            }
            // Regular text
            else {
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                html += '<p>' + this.processInline(line) + '</p>';
            }
        }
        
        // Close any open list
        if (inList) {
            html += '</ul>';
        }
        
        return html;
    }
    
    processInline(text) {
        // Bold - must come before italic
        text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/__(.+?)__/g, '<strong>$1</strong>');
        
        // Italic
        text = text.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
        text = text.replace(/_([^_]+)_/g, '<em>$1</em>');
        
        return text;
    }
}

// Export
window.MarkdownParser = MarkdownParser;