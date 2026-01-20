import { Position, Range, type TextDocument } from 'vscode';
import { TextCursor } from './textCursor';
import { getCharacterType, getWordTypePriority, isCharacterTypeBoundary, isWhitespace } from './unicode';

/**
 * 次の文字の位置を探す
 */
export function findAdjacentPosition(
    document: TextDocument,
    direction: 'before' | 'after',
    position: Position,
): Position {
    let offset = document.offsetAt(position);
    offset += direction === 'before' ? -1 : 1;
    return document.validatePosition(document.positionAt(offset));
}

export function findNearerPosition(
    document: TextDocument,
    predicate: (character: string) => boolean,
    direction: 'before' | 'after',
    position: Position,
    opts: {
        withinLine: boolean;
        maxOffsetWidth?: number;
    },
): Position | undefined {
    const cursor = TextCursor.fromDocument(document, position);
    return findNearerPositionWithCursor(cursor, predicate, direction, opts);
}

/**
 * TextCursor を使用して次の文字の位置を探す
 */
export function findNearerPositionWithCursor(
    cursor: TextCursor,
    predicate: (character: string) => boolean,
    direction: 'before' | 'after',
    opts: {
        withinLine: boolean;
        maxOffsetWidth?: number;
    },
): Position | undefined {
    const document = cursor.getDocument();
    const maxOffsetWidth = opts.maxOffsetWidth ?? Infinity;

    const position = cursor.getPosition();
    let offset = cursor.getOffset();
    const line = document.lineAt(position.line);
    const minOffset = opts.withinLine ? document.offsetAt(line.range.start) : Math.max(0, offset - maxOffsetWidth);
    const maxOffset = opts.withinLine
        ? document.offsetAt(line.range.end)
        : Math.min(cursor.getTextLength(), offset + maxOffsetWidth);
    const delta: 1 | -1 = direction === 'before' ? -1 : 1;

    while (minOffset <= Math.min(offset, offset + delta) && Math.max(offset, offset + delta) <= maxOffset) {
        const char = cursor.peek(delta);
        if (predicate(char)) return document.positionAt(offset);
        offset += delta;
        cursor.moveTo(offset);
    }

    return undefined;
}

export function findDocumentStart(_document: TextDocument): Position {
    return new Position(0, 0);
}

export function findDocumentEnd(document: TextDocument): Position {
    const lastLineIndex = document.lineCount - 1;
    const lastLine = document.lineAt(lastLineIndex);
    return lastLine.range.end;
}

/**
 * iw コマンド用の賢い単語選択
 */
export function findInnerWordAtBoundary(document: TextDocument, position: Position): Range {
    const cursor = TextCursor.fromDocument(document, position);

    let start = findWordBoundaryWithCursor(cursor.clone(), 'further', 'before', isCharacterTypeBoundary);
    let end = findWordBoundaryWithCursor(cursor.clone(), 'further', 'after', isCharacterTypeBoundary);

    if (start && end && !start.isEqual(end)) {
        return new Range(start, end);
    }

    const charBefore = cursor.peek(-1);
    const charAfter = cursor.peek(1);

    if (!charBefore && !charAfter) {
        return new Range(position, position);
    }

    const typeBefore = charBefore ? getCharacterType(charBefore) : 'whitespace';
    const typeAfter = charAfter ? getCharacterType(charAfter) : 'whitespace';
    const priorityBefore = getWordTypePriority(typeBefore);
    const priorityAfter = getWordTypePriority(typeAfter);

    if (priorityBefore === 0 && priorityAfter === 0) {
        return new Range(position, position);
    }

    const moveRight = priorityAfter >= priorityBefore;

    if (moveRight) {
        const nextCursor = cursor.clone();
        nextCursor.move(1);
        end = findWordBoundaryWithCursor(nextCursor, 'further', 'after', isCharacterTypeBoundary);
        if (end) {
            return new Range(position, end);
        }
    } else {
        const prevCursor = cursor.clone();
        prevCursor.move(-1);
        start = findWordBoundaryWithCursor(prevCursor, 'further', 'before', isCharacterTypeBoundary);
        if (start) {
            return new Range(start, position);
        }
    }

    return new Range(position, position);
}

/**
 * 単語境界を探す
 */
