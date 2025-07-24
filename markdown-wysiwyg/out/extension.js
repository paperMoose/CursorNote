"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const markdownEditor_1 = require("./markdownEditor");
function activate(context) {
    const provider = new markdownEditor_1.MarkdownEditorProvider(context);
    const registration = vscode.window.registerCustomEditorProvider('markdownWysiwyg.editor', provider, {
        webviewOptions: {
            retainContextWhenHidden: true,
        },
        supportsMultipleEditorsPerDocument: false,
    });
    context.subscriptions.push(registration);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map