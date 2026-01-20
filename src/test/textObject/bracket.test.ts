import * as assert from 'node:assert';
import * as vscode from 'vscode';
import { Position } from 'vscode';
import { getTextObjectById } from '../../textObject/textObjects';

suite('Bracket Text Objects', () => {
    suite('Parentheses ()', () => {
        test('should select inner parentheses', async () => {
            const content = 'function(arg1, arg2)';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-paren');
            assert.ok(textObject, 'Should find inner-paren text object');

            const position = new Position(0, 12);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, 'arg1, arg2', 'Should select content inside parentheses');
        });

        test('should select around parentheses', async () => {
            const content = 'function(arg1, arg2)';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('around-paren');
            assert.ok(textObject, 'Should find around-paren text object');

            const position = new Position(0, 12);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, '(arg1, arg2)', 'Should select parentheses including delimiters');
        });

        test('should handle nested parentheses', async () => {
            const content = 'outer(inner(deepest))';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-paren');
            assert.ok(textObject, 'Should find inner-paren text object');

            const position = new Position(0, 14);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, 'deepest', 'Should select innermost parentheses content');
        });

        test('should return undefined when not inside parentheses', async () => {
            const content = 'no parens here';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-paren');
            assert.ok(textObject, 'Should find inner-paren text object');

            const position = new Position(0, 5);
            const range = textObject.compute(doc, position);

            assert.ok(!range || range.isEmpty, 'Should return empty or undefined range');
        });
    });

    suite('Braces {}', () => {
        test('should select inner braces', async () => {
            const content = 'const obj = { key: value }';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-brace');
            assert.ok(textObject, 'Should find inner-brace text object');

            const position = new Position(0, 18);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, ' key: value ', 'Should select content inside braces');
        });

        test('should select around braces', async () => {
            const content = 'const obj = { key: value }';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('around-brace');
            assert.ok(textObject, 'Should find around-brace text object');

            const position = new Position(0, 18);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, '{ key: value }', 'Should select braces including delimiters');
        });
    });

    suite('Brackets []', () => {
        test('should select inner brackets', async () => {
            const content = 'const arr = [1, 2, 3]';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-bracket');
            assert.ok(textObject, 'Should find inner-bracket text object');

            const position = new Position(0, 15);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, '1, 2, 3', 'Should select content inside brackets');
        });

        test('should select around brackets', async () => {
            const content = 'const arr = [1, 2, 3]';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('around-bracket');
            assert.ok(textObject, 'Should find around-bracket text object');

            const position = new Position(0, 15);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, '[1, 2, 3]', 'Should select brackets including delimiters');
        });
    });

    suite('Angle brackets <>', () => {
        test('should select inner angle brackets', async () => {
            const content = 'List<String>';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-angle');
            assert.ok(textObject, 'Should find inner-angle text object');

            const position = new Position(0, 7);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, 'String', 'Should select content inside angle brackets');
        });

        test('should select around angle brackets', async () => {
            const content = 'List<String>';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('around-angle');
            assert.ok(textObject, 'Should find around-angle text object');

            const position = new Position(0, 7);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, '<String>', 'Should select angle brackets including delimiters');
        });
    });
});
