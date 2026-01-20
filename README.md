# Extended Selects

Vim-style text object selection for VS Code.

## Usage

1. Run `Extended Selects: Select Text Object` from Command Palette (or bind `Alt+S`)
2. Type to filter text objects (e.g., `ip` for inner paragraph)
3. Press Enter to select

Or bind individual commands directly to keybindings.

## Text Objects

| ID | Shortcut | Description |
|---|---|---|
| inner/around-word | iw/aw | Word |
| inner/around-WORD | iW/aW | WORD (whitespace-delimited) |
| inner/around-paren | i(/a( | Parentheses `()` |
| inner/around-brace | i{/a{ | Braces `{}` |
| inner/around-bracket | i[/a[ | Brackets `[]` |
| inner/around-angle | i</a< | Angle brackets `<>` |
| inner/around-double-quote | i"/a" | Double quotes |
| inner/around-single-quote | i'/a' | Single quotes |
| inner/around-backtick | i`/a` | Backticks |
| inner/around-tag | it/at | HTML/XML tags |
| inner/around-paragraph | ip/ap | Paragraph |
| inner/around-argument | ia/aa | Function argument |
| inner/around-indent | ii/ai | Indent block |
| inner/around-entire | ie/ae | Entire document |

## Commands

- `extended-selects.select` - Open QuickPick to select text object
- `extended-selects.select.<id>` - Select specific text object directly

## License

MIT
