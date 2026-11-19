# A Programming Language Interpreter

A learning project by [Uttkarsh Chambiyal](https://github.com/Uttkarshchambiyal): build an interpreter for a subset of JavaScript, one piece at a time.

The [animated README](../README.md) is a monochrome LCD console inspired by the supplied Uptime Pet component. This page provides the same information as selectable text, with working commands and source links. The console is a rendered animation; its controls and activity indicators are illustrations.

## Current state

| Stage | Status | Current implementation |
| --- | --- | --- |
| Lexer | In progress | Scans source characters and produces tokens. |
| Parser | Started | AST constructors and token-navigation helpers. |
| Environments / scopes | Planned | Variable bindings and lexical scope. |
| Evaluator | Planned | Walk an AST and execute a program. |

The project does not execute JavaScript programs yet. There is no REPL, file runner, exported library API, or automated test suite.

## Try the lexer

Install Git and Node.js. The interpreter has no npm dependencies.

```bash
git clone https://github.com/Uttkarshchambiyal/a-programming-language-interpreter.git
cd a-programming-language-interpreter
node docs/lexer-demo.cjs
```

The documentation helper loads the actual lexer with Node's `vm`, because the implementation currently defines classes without exporting them. It scans:

```js
let score = 42;
```

Expected output:

| Type | Value | Line |
| --- | --- | --- |
| `LET` | `"let"` | 1 |
| `IDENTIFIER` | `"score"` | 1 |
| `ASSIGN` | `"="` | 1 |
| `NUMBER` | `42` | 1 |
| `SEMICOLON` | `";"` | 1 |
| `EOF` | `null` | 1 |

Change the example string in [lexer-demo.cjs](lexer-demo.cjs) to explore another input. This example demonstrates tokenization, not evaluation.

## Inside the machine

```text
Source text -> Lexer -> Tokens -> Parser -> Syntax tree -> Evaluator -> Result
                                                          ^
                                                     Environments
                                                     names + scopes
```

In [lexer.js](../a-programming-language-interpreter/lexer.js), `TokenType` names categories, `Token` stores `type`, `value`, and `line`, and `Lexer` scans the input. `peek()` inspects a character; `advance()` consumes it. Dedicated readers handle numbers, words, and strings.

The lexer currently recognizes whole numbers, double-quoted strings, booleans, identifiers, `let`, assignment, arithmetic symbols, several comparison and logical symbols, delimiters, spaces, tabs, and line breaks. It appends an EOF token.

In [parser.js](../a-programming-language-interpreter/parser.js), the initial AST helpers create `Program`, `NumberLiteral`, `StringLiteral`, and `Identifier` objects. `Parser` stores a token array and cursor, with `peek()`, `advance()`, and `expect(type)`. There is no complete parsing method yet.

## Build log and limitations

- Some keyword branches and the `==` / `===` branches refer to token types that are not defined yet.
- Decimal numbers, string escapes, and comments need work.
- Unknown characters are skipped, and unterminated strings do not produce an error.
- The parser's `expect()` assumes a token exists. EOF/error handling needs further work.
- Operator precedence, statements, variable environments, and evaluation are future stages.

Next steps:

1. Complete token definitions and lexer errors.
2. Add a reusable module entry point and meaningful lexer tests.
3. Build expression parsing and operator precedence.
4. Add environments, evaluation, control flow, functions, and closures.
5. Add a REPL and file runner.

[CLAUDE.md](../a-programming-language-interpreter/CLAUDE.md) contains the broader learning plan. Its proposed `src/` layout and runner commands describe future work.

## Repository map

```text
.
├── README.md                       # Entirely visual animated console
├── assets/
│   ├── readme-hero.svg              # Previous banner, retained
│   └── readme/
│       ├── console.gif             # Looping README animation
│       └── console-still.png       # Still / reduced-motion fallback
├── docs/
│   ├── GUIDE.md                    # This copyable text guide
│   └── lexer-demo.cjs              # Runs the existing lexer example
├── scripts/
│   └── render_readme.py            # Editable artwork and motion source
└── a-programming-language-interpreter/
    ├── CLAUDE.md
    ├── lexer.js
    └── parser.js
```

## Check the code

From the repository root:

```bash
node --check a-programming-language-interpreter/lexer.js
node --check a-programming-language-interpreter/parser.js
node --check docs/lexer-demo.cjs
node docs/lexer-demo.cjs
```

Syntax checks confirm that files parse. The walkthrough checks one input; neither proves full language support.

## Edit the animated README

The editable source is [scripts/render_readme.py](../scripts/render_readme.py). It draws a compact 800 × 2200 black console displayed at up to 720 pixels wide, with larger type and four concise sections: the pet, token walkthrough, build status, and boot instructions. The full project details stay on this page. All colors are grayscale. Essential text stays visible in every frame.

To regenerate the assets, use Python 3.10+ and Pillow 10.1+ in a virtual environment:

```bash
python3 -m venv /tmp/interpreter-readme-venv
/tmp/interpreter-readme-venv/bin/pip install 'Pillow>=10.1'
/tmp/interpreter-readme-venv/bin/python scripts/render_readme.py
```

Python and Pillow are only needed to edit the artwork. They are not interpreter runtime dependencies. The renderer uses an installed monospace font (Menlo on macOS, DejaVu Sans Mono on Linux) with a Pillow fallback, plus its own bitmap title and sprites. Different installed fonts can slightly change regenerated typography.

The GIF is an eight-second loop with 64 frames. A still PNG is selected through a `<picture>` source when the viewer honors `prefers-reduced-motion`; it can also be [opened directly](../assets/readme/console-still.png). The image links to this guide so instructions stay accessible and copyable.

GitHub [supports GIF images](https://docs.github.com/en/repositories/working-with-files/using-files/working-with-non-code-files). The README does not require executable React, JavaScript, an iframe, or an external image service. The reference's pet silhouette, antennae, faces, and LCD behavior informed the design; its service-health metrics were replaced with truthful project information.