export function findWordBoundary(
    document: TextDocument,
    distance: 'nearer' | 'further',
    direction: 'before' | 'after',
    position: Position,
    isBoundary: (char1: string, char2: string) => boolean,
): Position | undefined {
    const cursor = TextCursor.fromDocument(document, position);
    return findWordBoundaryWithCursor(cursor, distance, direction, isBoundary);
}

/**
 * TextCursor を使用して単語境界を探す
 */
export function findWordBoundaryWithCursor(
    cursor: TextCursor,
    distance: 'nearer' | 'further',
    direction: 'before' | 'after',
    isBoundary: (char1: string, char2: string) => boolean,
): Position | undefined {
    const delta: 1 | -1 = direction === 'before' ? -1 : 1;
    const reverseDelta: 1 | -1 = direction === 'before' ? 1 : -1;

    const skipWhile = (cond: (char: string) => boolean) => {
        while (true) {
            const char = cursor.peek(delta);
            if (!char || !cond(char)) break;
            cursor.move(delta);
        }
    };

    if (distance === 'nearer') {
        const previousChar = cursor.peek(reverseDelta);
        skipWhile((char) => !isBoundary(previousChar, char));
        skipWhile(isWhitespace);
    } else {
        const previousChar = cursor.peek(reverseDelta);
        if (isWhitespace(previousChar)) {
            skipWhile(isWhitespace);
            const currentChar = cursor.peek(delta);
            skipWhile((char) => !isBoundary(currentChar, char));
        } else {
            skipWhile((char) => !isBoundary(previousChar, char));
        }
    }

    return cursor.getPosition();
}

/**
 * 段落境界を探す（内部ヘルパー関数）
 */
function findBlankLineBoundary(
    document: TextDocument,
    direction: 'before' | 'after',
    startLine: number,
): number | undefined {
    const delta = direction === 'before' ? -1 : 1;
    let line = startLine;

    while (0 <= line + delta && line + delta < document.lineCount) {
        const nextLineText = document.lineAt(line + delta).text;
        if (nextLineText.trim() === '') {
            return line + delta;
        }
        line += delta;
    }

    return undefined;
}

/**
 * 段落の範囲を探す（inner paragraph 用）
 */
export function findInnerParagraph(document: TextDocument, position: Position): Range {
    if (document.lineCount === 0) {
        return new Range(position, position);
    }

    const currentLine = document.lineAt(position.line);
    if (currentLine.text.trim() === '') {
        if (position.line < document.lineCount - 1) {
            return new Range(new Position(position.line, 0), new Position(position.line + 1, 0));
        } else {
            return new Range(new Position(position.line, 0), new Position(position.line, 0));
        }
    }

    const startBlankLine = findBlankLineBoundary(document, 'before', position.line);
    const startLine = startBlankLine !== undefined ? startBlankLine + 1 : 0;

    const endBlankLine = findBlankLineBoundary(document, 'after', position.line);
    let endLine: number;
    if (endBlankLine !== undefined) {
        endLine = endBlankLine - 1;
    } else {
        endLine = document.lineCount - 1;
    }

    const start = new Position(startLine, 0);
    let end: Position;
    if (endLine < document.lineCount - 1) {
        end = new Position(endLine + 1, 0);
    } else {
        end = new Position(endLine, document.lineAt(endLine).range.end.character);
    }

    return new Range(start, end);
}

/**
 * 段落の範囲を探す（around paragraph 用）
 */
export function findAroundParagraph(document: TextDocument, position: Position): Range {
    if (document.lineCount === 0) {
        return new Range(position, position);
    }

    const currentLine = document.lineAt(position.line);
    if (currentLine.text.trim() === '') {
        if (position.line < document.lineCount - 1) {
            return new Range(new Position(position.line, 0), new Position(position.line + 1, 0));
        } else {
            return new Range(new Position(position.line, 0), new Position(position.line, 0));
        }
    }

    const startBlankLine = findBlankLineBoundary(document, 'before', position.line);
    const startLine = startBlankLine !== undefined ? startBlankLine + 1 : 0;

    const endBlankLine = findBlankLineBoundary(document, 'after', position.line);

    const start = new Position(startLine, 0);
    let end: Position;

    if (endBlankLine !== undefined) {
        if (endBlankLine < document.lineCount - 1) {
            end = new Position(endBlankLine + 1, 0);
        } else {
            end = new Position(endBlankLine, 0);
        }
    } else {
        const lastLine = document.lineCount - 1;
        end = new Position(lastLine, document.lineAt(lastLine).range.end.character);
    }

    return new Range(start, end);
}

