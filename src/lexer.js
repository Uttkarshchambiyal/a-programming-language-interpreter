// ============================================================
// Flux Language — Lexer (Tokenizer)
// Reads source code and produces a stream of tokens.
// ============================================================

export const TokenType = {
  // Literals
  NUMBER:     'NUMBER',
  STRING:     'STRING',
  BOOLEAN:    'BOOLEAN',
  NULL:       'NULL',

  // Identifiers & keywords
  IDENTIFIER: 'IDENTIFIER',
  LET:        'LET',
  FN:         'FN',
  RETURN:     'RETURN',
  IF:         'IF',
  ELIF:       'ELIF',
  ELSE:       'ELSE',
  WHILE:      'WHILE',
  TRUE:       'TRUE',
  FALSE:      'FALSE',
  NULL_KW:    'NULL',
  AND:        'AND',
  OR:         'OR',
  NOT:        'NOT',

  // Operators
  PLUS:       'PLUS',         // +
  MINUS:      'MINUS',        // -
  STAR:       'STAR',         // *
  SLASH:      'SLASH',        // /
  PERCENT:    'PERCENT',      // %
  ASSIGN:     'ASSIGN',       // =
  EQ:         'EQ',           // ==
  NEQ:        'NEQ',          // !=
  LT:         'LT',           // <
  GT:         'GT',           // >
  LTE:        'LTE',          // <=
  GTE:        'GTE',          // >=
  PIPE:       'PIPE',         // |>

  // Delimiters
  LPAREN:     'LPAREN',       // (
  RPAREN:     'RPAREN',       // )
  LBRACE:     'LBRACE',       // {
  RBRACE:     'RBRACE',       // }
  LBRACKET:   'LBRACKET',     // [
  RBRACKET:   'RBRACKET',     // ]
  COMMA:      'COMMA',        // ,

  // Special
  NEWLINE:    'NEWLINE',
  EOF:        'EOF',
};

const KEYWORDS = {
  'let':    TokenType.LET,
  'fn':     TokenType.FN,
  'return': TokenType.RETURN,
  'if':     TokenType.IF,
  'elif':   TokenType.ELIF,
  'else':   TokenType.ELSE,
  'while':  TokenType.WHILE,
  'true':   TokenType.TRUE,
  'false':  TokenType.FALSE,
  'null':   TokenType.NULL_KW,
  'and':    TokenType.AND,
  'or':     TokenType.OR,
  'not':    TokenType.NOT,
};

export class Token {
  constructor(type, value, line, column) {
    this.type = type;
    this.value = value;
    this.line = line;
    this.column = column;
  }

  toString() {
    return `Token(${this.type}, ${JSON.stringify(this.value)}, ${this.line}:${this.column})`;
  }
}

export class LexerError extends Error {
  constructor(message, line, column) {
    super(`Lexer error at ${line}:${column} — ${message}`);
    this.line = line;
    this.column = column;
  }
}

