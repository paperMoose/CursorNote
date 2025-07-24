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
    editor.addEventListener('input', (e) => {
        if (!isInternalUpdate) {
            const markdown = htmlToMarkdown(editor);
            currentMarkdown = markdown;
            vscode.postMessage({
                type: 'edit',
                text: markdown
            });
            
            // Check if we just typed a markdown pattern
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const text = range.startContainer.textContent || '';
                const offset = range.startOffset;
                
                // Check if we just typed a space after a markdown pattern
                const beforeSpace = text.substring(0, offset - 1);
                const afterSpace = text.substring(offset - 1, offset);
                
                // Only render if we just typed a space AND we're at the start of a line with a pattern
                let shouldRender = false;
                if (afterSpace === ' ') {
                    const lastNewline = beforeSpace.lastIndexOf('\n');
                    const lineStart = lastNewline + 1;
                    const beforeSpaceOnLine = beforeSpace.substring(lineStart);
                    
                    // Check if what's before the space is a markdown trigger
                    shouldRender = beforeSpaceOnLine.match(/^#{1,6}$/) || // Headers
                                   beforeSpaceOnLine === '-' ||           // List dash
                                   beforeSpaceOnLine === '*';             // List asterisk
                }
                
                if (shouldRender) {
                    // Count which line number we're on (0-based)
                    const linesBeforeCursor = beforeSpace.split('\n').length - 1;
                    
                    // Small delay to let the space character get added first
                    setTimeout(() => {
                        // Re-render
                        isInternalUpdate = true;
                        editor.innerHTML = markdownToHtml(markdown);
                        isInternalUpdate = false;
                        
                        // Find the element that corresponds to our line number
                        const allElements = editor.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li');
                        let elementIndex = 0;
                        
                        // Count elements to find the one we just created
                        for (let i = 0; i < allElements.length; i++) {
                            if (i === linesBeforeCursor) {
                                const element = allElements[i];
                                const range = document.createRange();
                                const selection = window.getSelection();
                                
                                // Position cursor at the end of this element's text
                                if (element.firstChild && element.firstChild.nodeType === Node.TEXT_NODE) {
                                    range.setStart(element.firstChild, element.firstChild.length);
                                } else {
                                    range.selectNodeContents(element);
                                }
                                range.collapse(false);
                                
                                selection.removeAllRanges();
                                selection.addRange(range);
                                break;
                            }
                        }
                    }, 10);
                }
            }
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