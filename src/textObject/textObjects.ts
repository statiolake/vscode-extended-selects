import { type Position, Range, type TextDocument } from 'vscode';
import {
    findAdjacentPosition,
    findAroundParagraph,
    findCurrentArgument,
    findDocumentEnd,
    findDocumentStart,
    findInnerParagraph,
    findInnerWordAtBoundary,
    findInsideBalancedPairs,
    findMatchingTag,
    findWordBoundary,
} from '../utils/positionFinder';
import { isWhitespaceBoundary } from '../utils/unicode';
import type { TextObjectDefinition, TextObjectId, TextObjectQuickPickItem } from './textObjectTypes';

/**
 * 括弧系テキストオブジェクトを作成するヘルパー
 */
function createBracketTextObject(
    id: TextObjectId,
    label: string,
    shortcut: string,
    open: string,
    close: string,
    inner: boolean,
): TextObjectDefinition {
    return {
        id,
        label,
        shortcut,
        compute: (document: TextDocument, position: Position) => {
            const range = findInsideBalancedPairs(document, position, open, close);
            if (!range) return undefined;

            if (inner) {
                return range;
            } else {
                const startPos = findAdjacentPosition(document, 'before', range.start);
                const endPos = findAdjacentPosition(document, 'after', range.end);
                return new Range(startPos, endPos);
            }
        },
    };
}

/**
 * すべてのテキストオブジェクト定義
 */
export const textObjectDefinitions: TextObjectDefinition[] = [
    // Word text objects
    {
        id: 'inner-word',
        label: 'inner word',
        shortcut: 'iw',
        compute: (document, position) => findInnerWordAtBoundary(document, position),
    },
    {
        id: 'around-word',
        label: 'around word',
        shortcut: 'aw',
        compute: (document, position) => findInnerWordAtBoundary(document, position),
    },
    {
        id: 'inner-WORD',
        label: 'inner WORD',
        shortcut: 'iW',
        compute: (document, position) => {
            const start = findWordBoundary(document, 'further', 'before', position, isWhitespaceBoundary);
            const end = findWordBoundary(document, 'further', 'after', position, isWhitespaceBoundary);
            if (start && end) {
                return new Range(start, end);
            }
            return new Range(position, position);
        },
    },
    {
        id: 'around-WORD',
        label: 'around WORD',
        shortcut: 'aW',
        compute: (document, position) => {
            const start = findWordBoundary(document, 'further', 'before', position, isWhitespaceBoundary);
            const end = findWordBoundary(document, 'further', 'after', position, isWhitespaceBoundary);
            if (start && end) {
                return new Range(start, end);
            }
            return new Range(position, position);
        },
    },

    // Bracket text objects
    createBracketTextObject('inner-paren', 'inner paren () b', 'i( ib', '(', ')', true),
    createBracketTextObject('around-paren', 'around paren () b', 'a( ab', '(', ')', false),
    createBracketTextObject('inner-brace', 'inner brace {} B', 'i{ iB', '{', '}', true),
    createBracketTextObject('around-brace', 'around brace {} B', 'a{ aB', '{', '}', false),
    createBracketTextObject('inner-bracket', 'inner bracket []', 'i[ i]', '[', ']', true),
    createBracketTextObject('around-bracket', 'around bracket []', 'a[ a]', '[', ']', false),
    createBracketTextObject('inner-angle', 'inner angle <>', 'i< i>', '<', '>', true),
    createBracketTextObject('around-angle', 'around angle <>', 'a< a>', '<', '>', false),

    // Quote text objects
    createBracketTextObject('inner-double-quote', 'inner double quote "', 'i"', '"', '"', true),
    createBracketTextObject('around-double-quote', 'around double quote "', 'a"', '"', '"', false),
    createBracketTextObject('inner-single-quote', "inner single quote '", "i'", "'", "'", true),
    createBracketTextObject('around-single-quote', "around single quote '", "a'", "'", "'", false),
    createBracketTextObject('inner-backtick', 'inner backtick `', 'i`', '`', '`', true),
    createBracketTextObject('around-backtick', 'around backtick `', 'a`', '`', '`', false),

    // Tag text objects
    {
        id: 'inner-tag',
        label: 'inner tag t',
        shortcut: 'it',
        compute: (document, position) => {
            const tagInfo = findMatchingTag(document, position);
            return tagInfo?.innerRange;
        },
    },
    {
        id: 'around-tag',
        label: 'around tag t',
        shortcut: 'at',
        compute: (document, position) => {
            const tagInfo = findMatchingTag(document, position);
            return tagInfo?.outerRange;
        },
    },

    // Paragraph text objects
    {
        id: 'inner-paragraph',
        label: 'inner paragraph p',
        shortcut: 'ip',
        compute: (document, position) => findInnerParagraph(document, position),
    },
    {
        id: 'around-paragraph',
        label: 'around paragraph p',
        shortcut: 'ap',
        compute: (document, position) => findAroundParagraph(document, position),
    },

    // Argument text objects
    {
        id: 'inner-argument',
        label: 'inner argument a',
        shortcut: 'ia',
        compute: (document, position) => findCurrentArgument(document, position),
    },
    {
        id: 'around-argument',
        label: 'around argument a',
        shortcut: 'aa',
        compute: (document, position) => findCurrentArgument(document, position, { includeComma: true }),
    },

    // Entire document text objects
    {
        id: 'inner-entire',
        label: 'inner entire document e',
        shortcut: 'ie',
        compute: (document) => {
            const start = findDocumentStart(document);
            const end = findDocumentEnd(document);
            return new Range(start, end);
        },
    },
    {
        id: 'around-entire',
        label: 'around entire document e',
        shortcut: 'ae',
        compute: (document) => {
            const start = findDocumentStart(document);
            const end = findDocumentEnd(document);
            return new Range(start, end);
        },
    },
];

/**
 * ID からテキストオブジェクト定義を取得
 */
export function getTextObjectById(id: TextObjectId): TextObjectDefinition | undefined {
    return textObjectDefinitions.find((def) => def.id === id);
}

/**
 * QuickPick アイテムを生成
 */
export function createQuickPickItems(): TextObjectQuickPickItem[] {
    return textObjectDefinitions.map((def) => ({
        label: def.label,
        description: def.shortcut,
        id: def.id,
    }));
}
