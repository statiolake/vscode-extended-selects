import type { Position, Range, TextDocument } from 'vscode';

/**
 * テキストオブジェクトのID
 */
export type TextObjectId =
    | 'inner-word'
    | 'around-word'
    | 'inner-WORD'
    | 'around-WORD'
    | 'inner-paren'
    | 'around-paren'
    | 'inner-brace'
    | 'around-brace'
    | 'inner-bracket'
    | 'around-bracket'
    | 'inner-angle'
    | 'around-angle'
    | 'inner-double-quote'
    | 'around-double-quote'
    | 'inner-single-quote'
    | 'around-single-quote'
    | 'inner-backtick'
    | 'around-backtick'
    | 'inner-tag'
    | 'around-tag'
    | 'inner-paragraph'
    | 'around-paragraph'
    | 'inner-argument'
    | 'around-argument'
    | 'inner-entire'
    | 'around-entire';

/**
 * テキストオブジェクトの定義
 */
export interface TextObjectDefinition {
    id: TextObjectId;
    label: string;
    shortcut: string;
    compute: (document: TextDocument, position: Position) => Range | undefined;
}

/**
 * QuickPick で表示するアイテム
 */
export interface TextObjectQuickPickItem {
    label: string;
    description: string;
    id: TextObjectId;
}
