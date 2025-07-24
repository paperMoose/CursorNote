(function() {
    const vscode = acquireVsCodeApi();
    const editor = document.getElementById('editor');
    
    let isInternalUpdate = false;
    let currentMarkdown = '';
    
    // Simple markdown to HTML converter
    function markdownToHtml(markdown) {
        const lines = markdown.split('\n');
        let html = '';
        let inParagraph = false;
        
        for (let line of lines) {
            // Empty line - close paragraph if open
            if (line.trim() === '') {
                if (inParagraph) {
                    html += '</p>';
                    inParagraph = false;
                }
                continue;
            }
            
            // Headers
            if (line.startsWith('# ')) {
                if (inParagraph) { html += '</p>'; inParagraph = false; }
                html += '<h1>' + processInline(line.slice(2)) + '</h1>';
            }
            else if (line.startsWith('## ')) {
                if (inParagraph) { html += '</p>'; inParagraph = false; }
                html += '<h2>' + processInline(line.slice(3)) + '</h2>';
            }
            else if (line.startsWith('### ')) {
                if (inParagraph) { html += '</p>'; inParagraph = false; }
                html += '<h3>' + processInline(line.slice(4)) + '</h3>';
            }
            // Lists
            else if (line.startsWith('- ') || line.startsWith('* ')) {
                if (inParagraph) { html += '</p>'; inParagraph = false; }
                html += '<li>' + processInline(line.slice(2)) + '</li>';
            }
            // Normal text
            else {
                if (!inParagraph) {
                    html += '<p>';
                    inParagraph = true;
                }
                html += processInline(line) + ' ';
            }
        }
        
        if (inParagraph) {
            html += '</p>';
        }
        
        // Wrap lists
        html = html.replace(/(<li>.*?<\/li>)(?=(?!<li>))/gs, '<ul>$1</ul>');
        
        return html;
    }
    
    function processInline(text) {
        // Bold
        text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        // Italic  
        text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
        // Code
        text = text.replace(/`(.+?)`/g, '<code>$1</code>');
        // Links
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
        
        return text;
    }
    
    // HTML to markdown converter
    function htmlToMarkdown(element) {
        let markdown = '';
        
        for (let node of element.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                markdown += node.textContent;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const tag = node.tagName.toLowerCase();
                const text = node.textContent;
                
                switch(tag) {
                    case 'h1': markdown += '# ' + text + '\n\n'; break;
                    case 'h2': markdown += '## ' + text + '\n\n'; break;
                    case 'h3': markdown += '### ' + text + '\n\n'; break;
                    case 'p': markdown += htmlToMarkdown(node) + '\n\n'; break;
                    case 'strong': markdown += '**' + text + '**'; break;
                    case 'em': markdown += '*' + text + '*'; break;
                    case 'code': markdown += '`' + text + '`'; break;
                    case 'li': markdown += '- ' + text + '\n'; break;
                    case 'ul': markdown += htmlToMarkdown(node) + '\n'; break;
                    case 'a': markdown += '[' + text + '](' + node.href + ')'; break;
                    default: markdown += htmlToMarkdown(node);
                }
            }
        }
        
        return markdown.trim();
    }
    
    // Handle messages from extension
    window.addEventListener('message', event => {
        const message = event.data;
        if (message.type === 'update') {
            if (message.text !== currentMarkdown) {
                currentMarkdown = message.text;
                isInternalUpdate = true;
                editor.innerHTML = markdownToHtml(message.text);
                isInternalUpdate = false;
            }
        }
    });
    
    // Handle editor changes
    editor.addEventListener('input', () => {
        if (!isInternalUpdate) {
            const markdown = htmlToMarkdown(editor);
            currentMarkdown = markdown;
            vscode.postMessage({
                type: 'edit',
                text: markdown
            });
        }
    });
    
    // Handle Enter key for list continuation
    editor.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                let listItem = range.startContainer;
                
                // Find parent LI element
                while (listItem && listItem.nodeName !== 'LI' && listItem !== editor) {
                    listItem = listItem.parentNode;
                }
                
                if (listItem && listItem.nodeName === 'LI') {
                    e.preventDefault();
                    
                    if (e.shiftKey) {
                        // Shift+Enter: Exit the list
                        const ul = listItem.parentNode;
                        const p = document.createElement('p');
                        const br = document.createElement('br');
                        p.appendChild(br);
                        
                        // Insert paragraph after the list
                        ul.parentNode.insertBefore(p, ul.nextSibling);
                        
                        // Move cursor to new paragraph
                        const newRange = document.createRange();
                        newRange.setStart(p, 0);
                        newRange.collapse(true);
                        selection.removeAllRanges();
                        selection.addRange(newRange);
                    } else {
                        // Regular Enter: Create new list item
                        const newLi = document.createElement('li');
                        const br = document.createElement('br');
                        newLi.appendChild(br);
                        
                        // Insert after current item
                        listItem.parentNode.insertBefore(newLi, listItem.nextSibling);
                        
                        // Move cursor to new item
                        const newRange = document.createRange();
                        newRange.setStart(newLi, 0);
                        newRange.collapse(true);
                        selection.removeAllRanges();
                        selection.addRange(newRange);
                    }
                }
            }
        }
    });
    
    // Basic keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'b') {
                e.preventDefault();
                document.execCommand('bold');
            } else if (e.key === 'i') {
                e.preventDefault();
                document.execCommand('italic');
            }
        }
    });
    
    // Focus editor
    editor.focus();
})();