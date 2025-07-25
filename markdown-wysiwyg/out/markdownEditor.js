"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarkdownEditorProvider = void 0;
const vscode = require("vscode");
class MarkdownEditorProvider {
    constructor(context) {
        this.context = context;
    }
    async resolveCustomTextEditor(document, webviewPanel, _token) {
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this.context.extensionUri, 'media'),
                vscode.Uri.joinPath(this.context.extensionUri, 'node_modules')
            ]
        };
        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);
        function updateWebview() {
            webviewPanel.webview.postMessage({
                type: 'update',
                text: document.getText(),
            });
        }
        // Track if we're making edits to prevent loops
        let makingEdit = false;
        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.toString() === document.uri.toString() && !makingEdit) {
                updateWebview();
            }
        });
        webviewPanel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
        });
        webviewPanel.webview.onDidReceiveMessage(async (e) => {
            switch (e.type) {
                case 'edit':
                    makingEdit = true;
                    await this.updateTextDocument(document, e.text);
                    makingEdit = false;
                    return;
                case 'openFile':
                    const filePath = e.path;
                    let fileUri;
                    // Handle different path types
                    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
                        // External URL
                        vscode.env.openExternal(vscode.Uri.parse(filePath));
                        return;
                    }
                    else if (filePath.startsWith('/')) {
                        // Absolute path
                        fileUri = vscode.Uri.file(filePath);
                    }
                    else {
                        // Relative path - resolve from current document's directory
                        const currentDir = vscode.Uri.joinPath(document.uri, '..');
                        fileUri = vscode.Uri.joinPath(currentDir, filePath);
                    }
                    try {
                        // Check if file exists
                        await vscode.workspace.fs.stat(fileUri);
                        // Try to open as text document
                        const doc = await vscode.workspace.openTextDocument(fileUri);
                        await vscode.window.showTextDocument(doc, { preview: false });
                    }
                    catch (error) {
                        // If file doesn't exist, try from workspace root
                        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
                            const workspaceRoot = vscode.workspace.workspaceFolders[0].uri;
                            const workspaceFileUri = vscode.Uri.joinPath(workspaceRoot, filePath);
                            try {
                                const doc = await vscode.workspace.openTextDocument(workspaceFileUri);
                                await vscode.window.showTextDocument(doc, { preview: false });
                            }
                            catch (err) {
                                vscode.window.showErrorMessage(`Could not open file: ${filePath}`);
                            }
                        }
                        else {
                            vscode.window.showErrorMessage(`Could not open file: ${filePath}`);
                        }
                    }
                    return;
            }
        });
        updateWebview();
    }
    getHtmlForWebview(webview) {
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'editor.css'));
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'editor-simple.js'));
        const nonce = getNonce();
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} https: data:; connect-src ${webview.cspSource};">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${styleUri}" rel="stylesheet">
                <title>Markdown Editor</title>
            </head>
            <body>
                <div id="editor" contenteditable="true"></div>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }
    updateTextDocument(document, text) {
        const edit = new vscode.WorkspaceEdit();
        // Replace the entire document content
        const firstLine = document.lineAt(0);
        const lastLine = document.lineAt(document.lineCount - 1);
        const range = new vscode.Range(firstLine.range.start, lastLine.range.end);
        edit.replace(document.uri, range, text);
        return vscode.workspace.applyEdit(edit);
    }
}
exports.MarkdownEditorProvider = MarkdownEditorProvider;
MarkdownEditorProvider.viewType = 'markdownWysiwyg.editor';
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
//# sourceMappingURL=markdownEditor.js.map