export class Lexer {
  constructor(source) {
    this.source = source;
    this.pos = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];
  }

  peek() {
    if (this.pos >= this.source.length) return '\0';
    return this.source[this.pos];
  }

  peekNext() {
    if (this.pos + 1 >= this.source.length) return '\0';
    return this.source[this.pos + 1];
  }

  advance() {
    const ch = this.source[this.pos];
    this.pos++;
    if (ch === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return ch;
  }

  addToken(type, value) {
    this.tokens.push(new Token(type, value, this.line, this.column));
  }

  skipWhitespace() {
    while (this.pos < this.source.length) {
      const ch = this.peek();
      if (ch === ' ' || ch === '\t' || ch === '\r') {
        this.advance();
      } else {
        break;
      }
    }
  }

  skipComment() {
    // -- is a comment, skip to end of line
    while (this.pos < this.source.length && this.peek() !== '\n') {
      this.advance();
    }
  }

  readString() {
    const quote = this.advance(); // consume opening quote
    let value = '';
    while (this.pos < this.source.length && this.peek() !== quote) {
      if (this.peek() === '\\') {
        this.advance();
        const escaped = this.advance();
        switch (escaped) {
          case 'n':  value += '\n'; break;
          case 't':  value += '\t'; break;
          case '\\': value += '\\'; break;
          case '"':  value += '"';  break;
          case "'":  value += "'";  break;
          default:   value += '\\' + escaped;
        }
      } else {
        value += this.advance();
      }
    }
    if (this.pos >= this.source.length) {
      throw new LexerError('Unterminated string', this.line, this.column);
    }
    this.advance(); // consume closing quote
    this.addToken(TokenType.STRING, value);
  }

  readNumber() {
    let num = '';
    while (this.pos < this.source.length && isDigit(this.peek())) {
      num += this.advance();
    }
    if (this.peek() === '.' && isDigit(this.peekNext())) {
      num += this.advance(); // consume '.'
      while (this.pos < this.source.length && isDigit(this.peek())) {
        num += this.advance();
      }
    }
    this.addToken(TokenType.NUMBER, Number(num));
  }

  readIdentifier() {
    let name = '';
    while (this.pos < this.source.length && isAlphaNumeric(this.peek())) {
      name += this.advance();
    }
    const keyword = KEYWORDS[name];
    if (keyword) {
      if (keyword === TokenType.TRUE) {
        this.addToken(TokenType.BOOLEAN, true);
      } else if (keyword === TokenType.FALSE) {
        this.addToken(TokenType.BOOLEAN, false);
      } else {
        this.addToken(keyword, name);
      }
    } else {
      this.addToken(TokenType.IDENTIFIER, name);
    }
  }

  tokenize() {
    while (this.pos < this.source.length) {
      this.skipWhitespace();

      if (this.pos >= this.source.length) break;

      const ch = this.peek();
      const col = this.column;
      const ln = this.line;

      // Newlines
      if (ch === '\n') {
        // Only add NEWLINE if the last token isn't already a NEWLINE
        if (this.tokens.length > 0 && this.tokens[this.tokens.length - 1].type !== TokenType.NEWLINE) {
          this.addToken(TokenType.NEWLINE, '\\n');
        }
        this.advance();
        continue;
      }

      // Comments
      if (ch === '-' && this.peekNext() === '-') {
        this.skipComment();
        continue;
      }

      // Strings
      if (ch === '"' || ch === "'") {
        this.readString();
        continue;
      }

      // Numbers
      if (isDigit(ch)) {
        this.readNumber();
        continue;
      }

      // Identifiers and keywords
      if (isAlpha(ch)) {
        this.readIdentifier();
        continue;
      }

      // Two-character operators
      if (ch === '|' && this.peekNext() === '>') {
        this.advance(); this.advance();
        this.addToken(TokenType.PIPE, '|>');
        continue;
      }
      if (ch === '=' && this.peekNext() === '=') {
        this.advance(); this.advance();
        this.addToken(TokenType.EQ, '==');
        continue;
      }
      if (ch === '!' && this.peekNext() === '=') {
        this.advance(); this.advance();
        this.addToken(TokenType.NEQ, '!=');
        continue;
      }
      if (ch === '<' && this.peekNext() === '=') {
        this.advance(); this.advance();
        this.addToken(TokenType.LTE, '<=');
        continue;
      }
      if (ch === '>' && this.peekNext() === '=') {
        this.advance(); this.advance();
        this.addToken(TokenType.GTE, '>=');
        continue;
      }

      // Single-character operators and delimiters
      this.advance();
      switch (ch) {
        case '+': this.addToken(TokenType.PLUS, '+'); break;
        case '-': this.addToken(TokenType.MINUS, '-'); break;
        case '*': this.addToken(TokenType.STAR, '*'); break;
        case '/': this.addToken(TokenType.SLASH, '/'); break;
        case '%': this.addToken(TokenType.PERCENT, '%'); break;
        case '=': this.addToken(TokenType.ASSIGN, '='); break;
        case '<': this.addToken(TokenType.LT, '<'); break;
        case '>': this.addToken(TokenType.GT, '>'); break;
        case '(': this.addToken(TokenType.LPAREN, '('); break;
        case ')': this.addToken(TokenType.RPAREN, ')'); break;
        case '{': this.addToken(TokenType.LBRACE, '{'); break;
        case '}': this.addToken(TokenType.RBRACE, '}'); break;
        case '[': this.addToken(TokenType.LBRACKET, '['); break;
        case ']': this.addToken(TokenType.RBRACKET, ']'); break;
        case ',': this.addToken(TokenType.COMMA, ','); break;
        default:
          throw new LexerError(`Unexpected character: '${ch}'`, ln, col);
      }
    }

    this.addToken(TokenType.EOF, null);
    return this.tokens;
  }
}

function isDigit(ch) {
  return ch >= '0' && ch <= '9';
}

function isAlpha(ch) {
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_';
}

function isAlphaNumeric(ch) {
  return isAlpha(ch) || isDigit(ch);
}
