// ============================================================
// Flux Language — Interpreter
// Walks the AST and evaluates each node.
// ============================================================

import { Environment } from './environment.js';

class ReturnSignal {
  constructor(value) {
    this.value = value;
  }
}

export class RuntimeError extends Error {
  constructor(message) {
    super(`Runtime error — ${message}`);
  }
}

export class Interpreter {
  constructor() {
    this.globals = new Environment();
    this.output = [];
    this.setupBuiltins();
  }

  setupBuiltins() {
    this.globals.define('print', (...args) => {
      const text = args.map(a => this.stringify(a)).join(' ');
      console.log(text);
      this.output.push(text);
      return null;
    });

    this.globals.define('len', (val) => {
      if (typeof val === 'string' || Array.isArray(val)) return val.length;
      throw new RuntimeError(`len() expects a string or array, got ${typeof val}`);
    });

    this.globals.define('push', (arr, val) => {
      if (!Array.isArray(arr)) throw new RuntimeError('push() expects an array');
      arr.push(val);
      return arr;
    });

    this.globals.define('pop', (arr) => {
      if (!Array.isArray(arr)) throw new RuntimeError('pop() expects an array');
      return arr.pop();
    });

    this.globals.define('map', (arr, fn) => {
      if (!Array.isArray(arr)) throw new RuntimeError('map() expects an array');
      if (typeof fn !== 'function') throw new RuntimeError('map() expects a function');
      return arr.map(item => fn(item));
    });

    this.globals.define('filter', (arr, fn) => {
      if (!Array.isArray(arr)) throw new RuntimeError('filter() expects an array');
      if (typeof fn !== 'function') throw new RuntimeError('filter() expects a function');
      return arr.filter(item => fn(item));
    });

    this.globals.define('reduce', (arr, fn, init) => {
      if (!Array.isArray(arr)) throw new RuntimeError('reduce() expects an array');
      if (typeof fn !== 'function') throw new RuntimeError('reduce() expects a function');
      return arr.reduce((acc, item) => fn(acc, item), init);
    });

    this.globals.define('range', (start, end) => {
      if (end === undefined) { end = start; start = 0; }
      const result = [];
      for (let i = start; i < end; i++) result.push(i);
      return result;
    });

    this.globals.define('type', (val) => {
      if (val === null) return 'null';
      if (Array.isArray(val)) return 'array';
      if (typeof val === 'function') return 'function';
      return typeof val;
    });

    this.globals.define('str', (val) => this.stringify(val));
    this.globals.define('num', (val) => Number(val));

    this.globals.define('input', (prompt) => {
      // In REPL mode this will be overridden
      throw new RuntimeError('input() is only available in REPL mode');
    });
  }

  run(program) {
    return this.execBlock(program.body, this.globals);
  }

  execBlock(statements, env) {
    let result = null;
    for (const stmt of statements) {
      result = this.exec(stmt, env);
      if (result instanceof ReturnSignal) return result;
    }
    return result;
  }

  exec(node, env) {
    switch (node.type) {
      case 'NumberLiteral':  return node.value;
      case 'StringLiteral':  return node.value;
      case 'BooleanLiteral': return node.value;
      case 'NullLiteral':    return null;

      case 'ArrayLiteral':
        return node.elements.map(el => this.exec(el, env));

      case 'Identifier':
        return env.get(node.name);

      case 'BinaryExpr':
        return this.execBinary(node, env);

      case 'UnaryExpr':
        return this.execUnary(node, env);

      case 'LogicalExpr':
        return this.execLogical(node, env);

      case 'AssignExpr': {
        const value = this.exec(node.value, env);
        env.set(node.name, value);
        return value;
      }

      case 'IndexExpr': {
        const obj = this.exec(node.object, env);
        const idx = this.exec(node.index, env);
        if (Array.isArray(obj) || typeof obj === 'string') {
          if (typeof idx !== 'number') throw new RuntimeError('Index must be a number');
          return obj[idx];
        }
        throw new RuntimeError('Can only index into arrays and strings');
      }

      case 'LetDecl': {
        const value = this.exec(node.value, env);
        env.define(node.name, value);
        return value;
      }

      case 'FnDecl': {
        const fn = this.makeFunction(node.params, node.body, env);
        env.define(node.name, fn);
        return fn;
      }

      case 'FnExpr':
        return this.makeFunction(node.params, node.body, env);

      case 'ReturnStmt': {
        const value = node.value ? this.exec(node.value, env) : null;
        return new ReturnSignal(value);
      }

      case 'IfStmt':
        return this.execIf(node, env);

      case 'WhileStmt':
        return this.execWhile(node, env);

      case 'CallExpr':
        return this.execCall(node, env);

      case 'PipeExpr':
        return this.execPipe(node, env);

      case 'Block': {
        const blockEnv = new Environment(env);
        return this.execBlock(node.statements, blockEnv);
      }

      default:
        throw new RuntimeError(`Unknown AST node type: ${node.type}`);
    }
  }

