import * as vscode from 'vscode';
import { MarkdownEditorProvider } from './markdownEditor';

export function activate(context: vscode.ExtensionContext) {
    const provider = new MarkdownEditorProvider(context);
    
    const registration = vscode.window.registerCustomEditorProvider(
        'markdownWysiwyg.editor',
        provider,
        {
            webviewOptions: {
                retainContextWhenHidden: true,
            },
            supportsMultipleEditorsPerDocument: false,
        }
    );
    
    context.subscriptions.push(registration);
}

export function deactivate() {}