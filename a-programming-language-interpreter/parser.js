const AST = {
    Program: (body) => ({ type: 'Program', body }),
    NumberLiteral: (value) => ({ type: 'NumberLiteral', value }),
    StringLiteral: (value) => ({ type: 'StringLiteral', value }),
    Identifier: (name) => ({ type: 'Identifier', name }),
}


class Parser {
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
            throw new Error('Expected ' + type + ' but got ' + token.type);
        }
        return this.advance();
    }
}