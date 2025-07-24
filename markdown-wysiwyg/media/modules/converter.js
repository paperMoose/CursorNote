// converter.js - Simple HTML to Markdown converter
class HtmlToMarkdownConverter {
    convert(element) {
        let markdown = '';
        
        for (let node of element.childNodes) {
            markdown += this.processNode(node);
        }
        
        return markdown.trim();
    }
    
    processNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent;
        }
        
        if (node.nodeType !== Node.ELEMENT_NODE) {
            return '';
        }
        
        const tag = node.tagName.toLowerCase();
        
        switch(tag) {
            case 'h1': return '# ' + this.getTextContent(node) + '\n\n';
            case 'h2': return '## ' + this.getTextContent(node) + '\n\n';
            case 'h3': return '### ' + this.getTextContent(node) + '\n\n';
            case 'h4': return '#### ' + this.getTextContent(node) + '\n\n';
            case 'h5': return '##### ' + this.getTextContent(node) + '\n\n';
            case 'h6': return '###### ' + this.getTextContent(node) + '\n\n';
            
            case 'p': return this.processChildren(node) + '\n\n';
            
            case 'strong':
            case 'b': return '**' + this.getTextContent(node) + '**';
            
            case 'em':
            case 'i': return '*' + this.getTextContent(node) + '*';
            
            case 'li': return '- ' + this.getTextContent(node) + '\n';
            
            case 'ul': return this.processChildren(node) + '\n';
            
            default: return this.processChildren(node);
        }
    }
    
    processChildren(node) {
        let result = '';
        for (let child of node.childNodes) {
            result += this.processNode(child);
        }
        return result;
    }
    
    getTextContent(node) {
        let text = '';
        for (let child of node.childNodes) {
            if (child.nodeType === Node.TEXT_NODE) {
                text += child.textContent;
            } else if (child.nodeType === Node.ELEMENT_NODE) {
                text += this.getTextContent(child);
            }
        }
        return text;
    }
}

// Export
window.HtmlToMarkdownConverter = HtmlToMarkdownConverter;