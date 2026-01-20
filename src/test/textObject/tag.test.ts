import * as assert from 'node:assert';
import * as vscode from 'vscode';
import { Position } from 'vscode';
import { getTextObjectById } from '../../textObject/textObjects';

suite('Tag Text Objects', () => {
    suite('HTML tags', () => {
        test('should select inner tag content', async () => {
            const content = '<div>hello world</div>';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-tag');
            assert.ok(textObject, 'Should find inner-tag text object');

            const position = new Position(0, 10);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, 'hello world', 'Should select content inside tags');
        });

        test('should select around tag', async () => {
            const content = '<div>hello world</div>';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('around-tag');
            assert.ok(textObject, 'Should find around-tag text object');

            const position = new Position(0, 10);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, '<div>hello world</div>', 'Should select entire tag including delimiters');
        });

        test('should handle nested tags', async () => {
            const content = '<div><span>nested</span></div>';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-tag');
            assert.ok(textObject, 'Should find inner-tag text object');

            const position = new Position(0, 12);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, 'nested', 'Should select innermost tag content');
        });

        test('should handle tags with attributes', async () => {
            const content = '<div class="container" id="main">content</div>';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-tag');
            assert.ok(textObject, 'Should find inner-tag text object');

            const position = new Position(0, 35);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, 'content', 'Should select content inside tag with attributes');
        });

        test('should handle empty tags', async () => {
            const content = '<div></div>';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-tag');
            assert.ok(textObject, 'Should find inner-tag text object');

            const position = new Position(0, 5);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, '', 'Should select empty content inside empty tags');
        });

        test('should handle multiline tags', async () => {
            const content = '<div>\n  <p>paragraph</p>\n</div>';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-tag');
            assert.ok(textObject, 'Should find inner-tag text object');

            const position = new Position(1, 5);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, 'paragraph', 'Should select content inside innermost tag');
        });
    });

    suite('Self-closing tags', () => {
        test('should skip self-closing tags', async () => {
            const content = '<div><br/><span>content</span></div>';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-tag');
            assert.ok(textObject, 'Should find inner-tag text object');

            const position = new Position(0, 18);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, 'content', 'Should select content, skipping self-closing tags');
        });
    });
});
