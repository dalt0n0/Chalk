/**
 * A tiny, fully sandboxed scripting language for progression
 * rules. No eval, no host access: a hand-written tokenizer, recursive-descent
 * parser and tree-walking interpreter over plain numbers.
 *
 * Grammar (informal):
 *   program    := statement*
 *   statement  := assignment | ifStmt
 *   assignment := IDENT ("=" | "+=" | "-=" | "*=" | "/=") expr
 *   ifStmt     := "if" "(" expr ")" block ("else" (ifStmt | block))?
 *   block      := "{" statement* "}"
 *   expr       := or
 *   or         := and ("||" and)*
 *   and        := cmp ("&&" cmp)*
 *   cmp        := add (("=="|"!="|"<"|"<="|">"|">=") add)?
 *   add        := mul (("+"|"-") mul)*
 *   mul        := unary (("*"|"/"|"%") unary)*
 *   unary      := ("-"|"!") unary | primary
 *   primary    := NUMBER | IDENT | IDENT "(" args ")" | "(" expr ")"
 *
 * Statements are separated by newlines or ";".
 */

export class ScriptError extends Error {
  constructor(message: string, public pos?: number) {
    super(message);
    this.name = "ScriptError";
  }
}

// ---------------------------------------------------------------- tokenizer

type Token =
  | { kind: "num"; value: number; pos: number }
  | { kind: "ident"; value: string; pos: number }
  | { kind: "op"; value: string; pos: number }
  | { kind: "sep"; pos: number } // statement separator
  | { kind: "eof"; pos: number };

const TWO_CHAR_OPS = ["==", "!=", "<=", ">=", "&&", "||", "+=", "-=", "*=", "/="];
const ONE_CHAR_OPS = "+-*/%<>=!(){},";

function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === "\n" || c === ";") {
      if (tokens.length && tokens[tokens.length - 1].kind !== "sep")
        tokens.push({ kind: "sep", pos: i });
      i++;
      continue;
    }
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (c === "#" || (c === "/" && src[i + 1] === "/")) {
      while (i < src.length && src[i] !== "\n") i++;
      continue;
    }
    if (/[0-9.]/.test(c)) {
      const start = i;
      while (i < src.length && /[0-9.]/.test(src[i])) i++;
      const raw = src.slice(start, i);
      const value = Number(raw);
      if (!Number.isFinite(value))
        throw new ScriptError(`Invalid number "${raw}"`, start);
      tokens.push({ kind: "num", value, pos: start });
      continue;
    }
    if (/[a-zA-Z_]/.test(c)) {
      const start = i;
      while (i < src.length && /[a-zA-Z0-9_]/.test(src[i])) i++;
      tokens.push({ kind: "ident", value: src.slice(start, i), pos: start });
      continue;
    }
    const two = src.slice(i, i + 2);
    if (TWO_CHAR_OPS.includes(two)) {
      tokens.push({ kind: "op", value: two, pos: i });
      i += 2;
      continue;
    }
    if (ONE_CHAR_OPS.includes(c)) {
      tokens.push({ kind: "op", value: c, pos: i });
      i++;
      continue;
    }
    throw new ScriptError(`Unexpected character "${c}"`, i);
  }
  tokens.push({ kind: "eof", pos: src.length });
  return tokens;
}

// ------------------------------------------------------------------ parser

type Expr =
  | { t: "num"; v: number }
  | { t: "var"; name: string }
  | { t: "call"; name: string; args: Expr[] }
  | { t: "unary"; op: string; e: Expr }
  | { t: "bin"; op: string; l: Expr; r: Expr };

type Stmt =
  | { t: "assign"; name: string; op: string; e: Expr }
  | { t: "if"; cond: Expr; then: Stmt[]; else?: Stmt[] };

class Parser {
  private i = 0;
  constructor(private tokens: Token[]) {}

  private peek(): Token {
    return this.tokens[this.i];
  }
  private next(): Token {
    return this.tokens[this.i++];
  }
  private skipSeps() {
    while (this.peek().kind === "sep") this.i++;
  }
  private expectOp(op: string) {
    const t = this.next();
    if (t.kind !== "op" || t.value !== op)
      throw new ScriptError(`Expected "${op}"`, t.pos);
  }

  parseProgram(): Stmt[] {
    const stmts: Stmt[] = [];
    this.skipSeps();
    while (this.peek().kind !== "eof") {
      stmts.push(this.parseStatement());
      this.skipSeps();
    }
    return stmts;
  }

  private parseStatement(): Stmt {
    const t = this.peek();
    if (t.kind === "ident" && t.value === "if") return this.parseIf();
    if (t.kind === "ident") {
      const name = (this.next() as Token & { value: string }).value;
      const op = this.next();
      if (
        op.kind !== "op" ||
        !["=", "+=", "-=", "*=", "/="].includes(op.value)
      )
        throw new ScriptError(
          `Expected assignment after "${name}"`,
          op.pos
        );
      return { t: "assign", name, op: op.value, e: this.parseExpr() };
    }
    throw new ScriptError("Expected a statement", t.pos);
  }

