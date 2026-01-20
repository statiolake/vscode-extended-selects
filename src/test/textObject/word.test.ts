import * as assert from 'node:assert';
import * as vscode from 'vscode';
import { Position } from 'vscode';
import { getTextObjectById } from '../../textObject/textObjects';

suite('Word Text Objects', () => {
    suite('iw (inner word)', () => {
        test('should select word under cursor', async () => {
            const content = 'hello world';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-word');
            assert.ok(textObject, 'Should find inner-word text object');

            const position = new Position(0, 2);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, 'hello', 'Should select the word');
        });

        test('should select word at word boundary', async () => {
            const content = 'hello world';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-word');
            assert.ok(textObject, 'Should find inner-word text object');

            const position = new Position(0, 5);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            // At boundary, should prefer right side (higher priority)
            assert.ok(text === 'hello' || text === 'world', 'Should select one of the adjacent words');
        });

        test('should handle Japanese characters', async () => {
            const content = 'hello こんにちは world';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-word');
            assert.ok(textObject, 'Should find inner-word text object');

            const position = new Position(0, 8);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, 'こんにちは', 'Should select Japanese word');
        });

        test('should handle symbols', async () => {
            const content = 'a + b';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-word');
            assert.ok(textObject, 'Should find inner-word text object');

            const position = new Position(0, 2);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, '+', 'Should select symbol');
        });

        test('should handle underscore as part of word', async () => {
            const content = 'hello_world test';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-word');
            assert.ok(textObject, 'Should find inner-word text object');

            const position = new Position(0, 5);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, 'hello_world', 'Should select word with underscore');
        });
    });

    suite('iW (inner WORD)', () => {
        test('should select WORD (whitespace-delimited)', async () => {
            const content = 'hello-world test';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-WORD');
            assert.ok(textObject, 'Should find inner-WORD text object');

            const position = new Position(0, 5);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, 'hello-world', 'Should select WORD including hyphen');
        });

        test('should select WORD with symbols', async () => {
            const content = 'foo::bar::baz test';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-WORD');
            assert.ok(textObject, 'Should find inner-WORD text object');

            const position = new Position(0, 5);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, 'foo::bar::baz', 'Should select WORD with colons');
        });

        test('should handle URL as WORD', async () => {
            const content = 'visit https://example.com/path today';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-WORD');
            assert.ok(textObject, 'Should find inner-WORD text object');

            const position = new Position(0, 15);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, 'https://example.com/path', 'Should select entire URL as WORD');
        });
    });
});
