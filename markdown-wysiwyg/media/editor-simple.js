(function() {
    const vscode = acquireVsCodeApi();
    const editor = document.getElementById('editor');
    
    let isInternalUpdate = false;
    let lastReceivedText = '';
    
    // Simple markdown to HTML - just enough to display
    function markdownToHtml(markdown) {
        let html = markdown
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            // Process indented checkboxes first
            .replace(/^(\s*)- \[ ?\](.*)$/gm, (match, spaces, text) => {
                const indentLevel = Math.floor(spaces.length / 2);
                const indentClass = indentLevel > 0 ? ` class="indent-${indentLevel}"` : '';
                return `<li${indentClass}><input type="checkbox">${text}</li>`;
            })
            .replace(/^(\s*)- \[[xX]\](.*)$/gm, (match, spaces, text) => {
                const indentLevel = Math.floor(spaces.length / 2);
                const indentClass = indentLevel > 0 ? ` class="indent-${indentLevel}"` : '';
                return `<li${indentClass}><input type="checkbox" checked>${text}</li>`;
            })
            // Then process regular list items
            .replace(/^(\s*)- (.+)$/gm, (match, spaces, text) => {
                const indentLevel = Math.floor(spaces.length / 2);
                const indentClass = indentLevel > 0 ? ` class="indent-${indentLevel}"` : '';
                return `<li${indentClass}>${text}</li>`;
            })
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="#" data-href="$2">$1</a>')
            .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
            .replace(/^---$/gm, '<hr>');
            
        // Process tables
        const lines = html.split('\n');
        let inTable = false;
        let tableHtml = '';
        let processedLines = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Check if this line is a table row
            if (line.includes('|')) {
                const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
                
                if (cells.length > 0) {
                    if (!inTable) {
                        // Start a new table
                        tableHtml = '<table>\n';
                        inTable = true;
                        
                        // First row is header
                        tableHtml += '<thead><tr>';
                        cells.forEach(cell => {
                            tableHtml += `<th>${cell}</th>`;
                        });
                        tableHtml += '</tr></thead>\n';
                        
                        // Check if next line is separator
                        if (i + 1 < lines.length && lines[i + 1].includes('|') && lines[i + 1].includes('-')) {
                            i++; // Skip separator line
                            tableHtml += '<tbody>\n';
                        }
                    } else {
                        // Body row
                        tableHtml += '<tr>';
                        cells.forEach(cell => {
                            tableHtml += `<td>${cell}</td>`;
                        });
                        tableHtml += '</tr>\n';
                    }
                }
            } else {
                // Not a table line
                if (inTable) {
                    // Close the table
                    tableHtml += '</tbody></table>\n';
                    processedLines.push(tableHtml);
                    inTable = false;
                    tableHtml = '';
                }
                processedLines.push(line);
            }
        }
        
        // Close table if still open
        if (inTable) {
            tableHtml += '</tbody></table>\n';
            processedLines.push(tableHtml);
        }
        
        html = processedLines.join('\n');
            
        // For now, let's use a simpler approach - just wrap lists
        // First, let's handle multi-line content by preserving line breaks temporarily
        html = html.replace(/\n/g, '|||NEWLINE|||');
        
        // Wrap consecutive li elements in ul
        html = html.replace(/(<li.*?>.*?<\/li>(?:\|\|\|NEWLINE\|\|\|)?)+/g, (match) => {
            return '<ul>' + match + '</ul>';
        });
        
        // Restore line breaks
        html = html.replace(/\|\|\|NEWLINE\|\|\|/g, '\n');
        
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
                        // Check indentation level from class
                        let indent = '';
                        if (node.className) {
                            const match = node.className.match(/indent-(\d+)/);
                            if (match) {
                                indent = '  '.repeat(parseInt(match[1]));
                            }
                        }
                        
                        // Check if it has a checkbox
                        const checkbox = node.querySelector('input[type="checkbox"]');
                        if (checkbox) {
                            text += indent + (checkbox.checked ? '- [x] ' : '- [ ] ');
                        } else {
                            text += indent + '- ';
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
                    case 'pre':
                        text += '```\n';
                        walkChildren(node);
                        text += '\n```\n';
                        break;
                    case 'code':
                        // Skip if inside pre
                        if (node.parentElement && node.parentElement.tagName === 'PRE') {
                            walkChildren(node);
                        } else {
                            text += '`';
                            walkChildren(node);
                            text += '`';
                        }
                        break;
                    case 'blockquote':
                        text += '> ';
                        walkChildren(node);
                        text += '\n';
                        break;
                    case 'hr':
                        text += '---\n';
                        break;
                    case 'a':
                        text += '[';
                        walkChildren(node);
                        const href = node.getAttribute('data-href') || node.href || '#';
                        text += '](' + href + ')';
                        break;
                    case 'table':
                        // Extract table structure
                        const thead = node.querySelector('thead');
                        const tbody = node.querySelector('tbody');
                        
                        if (thead) {
                            const headerRow = thead.querySelector('tr');
                            if (headerRow) {
                                const headers = Array.from(headerRow.querySelectorAll('th'));
                                text += '| ' + headers.map(th => th.textContent.trim()).join(' | ') + ' |\n';
                                text += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
                            }
                        }
                        
                        if (tbody) {
                            const rows = tbody.querySelectorAll('tr');
                            rows.forEach(row => {
                                const cells = Array.from(row.querySelectorAll('td'));
                                text += '| ' + cells.map(td => td.textContent.trim()).join(' | ') + ' |\n';
                            });
                        }
                        break;
                    case 'thead':
                    case 'tbody':
                    case 'tr':
                    case 'th':
                    case 'td':
                        // Skip these as they're handled by the table case
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
    
    // Get simple cursor position
    function getCursorOffset() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return 0;
        
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(editor);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        
        return preCaretRange.toString().length;
    }
    
    // Set cursor position by offset
    function setCursorOffset(offset) {
        const walker = document.createTreeWalker(
            editor,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        let node;
        let currentOffset = 0;
        
        while (node = walker.nextNode()) {
            const nodeLength = node.textContent.length;
            if (currentOffset + nodeLength >= offset) {
                const selection = window.getSelection();
                const range = document.createRange();
                try {
                    const localOffset = Math.min(offset - currentOffset, nodeLength);
                    range.setStart(node, localOffset);
                    range.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(range);
                } catch (e) {
                    // If we can't set the exact position, just focus the editor
                    editor.focus();
                }
                return;
            }
            currentOffset += nodeLength;
        }
        
        // If we couldn't find a position, just focus at the end
        editor.focus();
    }
    
    // Handle messages from VS Code
    window.addEventListener('message', event => {
        const message = event.data;
        if (message.type === 'update') {
            // Get current markdown from the editor
            const currentMarkdown = htmlToMarkdown(editor);
            
            // Only update if the markdown actually changed
            // This prevents cursor jumps when saving without changes
            if (currentMarkdown.trim() === message.text.trim()) {
                return;
            }
            
            lastReceivedText = message.text;
            
            // Save cursor position
            const cursorPos = getCursorOffset();
            
            isInternalUpdate = true;
            editor.innerHTML = markdownToHtml(message.text);
            isInternalUpdate = false;
            
            // Try to restore cursor position
            // Use requestAnimationFrame for better timing
            requestAnimationFrame(() => {
                setCursorOffset(Math.min(cursorPos, editor.textContent.length));
                editor.focus();
            });
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
    
    // Handle link clicks
    editor.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link) {
            e.preventDefault();
            const href = link.getAttribute('data-href');
            if (href) {
                console.log('Link clicked:', href);
                vscode.postMessage({
                    type: 'openFile',
                    path: href
                });
            }
        }
    });
    
    // Simple keyboard shortcuts for headers and lists
    editor.addEventListener('keydown', (e) => {
        // Handle Tab key for indentation
        if (e.key === 'Tab') {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                let node = range.startContainer;
                
                // Find the nearest li element
                while (node && node !== editor) {
                    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'LI') {
                        e.preventDefault();
                        
                        // Get current indent level
                        let currentIndent = 0;
                        if (node.className) {
                            const match = node.className.match(/indent-(\d+)/);
                            if (match) {
                                currentIndent = parseInt(match[1]);
                            }
                        }
                        
                        if (e.shiftKey) {
                            // Shift+Tab: decrease indent
                            if (currentIndent > 0) {
                                currentIndent--;
                                if (currentIndent === 0) {
                                    node.className = '';
                                } else {
                                    node.className = `indent-${currentIndent}`;
                                }
                            }
                        } else {
                            // Tab: increase indent (max 4 levels)
                            if (currentIndent < 4) {
                                currentIndent++;
                                node.className = `indent-${currentIndent}`;
                            }
                        }
                        
                        // Trigger change to update markdown
                        const markdown = htmlToMarkdown(editor);
                        vscode.postMessage({
                            type: 'edit',
                            text: markdown
                        });
                        
                        return;
                    }
                    node = node.parentNode;
                }
            }
        }
        
        // Handle Enter key in code blocks
        if (e.key === 'Enter') {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                let node = range.startContainer;
                
                // First check if we're between ``` markers
                if (node.nodeType === Node.TEXT_NODE) {
                    const text = node.textContent;
                    const offset = range.startOffset;
                    
                    // Look for ``` before cursor
                    const beforeText = text.substring(0, offset);
                    const afterText = text.substring(offset);
                    
                    const hasOpeningBackticks = beforeText.includes('```');
                    const hasClosingBackticks = afterText.includes('```');
                    
                    if (hasOpeningBackticks && hasClosingBackticks) {
                        // We're between backticks, just insert a newline
                        e.preventDefault();
                        document.execCommand('insertText', false, '\n');
                        return;
                    }
                }
                
                // Check if we're inside a PRE/CODE block
                let inCodeBlock = false;
                let codeBlock = null;
                while (node && node !== editor) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.tagName === 'PRE' || (node.tagName === 'CODE' && node.parentElement?.tagName === 'PRE')) {
                            inCodeBlock = true;
                            codeBlock = node.tagName === 'PRE' ? node : node.parentElement;
                            break;
                        }
                    }
                    node = node.parentNode;
                }
                
                if (inCodeBlock) {
                    e.preventDefault();
                    
                    if (e.shiftKey) {
                        // Shift+Enter: Exit code block
                        const p = document.createElement('p');
                        const br = document.createElement('br');
                        p.appendChild(br);
                        
                        // Insert after the code block
                        codeBlock.parentNode.insertBefore(p, codeBlock.nextSibling);
                        
                        // Move cursor to new paragraph
                        const newRange = document.createRange();
                        newRange.setStart(p, 0);
                        newRange.collapse(true);
                        selection.removeAllRanges();
                        selection.addRange(newRange);
                    } else {
                        // Regular Enter: New line in code block
                        // Find the CODE element
                        const codeElement = codeBlock.querySelector('code') || codeBlock;
                        
                        // Make sure we have content in the code element
                        if (!codeElement.firstChild) {
                            codeElement.appendChild(document.createTextNode(''));
                        }
                        
                        // Insert newline at current position
                        const textNode = document.createTextNode('\n');
                        
                        // If we're at the end of the code block, append
                        if (range.endContainer === codeElement || 
                            (range.endContainer.parentNode === codeElement && 
                             range.endOffset === range.endContainer.textContent.length)) {
                            codeElement.appendChild(textNode);
                        } else {
                            range.insertNode(textNode);
                        }
                        
                        // Move cursor after the newline
                        const newRange = document.createRange();
                        newRange.setStartAfter(textNode);
                        newRange.setEndAfter(textNode);
                        selection.removeAllRanges();
                        selection.addRange(newRange);
                    }
                }
            }
        }
        
        // Handle shortcuts with Ctrl/Cmd
        if ((e.ctrlKey || e.metaKey)) {
            // Ctrl/Cmd+1 for H1, Ctrl/Cmd+2 for H2, etc.
            if (e.key >= '1' && e.key <= '3') {
                e.preventDefault();
                const level = parseInt(e.key);
                document.execCommand('formatBlock', false, `<h${level}>`);
            }
            
            // Ctrl/Cmd+L for list
            if (e.key === 'l') {
                e.preventDefault();
                document.execCommand('insertHTML', false, '<ul><li></li></ul>');
            }
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
        <div class="separator"></div>
        <button data-command="code" title="Inline Code">&lt;/&gt;</button>
        <button data-command="codeblock" title="Code Block">[...]</button>
        <div class="separator"></div>
        <button data-command="table" title="Table">Table</button>
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
                document.execCommand('insertHTML', false, '<ul><li></li></ul>');
                break;
            case 'checkbox':
                document.execCommand('insertHTML', false, '<li><input type="checkbox"> ');
                break;
            case 'code':
                // Wrap selection in code tags
                const selection = window.getSelection();
                if (selection.toString()) {
                    document.execCommand('insertHTML', false, `<code>${selection.toString()}</code>`);
                } else {
                    document.execCommand('insertHTML', false, '<code>code</code>');
                }
                break;
            case 'codeblock':
                // Insert a code block
                document.execCommand('insertHTML', false, '<pre><code>// code here</code></pre><p><br></p>');
                break;
            case 'table':
                // Insert a basic 3x3 table
                const tableHTML = `
                    <table>
                        <thead>
                            <tr>
                                <th>Header 1</th>
                                <th>Header 2</th>
                                <th>Header 3</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Cell 1</td>
                                <td>Cell 2</td>
                                <td>Cell 3</td>
                            </tr>
                            <tr>
                                <td>Cell 4</td>
                                <td>Cell 5</td>
                                <td>Cell 6</td>
                            </tr>
                        </tbody>
                    </table>
                    <p><br></p>
                `;
                document.execCommand('insertHTML', false, tableHTML);
                break;
        }
    });
    
    editor.focus();
})();