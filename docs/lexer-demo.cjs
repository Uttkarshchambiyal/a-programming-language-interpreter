// Documentation walkthrough. Loads the existing, unexported lexer unchanged.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const lexer = fs.readFileSync(
  path.join(__dirname, '..', 'a-programming-language-interpreter', 'lexer.js'),
  'utf8',
);

vm.runInNewContext(
  `${lexer}\nconsole.table(new Lexer('let score = 42;').tokenize());`,
  { console },
  { timeout: 1000 },
);
