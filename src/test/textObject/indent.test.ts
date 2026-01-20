import * as assert from 'node:assert';
import * as vscode from 'vscode';
import { Position } from 'vscode';
import { getTextObjectById } from '../../textObject/textObjects';

suite('Indent Text Objects', () => {
    suite('ii/ai (inner/around indent)', () => {
        test('should select same indent level block', async () => {
            const content = `function foo() {
    const a = 1;
    const b = 2;
    const c = 3;
}`;
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-indent');
            assert.ok(textObject, 'Should find inner-indent text object');

            const position = new Position(2, 10);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(
                text,
                '    const a = 1;\n    const b = 2;\n    const c = 3;\n',
                'Should select all indented lines',
            );
        });

        test('should select nested indent block', async () => {
            const content = `if (true) {
    if (nested) {
        deep1();
        deep2();
    }
}`;
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-indent');
            assert.ok(textObject, 'Should find inner-indent text object');

            const position = new Position(2, 10);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, '        deep1();\n        deep2();\n', 'Should select deeply indented lines');
        });

        test('should stop at blank line', async () => {
            const content = `    line1
    line2

    line3
    line4`;
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-indent');
            assert.ok(textObject, 'Should find inner-indent text object');

            const position = new Position(0, 5);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, '    line1\n    line2\n', 'Should stop at blank line');
        });

        test('should stop at lower indent level', async () => {
            const content = `def foo():
    inner1
    inner2
outer`;
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-indent');
            assert.ok(textObject, 'Should find inner-indent text object');

            const position = new Position(1, 5);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, '    inner1\n    inner2\n', 'Should stop at lower indent');
        });

        test('should handle single indented line', async () => {
            const content = `top
    single
bottom`;
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-indent');
            assert.ok(textObject, 'Should find inner-indent text object');

            const position = new Position(1, 5);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, '    single\n', 'Should select single indented line');
        });

        test('should handle cursor on blank line', async () => {
            const content = `line1

line2`;
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-indent');
            assert.ok(textObject, 'Should find inner-indent text object');

            const position = new Position(1, 0);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, '\n', 'Should select just the blank line');
        });

        test('should handle tabs as indent', async () => {
            const content = `function() {
\tindented1
\tindented2
}`;
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-indent');
            assert.ok(textObject, 'Should find inner-indent text object');

            const position = new Position(1, 5);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, '\tindented1\n\tindented2\n', 'Should handle tab indentation');
        });

        test('should include higher indent children', async () => {
            const content = `class Foo:
    def bar(self):
        pass
    def baz(self):
        pass`;
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-indent');
            assert.ok(textObject, 'Should find inner-indent text object');

            const position = new Position(1, 5);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(
                text,
                '    def bar(self):\n        pass\n    def baz(self):\n        pass',
                'Should include all lines at same or higher indent',
            );
        });

        test('should handle no indent (top level)', async () => {
            const content = `line1
line2
line3`;
            const doc = await vscode.workspace.openTextDocument({ content });
            await vscode.window.showTextDocument(doc);

            const textObject = getTextObjectById('inner-indent');
            assert.ok(textObject, 'Should find inner-indent text object');

            const position = new Position(1, 2);
            const range = textObject.compute(doc, position);

            assert.ok(range, 'Should return a range');
            const text = doc.getText(range);
            assert.strictEqual(text, 'line1\nline2\nline3', 'Should select all top-level lines');
        });
    });
});
