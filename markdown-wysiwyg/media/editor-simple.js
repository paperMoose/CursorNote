(function() {
    const vscode = acquireVsCodeApi();
    const editor = document.getElementById('editor');
    
    let isInternalUpdate = false;
    
    // Simple markdown to HTML - just enough to display
    function markdownToHtml(markdown) {
        let html = markdown
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^- (.+)$/gm, '<li>$1</li>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
            
        // Wrap consecutive li elements in ul
        html = html.replace(/(<li>.*?<\/li>(?:<br>)?)+/g, (match) => {
            return '<ul>' + match.replace(/<br>/g, '') + '</ul>';
        });
        
        return html;
    }
    
    // Simple HTML to markdown - just extract the text
    function htmlToMarkdown(element) {
        let text = '';
        
        function walk(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                text += node.textContent;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const tag = node.tagName.toLowerCase();
                
                // Add markdown syntax based on tag
                switch(tag) {
                    case 'h1':
                        text += '# ';
                        walkChildren(node);
                        text += '\n';
                        break;
                    case 'h2':
                        text += '## ';
                        walkChildren(node);
                        text += '\n';
                        break;
                    case 'h3':
                        text += '### ';
                        walkChildren(node);
                        text += '\n';
                        break;
                    case 'strong':
                    case 'b':
                        text += '**';
                        walkChildren(node);
                        text += '**';
                        break;
                    case 'em':
                    case 'i':
                        text += '*';
                        walkChildren(node);
                        text += '*';
                        break;
                    case 'li':
                        text += '- ';
                        walkChildren(node);
                        text += '\n';
                        break;
                    case 'br':
                        text += '\n';
                        break;
                    case 'ul':
                        walkChildren(node);
                        break;
                    default:
                        walkChildren(node);
                }
            }
        }
        
        function walkChildren(node) {
            for (let child of node.childNodes) {
                walk(child);
            }
        }
        
        walk(element);
        return text.trim();
    }
    
    // Handle messages from VS Code
    window.addEventListener('message', event => {
        const message = event.data;
        if (message.type === 'update') {
            isInternalUpdate = true;
            editor.innerHTML = markdownToHtml(message.text);
            isInternalUpdate = false;
        }
    });
    
    // Handle typing - let the browser handle bold/italic naturally
    editor.addEventListener('input', () => {
        if (!isInternalUpdate) {
            const markdown = htmlToMarkdown(editor);
            vscode.postMessage({
                type: 'edit',
                text: markdown
            });
        }
    });
    
    // Simple keyboard shortcuts for headers and lists
    editor.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            document.execCommand('insertHTML', false, '<br>');
        }
        
        // Ctrl/Cmd+1 for H1, Ctrl/Cmd+2 for H2, etc.
        if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '3') {
            e.preventDefault();
            const level = parseInt(e.key);
            document.execCommand('formatBlock', false, `<h${level}>`);
        }
        
        // Ctrl/Cmd+L for list
        if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
            e.preventDefault();
            document.execCommand('insertHTML', false, '<li>');
        }
    });
    
    editor.focus();
})();