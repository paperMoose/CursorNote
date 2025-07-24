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
            .replace(/^- \[ \](.*)$/gm, '<li><input type="checkbox">$1</li>')
            .replace(/^- \[x\](.*)$/gmi, '<li><input type="checkbox" checked>$1</li>')
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
                        // Check if it has a checkbox
                        const checkbox = node.querySelector('input[type="checkbox"]');
                        if (checkbox) {
                            text += checkbox.checked ? '- [x] ' : '- [ ] ';
                        } else {
                            text += '- ';
                        }
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
                // Skip checkbox inputs when walking children
                if (child.nodeType === Node.ELEMENT_NODE && 
                    child.tagName === 'INPUT' && 
                    child.type === 'checkbox') {
                    continue;
                }
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
    
    // Handle checkbox clicks
    editor.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
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
    
    // Create floating toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'toolbar';
    toolbar.innerHTML = `
        <button data-command="bold" title="Bold (Ctrl/Cmd+B)"><strong>B</strong></button>
        <button data-command="italic" title="Italic (Ctrl/Cmd+I)"><em>I</em></button>
        <div class="separator"></div>
        <button data-command="h1" title="Heading 1 (Ctrl/Cmd+1)">H1</button>
        <button data-command="h2" title="Heading 2 (Ctrl/Cmd+2)">H2</button>
        <button data-command="h3" title="Heading 3 (Ctrl/Cmd+3)">H3</button>
        <div class="separator"></div>
        <button data-command="list" title="List (Ctrl/Cmd+L)">• List</button>
        <button data-command="checkbox" title="Checkbox">☐ Task</button>
    `;
    document.body.appendChild(toolbar);
    
    // Handle toolbar clicks
    toolbar.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;
        
        const command = button.dataset.command;
        editor.focus();
        
        switch(command) {
            case 'bold':
                document.execCommand('bold');
                break;
            case 'italic':
                document.execCommand('italic');
                break;
            case 'h1':
                document.execCommand('formatBlock', false, '<h1>');
                break;
            case 'h2':
                document.execCommand('formatBlock', false, '<h2>');
                break;
            case 'h3':
                document.execCommand('formatBlock', false, '<h3>');
                break;
            case 'list':
                document.execCommand('insertHTML', false, '<li>');
                break;
            case 'checkbox':
                document.execCommand('insertHTML', false, '<li><input type="checkbox"> ');
                break;
        }
    });
    
    editor.focus();
})();