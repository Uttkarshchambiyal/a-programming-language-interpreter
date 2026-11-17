// ============================================================
// Flux Language — Parser
// Converts a token stream into an Abstract Syntax Tree (AST).
// Uses recursive descent with Pratt-style precedence.
// ============================================================

import { TokenType } from './lexer.js';

export class ParseError extends Error {
  constructor(message, token) {
    super(`Parse error at ${token.line}:${token.column} — ${message}`);
    this.token = token;
  }
}

// AST Node constructors
export const AST = {
  Program:        (body)                       => ({ type: 'Program', body }),
  NumberLiteral:  (value)                      => ({ type: 'NumberLiteral', value }),
  StringLiteral:  (value)                      => ({ type: 'StringLiteral', value }),
  BooleanLiteral: (value)                      => ({ type: 'BooleanLiteral', value }),
  NullLiteral:    ()                           => ({ type: 'NullLiteral' }),
  ArrayLiteral:   (elements)                   => ({ type: 'ArrayLiteral', elements }),
  Identifier:     (name)                       => ({ type: 'Identifier', name }),
  BinaryExpr:     (op, left, right)            => ({ type: 'BinaryExpr', op, left, right }),
  UnaryExpr:      (op, operand)                => ({ type: 'UnaryExpr', op, operand }),
  LogicalExpr:    (op, left, right)            => ({ type: 'LogicalExpr', op, left, right }),
  AssignExpr:     (name, value)                => ({ type: 'AssignExpr', name, value }),
  IndexExpr:      (object, index)              => ({ type: 'IndexExpr', object, index }),
  LetDecl:        (name, value)                => ({ type: 'LetDecl', name, value }),
  FnDecl:         (name, params, body)         => ({ type: 'FnDecl', name, params, body }),
  ReturnStmt:     (value)                      => ({ type: 'ReturnStmt', value }),
  IfStmt:         (condition, body, elifs, el)  => ({ type: 'IfStmt', condition, body, elifs, elseBody: el }),
  WhileStmt:      (condition, body)            => ({ type: 'WhileStmt', condition, body }),
  CallExpr:       (callee, args)               => ({ type: 'CallExpr', callee, args }),
  PipeExpr:       (left, right)                => ({ type: 'PipeExpr', left, right }),
  Block:          (statements)                 => ({ type: 'Block', statements }),
  FnExpr:         (params, body)               => ({ type: 'FnExpr', params, body }),
};