  private parseIf(): Stmt {
    this.next(); // "if"
    this.expectOp("(");
    const cond = this.parseExpr();
    this.expectOp(")");
    const then = this.parseBlock();
    let elseBranch: Stmt[] | undefined;
    this.skipSeps();
    const t = this.peek();
    if (t.kind === "ident" && t.value === "else") {
      this.next();
      this.skipSeps();
      const after = this.peek();
      if (after.kind === "ident" && after.value === "if") {
        elseBranch = [this.parseIf()];
      } else {
        elseBranch = this.parseBlock();
      }
    }
    return { t: "if", cond, then, else: elseBranch };
  }

  private parseBlock(): Stmt[] {
    this.skipSeps();
    this.expectOp("{");
    const stmts: Stmt[] = [];
    this.skipSeps();
    while (true) {
      const t = this.peek();
      if (t.kind === "eof") throw new ScriptError('Missing "}"', t.pos);
      if (t.kind === "op" && t.value === "}") {
        this.next();
        return stmts;
      }
      stmts.push(this.parseStatement());
      this.skipSeps();
    }
  }

  parseExpr(): Expr {
    return this.parseOr();
  }
  private parseOr(): Expr {
    let l = this.parseAnd();
    while (this.peek().kind === "op" && (this.peek() as never as { value: string }).value === "||") {
      this.next();
      l = { t: "bin", op: "||", l, r: this.parseAnd() };
    }
    return l;
  }
  private parseAnd(): Expr {
    let l = this.parseCmp();
    while (this.peek().kind === "op" && (this.peek() as never as { value: string }).value === "&&") {
      this.next();
      l = { t: "bin", op: "&&", l, r: this.parseCmp() };
    }
    return l;
  }
  private parseCmp(): Expr {
    const l = this.parseAdd();
    const t = this.peek();
    if (
      t.kind === "op" &&
      ["==", "!=", "<", "<=", ">", ">="].includes(t.value)
    ) {
      this.next();
      return { t: "bin", op: t.value, l, r: this.parseAdd() };
    }
    return l;
  }
  private parseAdd(): Expr {
    let l = this.parseMul();
    while (true) {
      const t = this.peek();
      if (t.kind === "op" && (t.value === "+" || t.value === "-")) {
        this.next();
        l = { t: "bin", op: t.value, l, r: this.parseMul() };
      } else return l;
    }
  }
  private parseMul(): Expr {
    let l = this.parseUnary();
    while (true) {
      const t = this.peek();
      if (t.kind === "op" && ["*", "/", "%"].includes(t.value)) {
        this.next();
        l = { t: "bin", op: t.value, l, r: this.parseUnary() };
      } else return l;
    }
  }
  private parseUnary(): Expr {
    const t = this.peek();
    if (t.kind === "op" && (t.value === "-" || t.value === "!")) {
      this.next();
      return { t: "unary", op: t.value, e: this.parseUnary() };
    }
    return this.parsePrimary();
  }
  private parsePrimary(): Expr {
    const t = this.next();
    if (t.kind === "num") return { t: "num", v: t.value };
    if (t.kind === "ident") {
      const nxt = this.peek();
      if (nxt.kind === "op" && nxt.value === "(") {
        this.next();
        const args: Expr[] = [];
        if (!(this.peek().kind === "op" && (this.peek() as never as { value: string }).value === ")")) {
          while (true) {
            args.push(this.parseExpr());
            const sep = this.peek();
            if (sep.kind === "op" && sep.value === ",") {
              this.next();
              continue;
            }
            break;
          }
        }
        this.expectOp(")");
        return { t: "call", name: t.value, args };
      }
      return { t: "var", name: t.value };
    }
    if (t.kind === "op" && t.value === "(") {
      const e = this.parseExpr();
      this.expectOp(")");
      return e;
    }
    throw new ScriptError("Expected an expression", t.pos);
  }
}

// -------------------------------------------------------------- interpreter

export type ScriptScope = {
  /** Mutable exercise state; assignments write here. */
  state: Record<string, number>;
  /** Read-only builtins like week, completed, totalReps. */
  builtins?: Record<string, number>;
};

const FUNCS: Record<string, (...args: number[]) => number> = {
  roundTo: (x, inc) => (inc > 0 ? Math.round(x / inc) * inc : x),
  floorTo: (x, inc) => (inc > 0 ? Math.floor(x / inc) * inc : x),
  ceilTo: (x, inc) => (inc > 0 ? Math.ceil(x / inc) * inc : x),
  min: (...a) => Math.min(...a),
  max: (...a) => Math.max(...a),
  abs: (x) => Math.abs(x),
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
};

