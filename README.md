# A Programming Language Interpreter

A learning project: building an interpreter for a subset of JavaScript, step by step, using JavaScript and Node.js.

## Current progress

The lexer is in progress. It scans source text and produces tokens. The parser, evaluator, and interactive runner are planned stages.

## Files

- [`a-programming-language-interpreter/lexer.js`](a-programming-language-interpreter/lexer.js) — current lexer implementation.
- [`a-programming-language-interpreter/CLAUDE.md`](a-programming-language-interpreter/CLAUDE.md) — project plan and learning notes.

## Check JavaScript syntax

```bash
node --check a-programming-language-interpreter/lexer.js
```

The lexer currently defines classes only; there is no command-line runner or automated test suite yet.