export function findInsideBalancedPairs(
    document: TextDocument,
    position: Position,
    open: string,
    close: string,
): Range | undefined {
    const computeDegree = (text: string): number => {
        let degree = 0;
        for (const char of text) {
            if (char === open) degree++;
            if (char === close) degree--;
        }
        return degree;
    };

    const findBalancedNearerPosition = (direction: 'before' | 'after') => {
        const findTarget = direction === 'before' ? open : close;
        let nextPosition = position;
        let foundAt: Position | undefined;
        while (true) {
            foundAt = findNearerPosition(document, (char) => char === findTarget, direction, nextPosition, {
                withinLine: false,
                maxOffsetWidth: 100000,
            });
            if (!foundAt) return undefined;

            if (computeDegree(document.getText(new Range(position, foundAt))) === 0) {
                return foundAt;
            }

            nextPosition = findAdjacentPosition(document, direction, foundAt);
        }
    };

    const foundAtBefore = findBalancedNearerPosition('before');
    const foundAtAfter = findBalancedNearerPosition('after');
    if (!foundAtBefore || !foundAtAfter) return undefined;

    return new Range(foundAtBefore, foundAtAfter);
}

/**
 * タグペア情報を返す型
 */
export type TagPairInfo = {
    innerRange: Range;
    outerRange: Range;
};

/**
 * タグペアを検索し、内部と外部の範囲を返す
 */
export function findMatchingTag(document: TextDocument, position: Position): TagPairInfo | undefined {
    const openingTag = scanForTag(document, position, 'before');
    if (!openingTag) return undefined;

    const closingTag = scanForTag(document, document.positionAt(openingTag.tagEnd), 'after', openingTag.tagName);
    if (!closingTag) return undefined;

    return {
        innerRange: new Range(document.positionAt(openingTag.tagEnd), document.positionAt(closingTag.tagStart)),
        outerRange: new Range(document.positionAt(openingTag.tagStart), document.positionAt(closingTag.tagEnd)),
    };
}

/**
 * タグをスキャンして探す
 */
function scanForTag(
    document: TextDocument,
    position: Position,
    direction: 'before' | 'after',
    targetTagName?: string,
): { tagName: string; tagStart: number; tagEnd: number } | undefined {
    const cursor = TextCursor.fromDocument(document, position);
    const tagStack: string[] = [];
    let currentPos = position;

    while (true) {
        const nextBracket =
            direction === 'before'
                ? findNearerPosition(document, (ch) => ch === '>', direction, currentPos, { withinLine: false })
                : findNearerPosition(document, (ch) => ch === '<', direction, currentPos, { withinLine: false });

        if (!nextBracket) return undefined;

        const tagRange = findTagRangeAt(document, nextBracket, direction);
        if (!tagRange) {
            currentPos = findAdjacentPosition(document, direction, nextBracket);
            continue;
        }

        const tagStart = document.offsetAt(tagRange.start);
        const tagEnd = document.offsetAt(tagRange.end);
        const tagContent = cursor.getTextByAbsoluteOffset(tagStart, tagEnd).trim();
        const tagInfo = parseTagContent(tagContent);

        if (!tagInfo || tagInfo.isSelfClosing) {
            currentPos = findAdjacentPosition(document, direction, nextBracket);
            continue;
        }

        const { tagName, isOpeningTag } = tagInfo;

        if (direction === 'before') {
            if (isOpeningTag) {
                if (tagStack.length === 0) {
                    return { tagName, tagStart: tagStart - 1, tagEnd: tagEnd + 1 };
                }
                if (tagStack[tagStack.length - 1] === tagName) {
                    tagStack.pop();
                }
            } else {
                tagStack.push(tagName);
            }
        } else {
            if (isOpeningTag) {
                if (tagName === targetTagName) {
                    tagStack.push(tagName);
                }
            } else {
                if (tagName === targetTagName) {
                    if (tagStack.length === 0) {
                        return { tagName, tagStart: tagStart - 1, tagEnd: tagEnd + 1 };
                    }
                    tagStack.pop();
                }
            }
        }

        currentPos = findAdjacentPosition(document, direction, nextBracket);
    }
}