export class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  peek() {
    return this.tokens[this.pos];
  }

  advance() {
    const token = this.tokens[this.pos];
    this.pos++;
    return token;
  }

  expect(type) {
    const token = this.peek();
    if (token.type !== type) {
      throw new ParseError(`Expected ${type} but got ${token.type} (${JSON.stringify(token.value)})`, token);
    }
    return this.advance();
  }

  match(type) {
    if (this.peek().type === type) {
      return this.advance();
    }
    return null;
  }

  skipNewlines() {
    while (this.peek().type === TokenType.NEWLINE) {
      this.advance();
    }
  }

  // ── Entry point ──────────────────────────────────────────

  parse() {
    const body = [];
    this.skipNewlines();

    while (this.peek().type !== TokenType.EOF) {
      body.push(this.parseStatement());
      this.skipNewlines();
    }

    return AST.Program(body);
  }

  // ── Statements ───────────────────────────────────────────

  parseStatement() {
    const token = this.peek();

    switch (token.type) {
      case TokenType.LET:    return this.parseLetDecl();
      case TokenType.FN:     return this.parseFnDecl();
      case TokenType.RETURN: return this.parseReturn();
      case TokenType.IF:     return this.parseIf();
      case TokenType.WHILE:  return this.parseWhile();
      default:               return this.parseExpressionStatement();
    }
  }

  parseLetDecl() {
    this.expect(TokenType.LET);
    const name = this.expect(TokenType.IDENTIFIER).value;
    this.expect(TokenType.ASSIGN);
    const value = this.parseExpression();
    this.eatStatementEnd();
    return AST.LetDecl(name, value);
  }

  parseFnDecl() {
    this.expect(TokenType.FN);
    const name = this.expect(TokenType.IDENTIFIER).value;
    const params = this.parseParams();
    const body = this.parseBlock();
    return AST.FnDecl(name, params, body);
  }

  parseReturn() {
    this.expect(TokenType.RETURN);
    let value = null;
    if (this.peek().type !== TokenType.NEWLINE &&
        this.peek().type !== TokenType.RBRACE &&
        this.peek().type !== TokenType.EOF) {
      value = this.parseExpression();
    }
    this.eatStatementEnd();
    return AST.ReturnStmt(value);
  }

  parseIf() {
    this.expect(TokenType.IF);
    const condition = this.parseExpression();
    const body = this.parseBlock();

    const elifs = [];
    this.skipNewlines();
    while (this.peek().type === TokenType.ELIF) {
      this.advance();
      const elifCond = this.parseExpression();
      const elifBody = this.parseBlock();
      elifs.push({ condition: elifCond, body: elifBody });
      this.skipNewlines();
    }

    let elseBody = null;
    if (this.peek().type === TokenType.ELSE) {
      this.advance();
      elseBody = this.parseBlock();
    }

    return AST.IfStmt(condition, body, elifs, elseBody);
  }

  parseWhile() {
    this.expect(TokenType.WHILE);
    const condition = this.parseExpression();
    const body = this.parseBlock();
    return AST.WhileStmt(condition, body);
  }

  parseExpressionStatement() {
    const expr = this.parseExpression();
    this.eatStatementEnd();
    return expr;
  }

  // ── Blocks & Params ──────────────────────────────────────

  parseBlock() {
    this.skipNewlines();
    this.expect(TokenType.LBRACE);
    this.skipNewlines();

    const statements = [];
    while (this.peek().type !== TokenType.RBRACE && this.peek().type !== TokenType.EOF) {
      statements.push(this.parseStatement());
      this.skipNewlines();
    }

    this.expect(TokenType.RBRACE);
    return AST.Block(statements);
  }

  parseParams() {
    this.expect(TokenType.LPAREN);
    const params = [];
    if (this.peek().type !== TokenType.RPAREN) {
      params.push(this.expect(TokenType.IDENTIFIER).value);
      while (this.match(TokenType.COMMA)) {
        params.push(this.expect(TokenType.IDENTIFIER).value);
      }
    }
    this.expect(TokenType.RPAREN);
    return params;
  }

  // ── Expressions (precedence climbing) ────────────────────

  parseExpression() {
    return this.parsePipe();
  }

  parsePipe() {
    let left = this.parseAssignment();
    while (this.peek().type === TokenType.PIPE) {
      this.advance();
      this.skipNewlines();
      const right = this.parseAssignment();
      left = AST.PipeExpr(left, right);
    }
    return left;
  }

  parseAssignment() {
    const expr = this.parseOr();
    if (this.peek().type === TokenType.ASSIGN && expr.type === 'Identifier') {
      this.advance();
      const value = this.parseExpression();
      return AST.AssignExpr(expr.name, value);
    }
    return expr;
  }

  parseOr() {
    let left = this.parseAnd();
    while (this.peek().type === TokenType.OR) {
      this.advance();
      left = AST.LogicalExpr('or', left, this.parseAnd());
    }
    return left;
  }

  parseAnd() {
    let left = this.parseEquality();
    while (this.peek().type === TokenType.AND) {
      this.advance();
      left = AST.LogicalExpr('and', left, this.parseEquality());
    }
    return left;
  }

  parseEquality() {
    let left = this.parseComparison();
    while (this.peek().type === TokenType.EQ || this.peek().type === TokenType.NEQ) {
      const op = this.advance().value;
      left = AST.BinaryExpr(op, left, this.parseComparison());
    }
    return left;
  }

  parseComparison() {
    let left = this.parseAddition();
    while ([TokenType.LT, TokenType.GT, TokenType.LTE, TokenType.GTE].includes(this.peek().type)) {
      const op = this.advance().value;
      left = AST.BinaryExpr(op, left, this.parseAddition());
    }
    return left;
  }

  parseAddition() {
    let left = this.parseMultiplication();
    while (this.peek().type === TokenType.PLUS || this.peek().type === TokenType.MINUS) {
      const op = this.advance().value;
      left = AST.BinaryExpr(op, left, this.parseMultiplication());
    }
    return left;
  }

  parseMultiplication() {
    let left = this.parseUnary();
    while ([TokenType.STAR, TokenType.SLASH, TokenType.PERCENT].includes(this.peek().type)) {
      const op = this.advance().value;
      left = AST.BinaryExpr(op, left, this.parseUnary());
    }
    return left;
  }

  parseUnary() {
    if (this.peek().type === TokenType.MINUS) {
      this.advance();
      return AST.UnaryExpr('-', this.parseUnary());
    }
    if (this.peek().type === TokenType.NOT) {
      this.advance();
      return AST.UnaryExpr('not', this.parseUnary());
    }
    return this.parseCall();
  }

  parseCall() {
    let expr = this.parsePrimary();

    while (true) {
      if (this.peek().type === TokenType.LPAREN) {
        this.advance();
        const args = [];
        if (this.peek().type !== TokenType.RPAREN) {
          args.push(this.parseExpression());
          while (this.match(TokenType.COMMA)) {
            args.push(this.parseExpression());
          }
        }
        this.expect(TokenType.RPAREN);
        expr = AST.CallExpr(expr, args);
      } else if (this.peek().type === TokenType.LBRACKET) {
        this.advance();
        const index = this.parseExpression();
        this.expect(TokenType.RBRACKET);
        expr = AST.IndexExpr(expr, index);
      } else {
        break;
      }
    }

    return expr;
  }

  parsePrimary() {
    const token = this.peek();

    switch (token.type) {
      case TokenType.NUMBER:
        this.advance();
        return AST.NumberLiteral(token.value);

      case TokenType.STRING:
        this.advance();
        return AST.StringLiteral(token.value);

      case TokenType.BOOLEAN:
        this.advance();
        return AST.BooleanLiteral(token.value);

      case TokenType.NULL_KW:
        this.advance();
        return AST.NullLiteral();

      case TokenType.IDENTIFIER:
        this.advance();
        return AST.Identifier(token.value);

      case TokenType.FN:
        return this.parseFnExpr();

      case TokenType.LBRACKET:
        return this.parseArrayLiteral();

      case TokenType.LPAREN:
        this.advance();
        const expr = this.parseExpression();
        this.expect(TokenType.RPAREN);
        return expr;

      default:
        throw new ParseError(`Unexpected token: ${token.type} (${JSON.stringify(token.value)})`, token);
    }
  }

  parseFnExpr() {
    this.expect(TokenType.FN);
    const params = this.parseParams();
    const body = this.parseBlock();
    return AST.FnExpr(params, body);
  }

  parseArrayLiteral() {
    this.expect(TokenType.LBRACKET);
    const elements = [];
    this.skipNewlines();
    if (this.peek().type !== TokenType.RBRACKET) {
      elements.push(this.parseExpression());
      while (this.match(TokenType.COMMA)) {
        this.skipNewlines();
        if (this.peek().type === TokenType.RBRACKET) break;
        elements.push(this.parseExpression());
      }
    }
    this.skipNewlines();
    this.expect(TokenType.RBRACKET);
    return AST.ArrayLiteral(elements);
  }

  eatStatementEnd() {
    if (this.peek().type === TokenType.NEWLINE) {
      this.advance();
    }
    // Also OK to end at EOF or before '}'
  }
}
