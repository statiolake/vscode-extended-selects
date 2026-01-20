import * as assert from 'node:assert';
import * as vscode from 'vscode';
import { Position } from 'vscode';
import { getTextObjectById } from '../../textObject/textObjects';

suite('Quote Text Objects', () => {
    suite('Double quotes "', () => {
        test('should select inner double quotes', async () => {
            const content = 'const str = "hello world"';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-double-quote');
            assert.ok(textObject, 'Should find inner-double-quote text object');

            const position = new Position(0, 18);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, 'hello world', 'Should select content inside double quotes');
        });

        test('should select around double quotes', async () => {
            const content = 'const str = "hello world"';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('around-double-quote');
            assert.ok(textObject, 'Should find around-double-quote text object');

            const position = new Position(0, 18);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, '"hello world"', 'Should select double quotes including delimiters');
        });

        test('should handle empty double quotes', async () => {
            const content = 'const str = ""';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-double-quote');
            assert.ok(textObject, 'Should find inner-double-quote text object');

            const position = new Position(0, 13);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, '', 'Should select empty content inside double quotes');
        });
    });

    suite("Single quotes '", () => {
        test('should select inner single quotes', async () => {
            const content = "const str = 'hello world'";
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-single-quote');
            assert.ok(textObject, 'Should find inner-single-quote text object');

            const position = new Position(0, 18);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, 'hello world', 'Should select content inside single quotes');
        });

        test('should select around single quotes', async () => {
            const content = "const str = 'hello world'";
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('around-single-quote');
            assert.ok(textObject, 'Should find around-single-quote text object');

            const position = new Position(0, 18);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, "'hello world'", 'Should select single quotes including delimiters');
        });
    });

    suite('Backticks `', () => {
        test('should select inner backticks', async () => {
            const content = 'const str = `hello world`';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-backtick');
            assert.ok(textObject, 'Should find inner-backtick text object');

            const position = new Position(0, 18);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, 'hello world', 'Should select content inside backticks');
        });

        test('should select around backticks', async () => {
            const content = 'const str = `hello world`';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('around-backtick');
            assert.ok(textObject, 'Should find around-backtick text object');

            const position = new Position(0, 18);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, '`hello world`', 'Should select backticks including delimiters');
        });

        test('should handle multiline template literal', async () => {
            const content = 'const str = `line1\nline2\nline3`';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-backtick');
            assert.ok(textObject, 'Should find inner-backtick text object');

            const position = new Position(1, 2);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, 'line1\nline2\nline3', 'Should select multiline content inside backticks');
        });
    });
});