function findTagRangeAt(
    document: TextDocument,
    bracketPos: Position,
    direction: 'before' | 'after',
): Range | undefined {
    const insidePos = findAdjacentPosition(document, direction === 'before' ? 'before' : 'after', bracketPos);
    return findInsideBalancedPairs(document, insidePos, '<', '>');
}

function parseTagContent(
    content: string,
): { tagName: string; isOpeningTag: boolean; isSelfClosing: boolean } | undefined {
    if (!content) return undefined;

    if (content.startsWith('/')) {
        const tagName = extractTagName(content.substring(1));
        if (!tagName) return undefined;
        return { tagName, isOpeningTag: false, isSelfClosing: false };
    }

    const isSelfClosing = content.endsWith('/');
    const contentToCheck = isSelfClosing ? content.substring(0, content.length - 1) : content;

    const tagName = extractTagName(contentToCheck);
    if (!tagName) return undefined;

    return { tagName, isOpeningTag: true, isSelfClosing };
}

function extractTagName(content: string): string {
    const match = content.match(/^([a-zA-Z][a-zA-Z0-9-]*)/);
    return match ? match[1] : '';
}

/**
 * 引数の範囲情報
 */
type ArgumentRanges = {
    inner: OffsetRange;
    outer: OffsetRange;
};

/**
 * 括弧/ブレース内のすべての引数の範囲を計算する
 */
function findAllArgumentRanges(document: TextDocument, containerRange: Range): ArgumentRanges[] {
    const cursor = TextCursor.fromDocument(document, containerRange.start);
    const startOffset = document.offsetAt(containerRange.start);
    const endOffset = document.offsetAt(containerRange.end);

    const commaOffsets: number[] = [];
    cursor.moveTo(startOffset);

    while (cursor.getOffset() < endOffset) {
        const char = cursor.peek(1);

        if (char === '"' || char === "'") {
            const quoteChar = char;
            cursor.move(1);
            while (cursor.getOffset() < endOffset) {
                const c = cursor.peek(1);
                if (c === '\\') {
                    cursor.move(2);
                    continue;
                }
                if (c === quoteChar) {
                    cursor.move(1);
                    break;
                }
                cursor.move(1);
            }
            continue;
        }

        if (char === '(' || char === '[' || char === '{') {
            const closeChar = char === '(' ? ')' : char === '[' ? ']' : '}';
            let depth = 1;
            cursor.move(1);
            while (cursor.getOffset() < endOffset && depth > 0) {
                const c = cursor.peek(1);
                if (c === char) depth++;
                else if (c === closeChar) depth--;
                cursor.move(1);
            }
            continue;
        }

        if (char === ',') {
            commaOffsets.push(cursor.getOffset());
        }

        cursor.move(1);
    }

    const argumentRanges: ArgumentRanges[] = [];
    const boundaries = [startOffset - 1, ...commaOffsets, endOffset];

    for (let i = 0; i < boundaries.length - 1; i++) {
        const leftBoundary = boundaries[i];
        const rightBoundary = boundaries[i + 1];

        let innerStart = leftBoundary + 1;
        let innerEnd = rightBoundary;

        cursor.moveTo(innerStart);
        while (innerStart < innerEnd && isWhitespace(cursor.peek(1))) {
            innerStart++;
            cursor.move(1);
        }

        cursor.moveTo(innerEnd);
        while (innerEnd > innerStart && isWhitespace(cursor.peek(-1))) {
            innerEnd--;
            cursor.move(-1);
        }

        const isFirstArg = i === 0;
        const isLastArg = i === boundaries.length - 2;

        let outerStart = leftBoundary + 1;
        let outerEnd = innerEnd;

        if (isFirstArg && !isLastArg) {
            outerEnd = rightBoundary + 1;
        } else if (!isFirstArg) {
            outerStart = leftBoundary;
        }

        argumentRanges.push({
            inner: new OffsetRange(innerStart, innerEnd),
            outer: new OffsetRange(outerStart, outerEnd),
        });
    }

    return argumentRanges;
}

function findArgumentIndexAtCursor(cursorOffset: number, argumentRanges: ArgumentRanges[]): number | undefined {
    for (let i = 0; i < argumentRanges.length; i++) {
        const arg = argumentRanges[i];
        if (arg.inner.startOffset <= cursorOffset && cursorOffset <= arg.inner.endOffset) {
            return i;
        }
    }
    return undefined;
}

