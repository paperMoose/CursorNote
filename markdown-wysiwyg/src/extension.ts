import * as vscode from 'vscode';
import { MarkdownEditorProvider } from './markdownEditor';

export function activate(context: vscode.ExtensionContext) {
    console.log('[markdown-wysiwyg] Extension activating');

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

    const openListener = vscode.workspace.onDidOpenTextDocument(doc => {
        console.log(`[markdown-wysiwyg] TextDocument opened: ${doc.uri.toString()}`);
    });

    const closeListener = vscode.workspace.onDidCloseTextDocument(doc => {
        console.log(`[markdown-wysiwyg] TextDocument closed: ${doc.uri.toString()}`);
    });

    context.subscriptions.push(openListener, closeListener);
}

export function deactivate() {}