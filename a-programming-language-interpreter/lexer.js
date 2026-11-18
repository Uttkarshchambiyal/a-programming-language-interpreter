  const TokenType = {

      NUMBER: 'NUMBER',
      STRING: 'STRING',
      BOOLEAN: 'BOOLEAN',
      IDENTIFIER: 'IDENTIFIER',
      LET: 'LET',
      ASSIGN: 'ASSIGN',
      PLUS: 'PLUS',
      MINUS: 'MINUS',
      STAR: 'STAR',
      SLASH: 'SLASH',
      SEMICOLON: 'SEMICOLON',
      EOF: 'EOF',
      NEQ: 'NEQ', // !=
      STRICT_NEQ: 'STRICT_NEQ', // !==
      NOT: 'NOT',
      LT: 'LT', // <
      GT: 'GT', // >
      LTE: 'LTE', // <=
      GTE: 'GTE', // >=
      AND: 'AND', // &&
      OR: 'OR', // ||
      LPAREN: 'LPAREN', // (
      RPAREN: 'RPAREN', // )
      LBRACE: 'LBRACE', // {
      RBRACE: 'RBRACE', // }
      LBRACKET: 'LBRACKET', // [
      RBRACKET: 'RBRACKET', // ]
      COMMA: 'COMMA', // ,
      DOT: 'DOT', // .
  };

  class Token {

      constructor(type, value, line) {
          this.type = type;
          this.value = value;
          this.line = line;
      }

  }


  class Lexer {
      constructor(source) {
          this.source = source;
          this.pos = 0;
          this.line = 1;
          this.tokens = [];
      }

      peek() {
          return this.source[this.pos];
      }

      advance() {
          const ch = this.source[this.pos];
          this.pos++;
          return ch;
      }

      tokenize() {
          while (this.pos < this.source.length) {
              const ch = this.peek();

              if (ch === ' ' || ch === '\t') {
                  this.advance();
              } else if (ch >= '0' && ch <= '9') {
                  this.readNumber();
              } else if (this.isAlpha(ch)) {
                  this.readWord();
              } else if (ch === '"') {
                  this.readString();
              } else if (ch === '+') {
                  this.advance();
                  this.tokens.push(new Token(TokenType.PLUS, '+', this.line));
              } else if (ch === '-') {
                  this.advance();
                  this.tokens.push(new Token(TokenType.MINUS, '-', this.line));
              } else if (ch === '*') {
                  this.advance();
                  this.tokens.push(new Token(TokenType.STAR, '*', this.line));
              } else if (ch === '/') {
                  this.advance();
                  this.tokens.push(new Token(TokenType.SLASH, '/', this.line));
              } else if (ch === ';') {
                  this.advance();
                  this.tokens.push(new Token(TokenType.SEMICOLON, ';', this.line));
              } else if (ch === '(') {
                  this.advance();
                  this.tokens.push(new Token(TokenType.LPAREN, '(', this.line));
              } else if (ch === ')') {
                  this.advance();
                  this.tokens.push(new Token(TokenType.RPAREN, ')', this.line));
              } else if (ch === '{') {
                  this.advance();
                  this.tokens.push(new Token(TokenType.LBRACE, '{', this.line));
              } else if (ch === '}') {
                  this.advance();
                  this.tokens.push(new Token(TokenType.RBRACE, '}', this.line));
              } else if (ch === '[') {
                  this.advance();
                  this.tokens.push(new Token(TokenType.LBRACKET, '[', this.line));
              } else if (ch === ']') {
                  this.advance();
                  this.tokens.push(new Token(TokenType.RBRACKET, ']', this.line));
              } else if (ch === ',') {
                  this.advance();
                  this.tokens.push(new Token(TokenType.COMMA, ',', this.line));
              } else if (ch === '.') {
                  this.advance();
                  this.tokens.push(new Token(TokenType.DOT, '.', this.line));
              } else if (ch === '!') {
                  this.advance();
                  if (this.peek() === '=' && this.source[this.pos + 1] === '=') {
                      this.advance();
                      this.advance();
                      this.tokens.push(new Token(TokenType.STRICT_NEQ, '!==', this.line));
                  } else if (this.peek() === '=') {
                      this.advance();
                      this.tokens.push(new Token(TokenType.NEQ, '!=', this.line));
                  } else {
                      this.tokens.push(new Token(TokenType.NOT, '!', this.line));
                  }
              } else if (ch === '<') {
                  this.advance();
                  if (this.peek() === '=') {
                      this.advance();
                      this.tokens.push(new Token(TokenType.LTE, '<=', this.line));
                  } else {
                      this.tokens.push(new Token(TokenType.LT, '<', this.line));
                  }
              } else if (ch === '>') {
                  this.advance();
                  if (this.peek() === '=') {
                      this.advance();
                      this.tokens.push(new Token(TokenType.GTE, '>=', this.line));
                  } else {
                      this.tokens.push(new Token(TokenType.GT, '>', this.line));
                  }
              } else if (ch === '&') {
                  this.advance();
                  if (this.peek() === '&') {
                      this.advance();
                      this.tokens.push(new Token(TokenType.AND, '&&', this.line));
                  }
              } else if (ch === '|') {
                  this.advance();
                  if (this.peek() === '|') {
                      this.advance();
                      this.tokens.push(new Token(TokenType.OR, '||', this.line));
                  }
              } else if (ch === '\n') {
                  this.line++;
                  this.advance();
              } else if (ch === '=') {
                  this.advance();
                  if (this.peek() === '=' && this.source[this.pos + 1] === '=') {
                      this.advance();
                      this.advance();
                      this.tokens.push(new Token(TokenType.STRICT_EQ, '===', this.line));
                  } else if (this.peek() === '=') {
                      this.advance();
                      this.tokens.push(new Token(TokenType.EQ, '==', this.line));
                  } else {
                      this.tokens.push(new Token(TokenType.ASSIGN, '=', this.line));
                  }

              } else {
                  this.advance();
              }
          }

          this.tokens.push(new Token(TokenType.EOF, null, this.line));
          return this.tokens;
      }

      readNumber() {
          let num = '';
          while (this.pos < this.source.length && this.peek() >= '0' && this.peek() <= '9') {
              num += this.advance();
          }
          this.tokens.push(new Token(TokenType.NUMBER, Number(num), this.line));
      }

      readWord() {
          let word = '';
          while (this.pos < this.source.length && this.isAlphaNumeric(this.peek())) {
              word += this.advance();
          }
          if (word === 'let') {
              this.tokens.push(new Token(TokenType.LET, 'let', this.line));
          } else if (word === 'true') {
              this.tokens.push(new Token(TokenType.BOOLEAN, true, this.line));
          } else if (word === 'false') {
              this.tokens.push(new Token(TokenType.BOOLEAN, false, this.line));
          } else if (word === 'const') {
              this.tokens.push(new Token(TokenType.CONST, 'const', this.line));
          } else if (word === 'function') {
              this.tokens.push(new Token(TokenType.FUNCTION, 'function', this.line));
          } else if (word === 'return') {
              this.tokens.push(new Token(TokenType.RETURN, 'return', this.line));
          } else if (word === 'if') {
              this.tokens.push(new Token(TokenType.IF, 'if', this.line));
          } else if (word === 'else') {
              this.tokens.push(new Token(TokenType.ELSE, 'else', this.line));
          } else if (word === 'while') {
              this.tokens.push(new Token(TokenType.WHILE, 'while', this.line));
          } else if (word === 'for') {
              this.tokens.push(new Token(TokenType.FOR, 'for', this.line));
          } else if (word === 'null') {
              this.tokens.push(new Token(TokenType.NULL, 'null', this.line));
          } else {
              this.tokens.push(new Token(TokenType.IDENTIFIER, word, this.line));
          }
      }

      readString() {
          this.advance(); // skip the opening "
          let str = '';
          while (this.pos < this.source.length && this.peek() !== '"') {
              str += this.advance();
          }
          this.advance(); // skip the closing "
          this.tokens.push(new Token(TokenType.STRING, str, this.line));
      }

      isAlpha(ch) {
          return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_';
      }

      isAlphaNumeric(ch) {
          return this.isAlpha(ch) || (ch >= '0' && ch <= '9');
      }
  }