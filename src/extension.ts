import * as vscode from 'vscode';
import { createQuickPickItems, getTextObjectById, textObjectDefinitions } from './textObject/textObjects';
import type { TextObjectId } from './textObject/textObjectTypes';

/**
 * 選択を実行する
 */
async function executeSelection(editor: vscode.TextEditor, textObjectId: TextObjectId): Promise<void> {
    const textObject = getTextObjectById(textObjectId);
    if (!textObject) {
        vscode.window.showErrorMessage(`Unknown text object: ${textObjectId}`);
        return;
    }

    const document = editor.document;
    const newSelections: vscode.Selection[] = [];

    for (const selection of editor.selections) {
        const position = selection.active;
        const range = textObject.compute(document, position);

        if (range && !range.isEmpty) {
            newSelections.push(new vscode.Selection(range.start, range.end));
        } else {
            // Keep the original selection if no match found
            newSelections.push(selection);
        }
    }

    if (newSelections.length > 0) {
        editor.selections = newSelections;
        editor.revealRange(newSelections[0], vscode.TextEditorRevealType.InCenterIfOutsideViewport);
    }
}

/**
 * QuickPick を表示してテキストオブジェクトを選択
 */
async function showQuickPick(editor: vscode.TextEditor): Promise<void> {
    const allItems = createQuickPickItems();

    const quickPick = vscode.window.createQuickPick<(typeof allItems)[0]>();
    quickPick.items = allItems;
    quickPick.placeholder = 'Select a text object (type to filter, case-sensitive for uppercase)';

    // カスタムフィルタリング:
    // 1. まず shortcut に対して case-sensitive でマッチ
    // 2. ヒットしなければ label + description に対して case-insensitive fuzzy マッチ
    quickPick.onDidChangeValue((value) => {
        if (!value) {
            quickPick.items = allItems;
            return;
        }

        // Phase 1: shortcut (description) に対して case-sensitive prefix/exact マッチ
        const shortcutMatches = allItems.filter((item) => {
            // description は "iw" や "i( ib" のような形式
            const shortcuts = item.description.split(' ');
            return shortcuts.some((s) => s.startsWith(value));
        });

        if (shortcutMatches.length > 0) {
            quickPick.items = shortcutMatches;
            return;
        }

        // Phase 2: case-insensitive fuzzy マッチ (label + description)
        const fuzzyMatches = allItems.filter((item) => {
            const target = `${item.label} ${item.description}`.toLowerCase();
            return target.includes(value.toLowerCase());
        });
        quickPick.items = fuzzyMatches;
    });

    return new Promise((resolve) => {
        quickPick.onDidAccept(async () => {
            const selected = quickPick.selectedItems[0];
            if (selected) {
                quickPick.hide();
                await executeSelection(editor, selected.id);
            }
            resolve();
        });

        quickPick.onDidHide(() => {
            quickPick.dispose();
            resolve();
        });

        quickPick.show();
    });
}

/**
 * extended-selects.select コマンドのハンドラ
 */
async function selectCommand(args?: { textObject?: TextObjectId }): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active text editor');
        return;
    }

    if (args?.textObject) {
        // 引数が渡された場合は直接実行
        await executeSelection(editor, args.textObject);
    } else {
        // 引数なしの場合は QuickPick を表示
        await showQuickPick(editor);
    }
}

export function activate(context: vscode.ExtensionContext): void {
    // メインコマンドの登録
    const selectDisposable = vscode.commands.registerCommand('extended-selects.select', selectCommand);
    context.subscriptions.push(selectDisposable);

    // 個別のテキストオブジェクトコマンドも登録（キーバインド用）
    for (const def of textObjectDefinitions) {
        const commandId = `extended-selects.select.${def.id}`;
        const disposable = vscode.commands.registerCommand(commandId, async () => {
            await selectCommand({ textObject: def.id });
        });
        context.subscriptions.push(disposable);
    }
}

export function deactivate(): void {
    // Cleanup if needed
}
