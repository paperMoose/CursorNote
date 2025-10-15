(function() {
    const vscode = acquireVsCodeApi();
    const editor = document.getElementById('editor');
    
    let isInternalUpdate = false;
    let lastReceivedText = '';
    
    // Helper function to process inline markdown formatting
    function processInline(text) {
        // Store escaped characters temporarily
        const escapeMap = new Map();
        let escapeIndex = 0;
        text = text.replace(/\\([\\`*_{}[\]()#+\-.!|~])/g, (match, char) => {
            const placeholder = `__ESCAPE_${escapeIndex}__`;
            escapeMap.set(placeholder, char);
            escapeIndex++;
            return placeholder;
        });

        // Store inline code to prevent formatting inside it
        const codeMap = new Map();
        let codeIndex = 0;
        text = text.replace(/`([^`]+)`/g, (match, code) => {
            const placeholder = `__CODE_${codeIndex}__`;
            codeMap.set(placeholder, `<code>${code}</code>`);
            codeIndex++;
            return placeholder;
        });

        // Process images (must come before links)
        text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

        // Process links
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="javascript:void(0)" data-href="$2">$1</a>');

        // Bold (must come before italic) - handle both ** and __
        text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/__(.+?)__/g, '<strong>$1</strong>');

        // Italic - handle both * and _
        text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        text = text.replace(/_([^_]+)_/g, '<em>$1</em>');

        // Strikethrough
        text = text.replace(/~~(.+?)~~/g, '<del>$1</del>');

        // Restore inline code
        codeMap.forEach((value, key) => {
            text = text.replace(key, value);
        });

        // Restore escaped characters
        escapeMap.forEach((value, key) => {
            text = text.replace(key, value);
        });

        return text;
    }

    // Simple markdown to HTML - just enough to display
    function markdownToHtml(markdown) {
        // First escape HTML entities
        let html = markdown
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Process code blocks with language hints
        html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (match, lang, code) => {
            const langClass = lang ? ` class="language-${lang}"` : '';
            return `<pre><code${langClass}>${code}</code></pre>`;
        });

        // Process headers
        html = html
            .replace(/^###### (.+)$/gm, (match, text) => `<h6>${processInline(text)}</h6>`)
            .replace(/^##### (.+)$/gm, (match, text) => `<h5>${processInline(text)}</h5>`)
            .replace(/^#### (.+)$/gm, (match, text) => `<h4>${processInline(text)}</h4>`)
            .replace(/^### (.+)$/gm, (match, text) => `<h3>${processInline(text)}</h3>`)
            .replace(/^## (.+)$/gm, (match, text) => `<h2>${processInline(text)}</h2>`)
            .replace(/^# (.+)$/gm, (match, text) => `<h1>${processInline(text)}</h1>`);

        // Process indented checkboxes first
        html = html.replace(/^(\s*)- \[ ?\](.*)$/gm, (match, spaces, text) => {
            const indentLevel = Math.floor(spaces.length / 2);
            const indentClass = indentLevel > 0 ? ` class="indent-${indentLevel}"` : '';
            return `<li${indentClass}><input type="checkbox">${processInline(text)}</li>`;
        });
        html = html.replace(/^(\s*)- \[[xX]\](.*)$/gm, (match, spaces, text) => {
            const indentLevel = Math.floor(spaces.length / 2);
            const indentClass = indentLevel > 0 ? ` class="indent-${indentLevel}"` : '';
            return `<li${indentClass}><input type="checkbox" checked>${processInline(text)}</li>`;
        });

        // Process unordered list items
        html = html.replace(/^(\s*)[\-*] (.+)$/gm, (match, spaces, text) => {
            const indentLevel = Math.floor(spaces.length / 2);
            const indentClass = indentLevel > 0 ? ` class="indent-${indentLevel}"` : '';
            return `<li${indentClass}>${processInline(text)}</li>`;
        });

        // Process ordered list items
        html = html.replace(/^(\s*)(\d+)\. (.+)$/gm, (match, spaces, num, text) => {
            const indentLevel = Math.floor(spaces.length / 2);
            const indentClass = indentLevel > 0 ? ` class="indent-${indentLevel}"` : '';
            return `<li${indentClass} data-number="${num}">${processInline(text)}</li>`;
        });

        // Process blockquotes and horizontal rules
        html = html
            .replace(/^> (.+)$/gm, (match, text) => `<blockquote>${processInline(text)}</blockquote>`)
            .replace(/^---$/gm, '<hr>');
            
        // Process tables with improved detection
        const lines = html.split('\n');
        let inTable = false;
        let tableHtml = '';
        let processedLines = [];

        // Helper to check if line is a valid table row (has | and at least 2 cells)
        function isTableRow(line) {
            const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
            return line.includes('|') && cells.length >= 2;
        }

        // Helper to check if line is a table separator (| --- | --- |)
        function isTableSeparator(line) {
            if (!line.includes('|') || !line.includes('-')) return false;
            const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
            return cells.length > 0 && cells.every(cell => /^-+:?$|^:-+$|^:-+:$/.test(cell));
        }

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Check if this line is a table row
            if (isTableRow(line) && !isTableSeparator(line)) {
                const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);

                if (cells.length > 0) {
                    if (!inTable) {
                        // Check if next line is a separator to confirm this is a table
                        const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
                        if (isTableSeparator(nextLine)) {
                            // Start a new table
                            tableHtml = '<table>\n';
                            inTable = true;

                            // First row is header
                            tableHtml += '<thead><tr>';
                            cells.forEach(cell => {
                                tableHtml += `<th>${processInline(cell)}</th>`;
                            });
                            tableHtml += '</tr></thead>\n';

                            // Skip separator line
                            i++;
                            tableHtml += '<tbody>\n';
                        } else {
                            // Not a table, just a line with pipes
                            processedLines.push(line);
                        }
                    } else {
                        // Body row
                        tableHtml += '<tr>';
                        cells.forEach(cell => {
                            tableHtml += `<td>${processInline(cell)}</td>`;
                        });
                        tableHtml += '</tr>\n';
                    }
                }
            } else if (isTableSeparator(line) && !inTable) {
                // Skip standalone separator lines
                processedLines.push(line);
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
            
        // Wrap consecutive list items in appropriate list tags
        // First, preserve line breaks temporarily
        html = html.replace(/\n/g, '|||NEWLINE|||');

        // Wrap ordered list items (those with data-number attribute) in ol
        html = html.replace(/(<li[^>]*data-number[^>]*>.*?<\/li>(?:\|\|\|NEWLINE\|\|\|)?)+/g, (match) => {
            return '<ol>' + match + '</ol>';
        });

        // Wrap remaining unordered list items in ul
        html = html.replace(/(<li(?![^>]*data-number)[^>]*>.*?<\/li>(?:\|\|\|NEWLINE\|\|\|)?)+/g, (match) => {
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
                    case 'h4':
                        text += '#### ';
                        walkChildren(node);
                        text += '\n';
                        break;
                    case 'h5':
                        text += '##### ';
                        walkChildren(node);
                        text += '\n';
                        break;
                    case 'h6':
                        text += '###### ';
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
                    case 'del':
                    case 's':
                    case 'strike':
                        text += '~~';
                        walkChildren(node);
                        text += '~~';
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
                        } else if (node.hasAttribute('data-number')) {
                            // Ordered list item
                            text += indent + node.getAttribute('data-number') + '. ';
                        } else {
                            // Regular unordered list item
                            text += indent + '- ';
                        }
                        walkChildren(node);
                        text += '\n';
                        break;
                    case 'br':
                        text += '\n';
                        break;
                    case 'ul':
                    case 'ol':
                        walkChildren(node);
                        break;
                    case 'pre':
                        const codeElement = node.querySelector('code');
                        const langClass = codeElement?.className || '';
                        const langMatch = langClass.match(/language-(\w+)/);
                        const lang = langMatch ? langMatch[1] : '';

                        text += '```' + lang + '\n';
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
                    case 'img':
                        const alt = node.getAttribute('alt') || '';
                        const src = node.getAttribute('src') || '';
                        text += `![${alt}](${src})`;
                        break;
                    case 'a':
                        text += '[';
                        walkChildren(node);
                        const href = node.getAttribute('data-href') || node.href || '#';
                        text += '](' + href + ')';
                        break;
                    case 'table':
                        // Extract table structure and preserve inline formatting
                        const thead = node.querySelector('thead');
                        const tbody = node.querySelector('tbody');

                        if (thead) {
                            const headerRow = thead.querySelector('tr');
                            if (headerRow) {
                                const headers = Array.from(headerRow.querySelectorAll('th'));
                                text += '| ' + headers.map(th => getInnerMarkdown(th)).join(' | ') + ' |\n';
                                text += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
                            }
                        }

                        if (tbody) {
                            const rows = tbody.querySelectorAll('tr');
                            rows.forEach(row => {
                                const cells = Array.from(row.querySelectorAll('td'));
                                text += '| ' + cells.map(td => getInnerMarkdown(td)).join(' | ') + ' |\n';
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

        // Helper function to extract markdown from inline elements
        function getInnerMarkdown(element) {
            let markdown = '';

            function walkInline(node) {
                if (node.nodeType === Node.TEXT_NODE) {
                    markdown += node.textContent;
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    const tag = node.tagName.toLowerCase();

                    switch(tag) {
                        case 'strong':
                        case 'b':
                            markdown += '**';
                            for (let child of node.childNodes) walkInline(child);
                            markdown += '**';
                            break;
                        case 'em':
                        case 'i':
                            markdown += '*';
                            for (let child of node.childNodes) walkInline(child);
                            markdown += '*';
                            break;
                        case 'del':
                        case 's':
                        case 'strike':
                            markdown += '~~';
                            for (let child of node.childNodes) walkInline(child);
                            markdown += '~~';
                            break;
                        case 'code':
                            markdown += '`';
                            for (let child of node.childNodes) walkInline(child);
                            markdown += '`';
                            break;
                        case 'a':
                            markdown += '[';
                            for (let child of node.childNodes) walkInline(child);
                            const href = node.getAttribute('data-href') || node.href || '#';
                            markdown += '](' + href + ')';
                            break;
                        case 'img':
                            const alt = node.getAttribute('alt') || '';
                            const src = node.getAttribute('src') || '';
                            markdown += `![${alt}](${src})`;
                            break;
                        default:
                            for (let child of node.childNodes) walkInline(child);
                    }
                }
            }

            for (let child of element.childNodes) {
                walkInline(child);
            }

            return markdown.trim();
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
    
    // Check if line contains patterns that should trigger re-rendering
    function shouldReRender(text) {
        return (
            /^#{1,6}\s/.test(text) ||           // Headers
            /^[\-\*]\s/.test(text) ||            // Lists
            /\*\*[^*]+\*\*/.test(text) ||        // Bold
            /\*[^*]+\*/.test(text) ||            // Italic
            /~~.+?~~/.test(text) ||              // Strikethrough
            /`[^`]+`/.test(text) ||              // Inline code
            /\[.+?\]\(.+?\)/.test(text)          // Links
        );
    }

    // Get current line text
    function getCurrentLineText() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return '';

        const range = selection.getRangeAt(0);
        let node = range.startContainer;

        // Find the block-level element
        while (node && node !== editor) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                const tag = node.tagName.toLowerCase();
                if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li'].includes(tag)) {
                    return node.textContent || '';
                }
            }
            node = node.parentNode;
        }

        return '';
    }

    // Handle typing - let the browser handle bold/italic naturally
    editor.addEventListener('input', () => {
        if (!isInternalUpdate) {
            const markdown = htmlToMarkdown(editor);
            vscode.postMessage({
                type: 'edit',
                text: markdown
            });

            // Check if we should re-render
            const currentLine = getCurrentLineText();
            if (shouldReRender(currentLine)) {
                // Small delay to let the character get added
                setTimeout(() => {
                    const cursorPos = getCursorOffset();

                    isInternalUpdate = true;
                    editor.innerHTML = markdownToHtml(markdown);
                    isInternalUpdate = false;

                    requestAnimationFrame(() => {
                        setCursorOffset(Math.min(cursorPos, editor.textContent.length));
                    });
                }, 10);
            }
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