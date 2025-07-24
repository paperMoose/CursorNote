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
        let inList = false;
        let inCodeBlock = false;
        let codeContent = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Code blocks
            if (line.startsWith('```')) {
                if (inParagraph) { html += '</p>'; inParagraph = false; }
                if (inList) { html += '</ul>'; inList = false; }
                
                if (inCodeBlock) {
                    html += '<pre><code>' + codeContent.join('\n') + '</code></pre>';
                    codeContent = [];
                    inCodeBlock = false;
                } else {
                    inCodeBlock = true;
                }
                continue;
            }
            
            if (inCodeBlock) {
                codeContent.push(line);
                continue;
            }
            
            // Empty line - close paragraph/list if open
            if (line.trim() === '') {
                if (inParagraph) {
                    html += '</p>';
                    inParagraph = false;
                }
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                continue;
            }
            
            // Headers
            if (line.match(/^#{1,6}\s/)) {
                if (inParagraph) { html += '</p>'; inParagraph = false; }
                if (inList) { html += '</ul>'; inList = false; }
                const level = line.match(/^(#{1,6})\s/)[1].length;
                html += `<h${level}>` + processInline(line.replace(/^#{1,6}\s+/, '')) + `</h${level}>`;
            }
            // Checkboxes
            else if (line.match(/^[\-\*]\s\[([ xX])\]\s/)) {
                if (inParagraph) { html += '</p>'; inParagraph = false; }
                if (!inList) { html += '<ul>'; inList = true; }
                const checked = line.match(/^[\-\*]\s\[([ xX])\]\s/)[1].toLowerCase() === 'x';
                const text = line.replace(/^[\-\*]\s\[([ xX])\]\s/, '');
                html += '<li><input type="checkbox"' + (checked ? ' checked' : '') + '> ' + processInline(text) + '</li>';
            }
            // Lists
            else if (line.match(/^[\-\*]\s/)) {
                if (inParagraph) { html += '</p>'; inParagraph = false; }
                if (!inList) { html += '<ul>'; inList = true; }
                html += '<li>' + processInline(line.replace(/^[\-\*]\s/, '')) + '</li>';
            }
            // Normal text
            else {
                if (inList) { html += '</ul>'; inList = false; }
                if (!inParagraph) {
                    html += '<p>';
                    inParagraph = true;
                }
                html += processInline(line) + ' ';
            }
        }
        
        // Close any open tags
        if (inParagraph) html += '</p>';
        if (inList) html += '</ul>';
        if (inCodeBlock) html += '<pre><code>' + codeContent.join('\n') + '</code></pre>';
        
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
                const container = range.startContainer;
                const offset = range.startOffset;
                
                // Get the full editor text to check for patterns
                const fullText = editor.textContent || '';
                
                // Find our position in the full text
                let positionInFullText = 0;
                const walker = document.createTreeWalker(
                    editor,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                );
                
                let node;
                while (node = walker.nextNode()) {
                    if (node === container) {
                        positionInFullText += offset;
                        break;
                    }
                    positionInFullText += node.textContent.length;
                }
                
                // Get the current line
                const beforePosition = fullText.substring(0, positionInFullText);
                const lastNewline = beforePosition.lastIndexOf('\n');
                const currentLine = fullText.substring(lastNewline + 1, positionInFullText);
                
                // Check for various markdown patterns
                let shouldRender = false;
                
                // Headers: "# ", "## ", etc.
                if (currentLine.match(/^#{1,6}\s/)) {
                    shouldRender = true;
                }
                // Lists: "- ", "* "
                else if (currentLine.match(/^[\-\*]\s/) && !currentLine.match(/^[\-\*]\s\[/)) {
                    shouldRender = true;
                }
                // Checkboxes: "- [ ] " or "- [x] "
                else if (currentLine.match(/^[\-\*]\s\[([ xX])\]\s/)) {
                    shouldRender = true;
                }
                // Code blocks: check if we just completed ```
                else if (beforePosition.endsWith('```')) {
                    shouldRender = true;
                }
                
                if (shouldRender) {
                    // Small delay to let the character get added first
                    setTimeout(() => {
                        // Save cursor position as character offset
                        const cursorPos = positionInFullText;
                        
                        // Re-render
                        isInternalUpdate = true;
                        editor.innerHTML = markdownToHtml(markdown);
                        isInternalUpdate = false;
                        
                        // Restore cursor position by character offset
                        let charCount = 0;
                        let found = false;
                        
                        function restoreCursor(node) {
                            if (found) return;
                            
                            if (node.nodeType === Node.TEXT_NODE) {
                                const nodeLength = node.textContent.length;
                                if (charCount + nodeLength >= cursorPos) {
                                    const range = document.createRange();
                                    const selection = window.getSelection();
                                    range.setStart(node, cursorPos - charCount);
                                    range.collapse(true);
                                    selection.removeAllRanges();
                                    selection.addRange(range);
                                    found = true;
                                }
                                charCount += nodeLength;
                            } else {
                                for (let child of node.childNodes) {
                                    restoreCursor(child);
                                }
                            }
                        }
                        
                        restoreCursor(editor);
                        
                        if (!found) {
                            editor.focus();
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