  execBinary(node, env) {
    const left = this.exec(node.left, env);
    const right = this.exec(node.right, env);

    switch (node.op) {
      case '+':
        if (typeof left === 'string' || typeof right === 'string') {
          return this.stringify(left) + this.stringify(right);
        }
        return left + right;
      case '-':  return left - right;
      case '*':  return left * right;
      case '/':
        if (right === 0) throw new RuntimeError('Division by zero');
        return left / right;
      case '%':  return left % right;
      case '==': return left === right;
      case '!=': return left !== right;
      case '<':  return left < right;
      case '>':  return left > right;
      case '<=': return left <= right;
      case '>=': return left >= right;
      default:
        throw new RuntimeError(`Unknown operator: ${node.op}`);
    }
  }

  execUnary(node, env) {
    const operand = this.exec(node.operand, env);
    switch (node.op) {
      case '-':   return -operand;
      case 'not': return !this.isTruthy(operand);
      default:
        throw new RuntimeError(`Unknown unary operator: ${node.op}`);
    }
  }

  execLogical(node, env) {
    const left = this.exec(node.left, env);
    if (node.op === 'or')  return this.isTruthy(left) ? left : this.exec(node.right, env);
    if (node.op === 'and') return !this.isTruthy(left) ? left : this.exec(node.right, env);
    throw new RuntimeError(`Unknown logical operator: ${node.op}`);
  }

  execIf(node, env) {
    if (this.isTruthy(this.exec(node.condition, env))) {
      const blockEnv = new Environment(env);
      return this.execBlock(node.body.statements, blockEnv);
    }

    for (const elif of node.elifs) {
      if (this.isTruthy(this.exec(elif.condition, env))) {
        const blockEnv = new Environment(env);
        return this.execBlock(elif.body.statements, blockEnv);
      }
    }

    if (node.elseBody) {
      const blockEnv = new Environment(env);
      return this.execBlock(node.elseBody.statements, blockEnv);
    }

    return null;
  }

  execWhile(node, env) {
    let result = null;
    let iterations = 0;
    const MAX_ITERATIONS = 100000;

    while (this.isTruthy(this.exec(node.condition, env))) {
      const blockEnv = new Environment(env);
      result = this.execBlock(node.body.statements, blockEnv);
      if (result instanceof ReturnSignal) return result;

      iterations++;
      if (iterations > MAX_ITERATIONS) {
        throw new RuntimeError('Infinite loop detected (exceeded 100,000 iterations)');
      }
    }
    return result;
  }

  execCall(node, env) {
    const callee = this.exec(node.callee, env);
    const args = node.args.map(arg => this.exec(arg, env));

    if (typeof callee !== 'function') {
      throw new RuntimeError(`'${this.stringify(callee)}' is not a function`);
    }

    const result = callee(...args);
    if (result instanceof ReturnSignal) return result.value;
    return result;
  }

  execPipe(node, env) {
    const value = this.exec(node.left, env);

    // Right side can be: an identifier (function name), a call with extra args, or a fn expr
    if (node.right.type === 'Identifier') {
      const fn = env.get(node.right.name);
      if (typeof fn !== 'function') {
        throw new RuntimeError(`'${node.right.name}' is not a function`);
      }
      const result = fn(value);
      if (result instanceof ReturnSignal) return result.value;
      return result;
    }

    if (node.right.type === 'CallExpr') {
      const fn = this.exec(node.right.callee, env);
      const extraArgs = node.right.args.map(arg => this.exec(arg, env));
      if (typeof fn !== 'function') {
        throw new RuntimeError('Pipe target is not a function');
      }
      const result = fn(value, ...extraArgs);
      if (result instanceof ReturnSignal) return result.value;
      return result;
    }

    if (node.right.type === 'FnExpr') {
      const fn = this.exec(node.right, env);
      const result = fn(value);
      if (result instanceof ReturnSignal) return result.value;
      return result;
    }

    throw new RuntimeError('Invalid pipe target — expected a function or call');
  }

  makeFunction(params, body, closureEnv) {
    return (...args) => {
      const fnEnv = new Environment(closureEnv);
      for (let i = 0; i < params.length; i++) {
        fnEnv.define(params[i], args[i] !== undefined ? args[i] : null);
      }
      const result = this.execBlock(body.statements, fnEnv);
      if (result instanceof ReturnSignal) return result.value;
      return result;
    };
  }

  isTruthy(val) {
    if (val === null || val === false || val === 0 || val === '') return false;
    return true;
  }

  stringify(val) {
    if (val === null) return 'null';
    if (val === true) return 'true';
    if (val === false) return 'false';
    if (typeof val === 'function') return '<fn>';
    if (Array.isArray(val)) {
      return '[' + val.map(v => this.stringify(v)).join(', ') + ']';
    }
    return String(val);
  }
}