const MAX_OPS = 10_000;

function evalExpr(e: Expr, scope: ScriptScope, budget: { ops: number }): number {
  if (budget.ops-- <= 0) throw new ScriptError("Script exceeded execution budget");
  switch (e.t) {
    case "num":
      return e.v;
    case "var": {
      if (e.name in scope.state) return scope.state[e.name];
      if (scope.builtins && e.name in scope.builtins)
        return scope.builtins[e.name];
      throw new ScriptError(`Unknown variable "${e.name}"`);
    }
    case "call": {
      const fn = FUNCS[e.name];
      if (!fn) throw new ScriptError(`Unknown function "${e.name}"`);
      return fn(...e.args.map((a) => evalExpr(a, scope, budget)));
    }
    case "unary": {
      const v = evalExpr(e.e, scope, budget);
      return e.op === "-" ? -v : v ? 0 : 1;
    }
    case "bin": {
      if (e.op === "&&") {
        return evalExpr(e.l, scope, budget)
          ? evalExpr(e.r, scope, budget)
            ? 1
            : 0
          : 0;
      }
      if (e.op === "||") {
        return evalExpr(e.l, scope, budget)
          ? 1
          : evalExpr(e.r, scope, budget)
            ? 1
            : 0;
      }
      const l = evalExpr(e.l, scope, budget);
      const r = evalExpr(e.r, scope, budget);
      switch (e.op) {
        case "+": return l + r;
        case "-": return l - r;
        case "*": return l * r;
        case "/": {
          if (r === 0) throw new ScriptError("Division by zero");
          return l / r;
        }
        case "%": return l % r;
        case "==": return l === r ? 1 : 0;
        case "!=": return l !== r ? 1 : 0;
        case "<": return l < r ? 1 : 0;
        case "<=": return l <= r ? 1 : 0;
        case ">": return l > r ? 1 : 0;
        case ">=": return l >= r ? 1 : 0;
        default:
          throw new ScriptError(`Unknown operator "${e.op}"`);
      }
    }
  }
}

function execStmts(stmts: Stmt[], scope: ScriptScope, budget: { ops: number }) {
  for (const s of stmts) {
    if (budget.ops-- <= 0)
      throw new ScriptError("Script exceeded execution budget");
    if (s.t === "assign") {
      if (scope.builtins && s.name in scope.builtins && !(s.name in scope.state))
        throw new ScriptError(`Cannot assign to built-in "${s.name}"`);
      const rhs = evalExpr(s.e, scope, budget);
      if (s.op === "=") scope.state[s.name] = rhs;
      else {
        const cur = scope.state[s.name];
        if (cur === undefined)
          throw new ScriptError(`Unknown variable "${s.name}"`);
        if (s.op === "+=") scope.state[s.name] = cur + rhs;
        else if (s.op === "-=") scope.state[s.name] = cur - rhs;
        else if (s.op === "*=") scope.state[s.name] = cur * rhs;
        else if (s.op === "/=") {
          if (rhs === 0) throw new ScriptError("Division by zero");
          scope.state[s.name] = cur / rhs;
        }
      }
      if (!Number.isFinite(scope.state[s.name]))
        throw new ScriptError(`"${s.name}" became a non-finite number`);
    } else {
      const cond = evalExpr(s.cond, scope, budget);
      if (cond) execStmts(s.then, scope, budget);
      else if (s.else) execStmts(s.else, scope, budget);
    }
  }
}

/** Run a LiftScript program, mutating scope.state. Throws ScriptError. */
export function runScript(src: string, scope: ScriptScope): void {
  const stmts = new Parser(tokenize(src)).parseProgram();
  execStmts(stmts, scope, { ops: MAX_OPS });
}

/** Evaluate a single LiftScript expression (used for set weights). */
export function evalExpression(src: string, scope: ScriptScope): number {
  const parser = new Parser(tokenize(src));
  const e = parser.parseExpr();
  // ensure nothing trails except separators/eof
  const v = evalExpr(e, scope, { ops: MAX_OPS });
  if (!Number.isFinite(v)) throw new ScriptError("Expression is not a finite number");
  return v;
}

/** Validate a script without executing it. Returns an error message or null. */
export function checkScript(src: string): string | null {
  try {
    new Parser(tokenize(src)).parseProgram();
    return null;
  } catch (e) {
    return e instanceof ScriptError ? e.message : "Invalid script";
  }
}

/** Validate an expression without executing it. */
export function checkExpression(src: string): string | null {
  try {
    new Parser(tokenize(src)).parseExpr();
    return null;
  } catch (e) {
    return e instanceof ScriptError ? e.message : "Invalid expression";
  }
}
