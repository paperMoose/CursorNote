"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const markdownEditor_1 = require("./markdownEditor");
function activate(context) {
    console.log('[markdown-wysiwyg] Extension activating');
    const provider = new markdownEditor_1.MarkdownEditorProvider(context);
    const registration = vscode.window.registerCustomEditorProvider('markdownWysiwyg.editor', provider, {
        webviewOptions: {
            retainContextWhenHidden: true,
        },
        supportsMultipleEditorsPerDocument: false,
    });
    context.subscriptions.push(registration);
    const openListener = vscode.workspace.onDidOpenTextDocument(doc => {
        console.log(`[markdown-wysiwyg] TextDocument opened: ${doc.uri.toString()}`);
    });
    const closeListener = vscode.workspace.onDidCloseTextDocument(doc => {
        console.log(`[markdown-wysiwyg] TextDocument closed: ${doc.uri.toString()}`);
    });
    context.subscriptions.push(openListener, closeListener);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map