#!/usr/bin/env node

// ============================================================
// Flux Language — REPL & File Runner
// Usage:
//   node src/repl.js              — start interactive REPL
//   node src/repl.js script.flux  — run a file
// ============================================================

import { createInterface } from 'readline';
import { readFileSync } from 'fs';
import { Lexer } from './lexer.js';
import { Parser } from './parser.js';
import { Interpreter } from './interpreter.js';

function execute(source, interpreter) {
  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();
  return interpreter.run(ast);
}

function runFile(filepath) {
  const source = readFileSync(filepath, 'utf-8');
  const interpreter = new Interpreter();
  try {
    execute(source, interpreter);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

function startRepl() {
  const interpreter = new Interpreter();

  console.log('');
  console.log('  ⚡ Flux v1.0.0');
  console.log('  Type Flux code below. Use Ctrl+C to exit.');
  console.log('');

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'flux> ',
  });

  rl.prompt();

  rl.on('line', (line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      rl.prompt();
      return;
    }

    try {
      const result = execute(trimmed, interpreter);
      if (result !== null && result !== undefined) {
        console.log(interpreter.stringify(result));
      }
    } catch (err) {
      console.error(`  ${err.message}`);
    }

    rl.prompt();
  });

  rl.on('close', () => {
    console.log('\nBye! 👋');
    process.exit(0);
  });
}

// ── Entry point ──────────────────────────────────────────

const args = process.argv.slice(2);
if (args.length > 0) {
  runFile(args[0]);
} else {
  startRepl();
}
