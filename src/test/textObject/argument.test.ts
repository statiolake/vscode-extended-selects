import * as assert from 'node:assert';
import * as vscode from 'vscode';
import { Position } from 'vscode';
import { getTextObjectById } from '../../textObject/textObjects';

suite('Argument Text Objects', () => {
    suite('Function arguments', () => {
        test('should select inner argument (first argument)', async () => {
            const content = 'func(arg1, arg2, arg3)';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-argument');
            assert.ok(textObject, 'Should find inner-argument text object');

            const position = new Position(0, 7);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, 'arg1', 'Should select first argument without comma');
        });

        test('should select inner argument (middle argument)', async () => {
            const content = 'func(arg1, arg2, arg3)';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-argument');
            assert.ok(textObject, 'Should find inner-argument text object');

            const position = new Position(0, 13);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, 'arg2', 'Should select middle argument without comma');
        });

        test('should select inner argument (last argument)', async () => {
            const content = 'func(arg1, arg2, arg3)';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-argument');
            assert.ok(textObject, 'Should find inner-argument text object');

            const position = new Position(0, 19);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, 'arg3', 'Should select last argument without comma');
        });

        test('should select around argument (first argument with trailing comma)', async () => {
            const content = 'func(arg1, arg2, arg3)';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('around-argument');
            assert.ok(textObject, 'Should find around-argument text object');

            const position = new Position(0, 7);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, 'arg1,', 'Should select first argument with trailing comma');
        });

        test('should select around argument (middle argument with leading comma)', async () => {
            const content = 'func(arg1, arg2, arg3)';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('around-argument');
            assert.ok(textObject, 'Should find around-argument text object');

            const position = new Position(0, 13);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, ', arg2', 'Should select middle argument with leading comma');
        });

        test('should handle nested function calls', async () => {
            const content = 'outer(inner(a, b), c)';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-argument');
            assert.ok(textObject, 'Should find inner-argument text object');

            const position = new Position(0, 13);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, 'a', 'Should select argument in nested function');
        });

        test('should handle string arguments with commas', async () => {
            const content = 'func("hello, world", arg2)';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-argument');
            assert.ok(textObject, 'Should find inner-argument text object');

            const position = new Position(0, 10);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, '"hello, world"', 'Should select string argument including internal comma');
        });

        test('should handle single argument', async () => {
            const content = 'func(onlyArg)';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-argument');
            assert.ok(textObject, 'Should find inner-argument text object');

            const position = new Position(0, 8);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, 'onlyArg', 'Should select single argument');
        });
    });

    suite('Object/struct arguments', () => {
        test('should select inner argument in object literal', async () => {
            const content = 'const obj = { a: 1, b: 2, c: 3 }';
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-argument');
            assert.ok(textObject, 'Should find inner-argument text object');

            const position = new Position(0, 22);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, 'b: 2', 'Should select key-value pair in object');
        });
    });
});