/**
 * 現在位置の引数の範囲を探す
 */
export function findCurrentArgument(
    document: TextDocument,
    position: Position,
    opts?: { includeComma?: boolean },
): Range | undefined {
    let containerRange = findInsideBalancedPairs(document, position, '(', ')');
    const braceRange = findInsideBalancedPairs(document, position, '{', '}');

    if (containerRange && braceRange) {
        const parenSize = document.offsetAt(containerRange.end) - document.offsetAt(containerRange.start);
        const braceSize = document.offsetAt(braceRange.end) - document.offsetAt(braceRange.start);
        containerRange = parenSize <= braceSize ? containerRange : braceRange;
    } else if (braceRange) {
        containerRange = braceRange;
    }

    if (!containerRange) return undefined;

    const argumentRanges = findAllArgumentRanges(document, containerRange);

    const cursorOffset = document.offsetAt(position);
    const argIndex = findArgumentIndexAtCursor(cursorOffset, argumentRanges);

    if (argIndex === undefined) return undefined;

    const arg = argumentRanges[argIndex];

    if (opts?.includeComma) {
        return arg.outer.toRange(document);
    } else {
        return arg.inner.toRange(document);
    }
}

export class OffsetRange {
    startOffset: number;
    endOffset: number;

    constructor(startOffset: number, endOffset: number) {
        this.startOffset = startOffset;
        this.endOffset = endOffset;
    }

    with(updates: { startOffset?: number; endOffset?: number }): OffsetRange {
        return new OffsetRange(updates.startOffset ?? this.startOffset, updates.endOffset ?? this.endOffset);
    }

    static fromRange(document: TextDocument, range: Range): OffsetRange {
        return new OffsetRange(document.offsetAt(range.start), document.offsetAt(range.end));
    }

    toRange(document: TextDocument): Range {
        return new Range(document.positionAt(this.startOffset), document.positionAt(this.endOffset));
    }
}

/**
 * 行のインデントレベル（先頭の空白文字数）を取得
 */
function getIndentLevel(document: TextDocument, lineNumber: number): number {
    const line = document.lineAt(lineNumber);
    const text = line.text;
    let indent = 0;
    for (const char of text) {
        if (char === ' ') {
            indent++;
        } else if (char === '\t') {
            indent += 4; // タブは4スペースとして扱う
        } else {
            break;
        }
    }
    return indent;
}

/**
 * 行が空行かどうかを判定
 */
function isBlankLine(document: TextDocument, lineNumber: number): boolean {
    return document.lineAt(lineNumber).text.trim() === '';
}

/**
 * 同じインデントレベルのブロックを探す
 * カーソル位置の行のインデントレベル以上の連続した行を選択
 */
export function findIndentBlock(document: TextDocument, position: Position): Range {
    if (document.lineCount === 0) {
        return new Range(position, position);
    }

    const currentLine = position.line;

    // 空行の場合はその行だけを返す
    if (isBlankLine(document, currentLine)) {
        if (currentLine < document.lineCount - 1) {
            return new Range(new Position(currentLine, 0), new Position(currentLine + 1, 0));
        } else {
            return new Range(new Position(currentLine, 0), document.lineAt(currentLine).range.end);
        }
    }

    const baseIndent = getIndentLevel(document, currentLine);

    // 上方向に探索
    let startLine = currentLine;
    while (startLine > 0) {
        const prevLine = startLine - 1;
        if (isBlankLine(document, prevLine)) {
            break;
        }
        const indent = getIndentLevel(document, prevLine);
        if (indent < baseIndent) {
            break;
        }
        startLine = prevLine;
    }

    // 下方向に探索
    let endLine = currentLine;
    while (endLine < document.lineCount - 1) {
        const nextLine = endLine + 1;
        if (isBlankLine(document, nextLine)) {
            break;
        }
        const indent = getIndentLevel(document, nextLine);
        if (indent < baseIndent) {
            break;
        }
        endLine = nextLine;
    }

    // 範囲を構築
    const start = new Position(startLine, 0);
    let end: Position;
    if (endLine < document.lineCount - 1) {
        end = new Position(endLine + 1, 0);
    } else {
        end = document.lineAt(endLine).range.end;
    }

    return new Range(start, end);
}
