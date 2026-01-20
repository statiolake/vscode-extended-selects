import * as assert from 'node:assert';
import * as vscode from 'vscode';
import { Position } from 'vscode';
import { getTextObjectById } from '../../textObject/textObjects';

suite('Paragraph Text Objects (ip/ap)', () => {
    suite('ip (inner paragraph)', () => {
        test('should select current paragraph in middle of text', async () => {
            const content = 'first paragraph\nstill first\n\nsecond paragraph\nstill second\n\nthird paragraph';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-paragraph');
            assert.ok(textObject, 'Should find inner-paragraph text object');

            const position = new Position(3, 5);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, 'second paragraph\nstill second\n', 'Should select only the second paragraph');
        });

        test('should select first paragraph', async () => {
            const content = 'first paragraph\nstill first\n\nsecond paragraph';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-paragraph');
            assert.ok(textObject, 'Should find inner-paragraph text object');

            const position = new Position(0, 0);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, 'first paragraph\nstill first\n', 'Should select first paragraph');
        });

        test('should select last paragraph', async () => {
            const content = 'first paragraph\n\nlast paragraph\nstill last';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-paragraph');
            assert.ok(textObject, 'Should find inner-paragraph text object');

            const position = new Position(2, 5);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, 'last paragraph\nstill last', 'Should select last paragraph');
        });

        test('should select single line paragraph', async () => {
            const content = 'first\n\nsingle line\n\nlast';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-paragraph');
            assert.ok(textObject, 'Should find inner-paragraph text object');

            const position = new Position(2, 3);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, 'single line\n', 'Should select single line paragraph');
        });

        test('should select entire document when no blank lines', async () => {
            const content = 'line 1\nline 2\nline 3';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-paragraph');
            assert.ok(textObject, 'Should find inner-paragraph text object');

            const position = new Position(1, 3);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, 'line 1\nline 2\nline 3', 'Should select entire document');
        });

        test('should handle cursor on blank line', async () => {
            const content = 'first\n\nsecond';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-paragraph');
            assert.ok(textObject, 'Should find inner-paragraph text object');

            const position = new Position(1, 0);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, '\n', 'Should select just the newline when on blank line');
        });
    });

    suite('ap (around paragraph)', () => {
        test('should select current paragraph including trailing blank line', async () => {
            const content = 'first paragraph\nstill first\n\nsecond paragraph\nstill second\n\nthird paragraph';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('around-paragraph');
            assert.ok(textObject, 'Should find around-paragraph text object');

            const position = new Position(3, 5);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(
                text,
                'second paragraph\nstill second\n\n',
                'Should select paragraph with trailing blank line',
            );
        });

        test('should select first paragraph including trailing blank line', async () => {
            const content = 'first paragraph\nstill first\n\nsecond paragraph';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('around-paragraph');
            assert.ok(textObject, 'Should find around-paragraph text object');

            const position = new Position(0, 0);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(
                text,
                'first paragraph\nstill first\n\n',
                'Should select first paragraph with trailing blank line',
            );
        });

        test('should select last paragraph without extra blank line', async () => {
            const content = 'first paragraph\n\nlast paragraph\nstill last';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('around-paragraph');
            assert.ok(textObject, 'Should find around-paragraph text object');

            const position = new Position(2, 5);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, 'last paragraph\nstill last', 'Should select last paragraph only');
        });

        test('should handle multiple blank lines', async () => {
            const content = 'first\n\n\nsecond';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('around-paragraph');
            assert.ok(textObject, 'Should find around-paragraph text object');

            const position = new Position(0, 0);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, 'first\n\n', 'Should select paragraph with one trailing blank line');
        });
    });

    suite('Edge cases', () => {
        test('should handle empty document', async () => {
            const content = '';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-paragraph');
            assert.ok(textObject, 'Should find inner-paragraph text object');

            const position = new Position(0, 0);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, '', 'Should return empty range for empty document');
        });

        test('should handle document with only blank lines', async () => {
            const content = '\n\n\n';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-paragraph');
            assert.ok(textObject, 'Should find inner-paragraph text object');

            const position = new Position(1, 0);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, '\n', 'Should return just newline when on blank line');
        });

        test('should handle single line document', async () => {
            const content = 'single line';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-paragraph');
            assert.ok(textObject, 'Should find inner-paragraph text object');

            const position = new Position(0, 5);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, 'single line', 'Should select entire line');
        });
    });
});
