(function() {
    const vscode = acquireVsCodeApi();
    const editor = document.getElementById('editor');
    
    // Initialize modules
    const parser = new window.MarkdownParser();
    const converter = new window.HtmlToMarkdownConverter();
    const cursorManager = new window.CursorManager(editor);
    const patterns = window.markdownPatterns;
    
    let isInternalUpdate = false;
    let currentMarkdown = '';
    
    // Handle messages from VS Code extension
    window.addEventListener('message', event => {
        const message = event.data;
        if (message.type === 'update') {
            if (message.text !== currentMarkdown) {
                currentMarkdown = message.text;
                isInternalUpdate = true;
                editor.innerHTML = parser.parse(message.text);
                isInternalUpdate = false;
            }
        }
    });
    
    // Handle editor input
    editor.addEventListener('input', (e) => {
        if (!isInternalUpdate) {
            const markdown = converter.convert(editor);
            currentMarkdown = markdown;
            
            // Send update to VS Code
            vscode.postMessage({
                type: 'edit',
                text: markdown
            });
            
            // Check if we should render
            const lineInfo = cursorManager.getCurrentLineInfo();
            if (lineInfo && patterns.shouldRender(lineInfo.currentLine, lineInfo.textBeforeCursor)) {
                // Small delay to let the character get added
                setTimeout(() => {
                    const position = cursorManager.getPosition();
                    
                    isInternalUpdate = true;
                    editor.innerHTML = parser.parse(markdown);
                    isInternalUpdate = false;
                    
                    cursorManager.restorePosition(position);
                }, 10);
            }
        }
    });
    
    // Handle checkbox changes
    editor.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox' && !isInternalUpdate) {
            const markdown = converter.convert(editor);
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
                        
                        ul.parentNode.insertBefore(p, ul.nextSibling);
                        
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
                        
                        listItem.parentNode.insertBefore(newLi, listItem.nextSibling);
                        
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
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'b':
                    e.preventDefault();
                    document.execCommand('bold');
                    break;
                case 'i':
                    e.preventDefault();
                    document.execCommand('italic');
                    break;
            }
        }
    });
    
    // Focus editor on load
    editor.focus();
})();