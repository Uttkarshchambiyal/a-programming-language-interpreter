# JavaScript Interpreter Project

## What we're building
A tree-walk interpreter for a **subset of JavaScript**, written in JavaScript (Node.js). This is a learning project — the student is building everything step by step to understand how programming languages work.

## Architecture
The interpreter has 4 stages, each in its own file:

```
Source code (string) → Lexer → Tokens (array) → Parser → AST (tree) → Interpreter → Result
```

- `src/lexer.js` — Tokenizer: reads source code character by character, produces tokens
- `src/parser.js` — Parser: takes tokens, builds an Abstract Syntax Tree using recursive descent
- `src/environment.js` — Scope chain: stores variables, handles lexical scoping and closures
- `src/interpreter.js` — Evaluator: walks the AST and executes each node
- `src/repl.js` — Entry point: interactive REPL + file runner

## JS subset we're implementing (in phases)

### Phase 1 — Basics
- `let x = 10;`
- Numbers, strings (`"hello"`), booleans (`true`, `false`), `null`
- Arithmetic: `+`, `-`, `*`, `/`, `%`
- Comparison: `==`, `===`, `!=`, `!==`, `<`, `>`, `<=`, `>=`
- Logical: `&&`, `||`, `!`
- `console.log()`
- `if / else if / else`
- `while` loops
- Semicolons end statements
- `//` single-line comments

### Phase 2 — Functions
- `function name(params) { body }`
- Arrow functions: `const fn = (x) => x * 2` and `(x) => { return x * 2 }`
- Closures
- `return` statements
- Arrays: `[1, 2, 3]`, indexing `arr[0]`
- `for` loops

### Phase 3 — Advanced
- Objects: `{ key: value }`
- `const` vs `let`
- Template literals: `` `hello ${name}` ``
- Array methods: `.push()`, `.pop()`, `.map()`, `.filter()`

## Token types for the lexer

```
// Literals
NUMBER, STRING, BOOLEAN, NULL

// Identifiers & Keywords
IDENTIFIER, LET, CONST, FUNCTION, RETURN, IF, ELSE, WHILE, FOR, TRUE, FALSE, NULL_KW

// Operators
PLUS (+), MINUS (-), STAR (*), SLASH (/), PERCENT (%)
ASSIGN (=), EQ (==), STRICT_EQ (===), NEQ (!=), STRICT_NEQ (!==)
LT (<), GT (>), LTE (<=), GTE (>=)
AND (&&), OR (||), NOT (!)
ARROW (=>)

// Delimiters
LPAREN (, RPAREN ), LBRACE {, RBRACE }, LBRACKET [, RBRACKET ]
COMMA (,), SEMICOLON (;), DOT (.), COLON (:)

// Special
EOF
```

## How to help the student
- The student is a BEGINNER. They are learning by building.
- Do NOT write full solutions. Guide them step by step.
- When they're stuck, ask what specific part is confusing.
- Explain WHY, not just WHAT — they need to understand concepts for interviews.
- Key concepts to reinforce: tokenization, recursive descent parsing, operator precedence, lexical scoping, closures, ASTs, tree-walk evaluation.
- The student has already practiced: classes, character scanning, building tokens, recursion, Maps.

## Running
```bash
node src/repl.js              # interactive REPL
node src/repl.js script.js    # run a file
```

## Testing
```bash
node --test tests/
```

## Current state
Phase 1 in progress — building the lexer first.
