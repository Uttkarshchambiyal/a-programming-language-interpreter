// ============================================================
// Flux Language — Environment
// A chain of scopes for variable lookup.
// Each scope has a parent — this is how closures work.
// ============================================================

export class Environment {
  constructor(parent = null) {
    this.vars = new Map();
    this.parent = parent;
  }

  define(name, value) {
    this.vars.set(name, value);
  }

  get(name) {
    if (this.vars.has(name)) {
      return this.vars.get(name);
    }
    if (this.parent) {
      return this.parent.get(name);
    }
    throw new ReferenceError(`Undefined variable: '${name}'`);
  }

  set(name, value) {
    if (this.vars.has(name)) {
      this.vars.set(name, value);
      return;
    }
    if (this.parent) {
      this.parent.set(name, value);
      return;
    }
    throw new ReferenceError(`Undefined variable: '${name}'`);
  }
}
