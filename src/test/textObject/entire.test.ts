import * as assert from 'node:assert';
import * as vscode from 'vscode';
import { Position } from 'vscode';
import { getTextObjectById } from '../../textObject/textObjects';

suite('Entire Document Text Objects', () => {
    suite('ie/ae (inner/around entire)', () => {
        test('should select entire document', async () => {
            const content = 'line 1\nline 2\nline 3';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-entire');
            assert.ok(textObject, 'Should find inner-entire text object');

            const position = new Position(1, 3);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, 'line 1\nline 2\nline 3', 'Should select entire document');
        });

        test('should select entire document from any position', async () => {
            const content = 'first line\nsecond line\nthird line\nfourth line';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('around-entire');
            assert.ok(textObject, 'Should find around-entire text object');

            const position = new Position(3, 5);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(
                text,
                'first line\nsecond line\nthird line\nfourth line',
                'Should select entire document from any position',
            );
        });

        test('should handle single line document', async () => {
            const content = 'single line';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-entire');
            assert.ok(textObject, 'Should find inner-entire text object');

            const position = new Position(0, 5);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, 'single line', 'Should select single line document');
        });

        test('should handle empty document', async () => {
            const content = '';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-entire');
            assert.ok(textObject, 'Should find inner-entire text object');

            const position = new Position(0, 0);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, '', 'Should return empty for empty document');
        });
    });
});
