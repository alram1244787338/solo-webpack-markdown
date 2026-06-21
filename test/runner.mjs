// Lightweight hand-written test runner: describe / it / expect + beforeEach.
// No external framework. Discovers test/*.test.mjs and runs them sequentially.

import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import './setup.mjs';

const suites = [];
let currentSuite = null;
let topLevelSuite = null;

function describe(name, fn) {
  const suite = { name, tests: [], beforeEachHooks: [] };
  suites.push(suite);
  const prev = currentSuite;
  currentSuite = suite;
  try {
    fn();
  } finally {
    currentSuite = prev;
  }
}

function it(name, fn) {
  let suite = currentSuite;
  if (!suite) {
    if (!topLevelSuite) {
      topLevelSuite = { name: '', tests: [], beforeEachHooks: [] };
      suites.push(topLevelSuite);
    }
    suite = topLevelSuite;
  }
  suite.tests.push({ name, fn });
}

function beforeEach(fn) {
  if (currentSuite) currentSuite.beforeEachHooks.push(fn);
}

globalThis.describe = describe;
globalThis.it = it;
globalThis.beforeEach = beforeEach;

// ---- expect / matchers ----

function fmt(value) {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'function') return `[Function ${value.name || 'anonymous'}]`;
  if (value instanceof RegExp) return value.toString();
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function deepEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return false;
  if (typeof a !== 'object') return false;
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (a instanceof RegExp && b instanceof RegExp) return a.source === b.source && a.flags === b.flags;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) {
    if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
    if (!deepEqual(a[k], b[k])) return false;
  }
  return true;
}

function makeExpect(actual, negate = false) {
  const wrap = (cond, msg) => {
    const ok = negate ? !cond : cond;
    if (!ok) {
      throw new Error((negate ? 'Expected NOT: ' : 'Assertion failed: ') + msg);
    }
  };

  const api = {
    toBe(expected) {
      wrap(Object.is(actual, expected), `expected ${fmt(actual)} to be ${fmt(expected)}`);
    },
    toEqual(expected) {
      wrap(deepEqual(actual, expected), `expected ${fmt(actual)} to deeply equal ${fmt(expected)}`);
    },
    toStrictEqual(expected) {
      wrap(deepEqual(actual, expected), `expected ${fmt(actual)} to strictly equal ${fmt(expected)}`);
    },
    toBeTruthy() { wrap(Boolean(actual), `expected ${fmt(actual)} to be truthy`); },
    toBeFalsy() { wrap(!actual, `expected ${fmt(actual)} to be falsy`); },
    toBeNull() { wrap(actual === null, `expected ${fmt(actual)} to be null`); },
    toBeUndefined() { wrap(actual === undefined, `expected ${fmt(actual)} to be undefined`); },
    toBeDefined() { wrap(actual !== undefined, `expected ${fmt(actual)} to be defined`); },
    toContain(item) {
      let ok = false;
      if (typeof actual === 'string') ok = actual.includes(item);
      else if (Array.isArray(actual)) ok = actual.includes(item);
      wrap(ok, `expected ${fmt(actual)} to contain ${fmt(item)}`);
    },
    toMatch(re) {
      const regex = re instanceof RegExp ? re : new RegExp(re);
      wrap(regex.test(actual), `expected ${fmt(actual)} to match ${regex}`);
    },
    toHaveLength(n) {
      wrap(actual != null && actual.length === n, `expected length ${n}, got ${actual && actual.length}`);
    },
    toBeGreaterThan(n) { wrap(actual > n, `expected ${fmt(actual)} > ${n}`); },
    toBeGreaterThanOrEqual(n) { wrap(actual >= n, `expected ${fmt(actual)} >= ${n}`); },
    toBeLessThan(n) { wrap(actual < n, `expected ${fmt(actual)} < ${n}`); },
    toBeLessThanOrEqual(n) { wrap(actual <= n, `expected ${fmt(actual)} <= ${n}`); },
    toBeInstanceOf(cls) { wrap(actual instanceof cls, `expected instance of ${cls.name}`); },
    toThrow() {
      wrap(typeof actual === 'function', 'toThrow expects a function');
      let threw = false;
      try { actual(); } catch { threw = true; }
      wrap(threw, 'expected function to throw');
    },
    get not() { return makeExpect(actual, true); },
  };

  return api;
}

globalThis.expect = makeExpect;

// ---- discovery + run ----

const here = dirname(fileURLToPath(import.meta.url));
const testFiles = readdirSync(here)
  .filter((f) => f.endsWith('.test.mjs'))
  .sort();

for (const f of testFiles) {
  await import(new URL(f, import.meta.url).href);
}

let pass = 0;
let fail = 0;
const failures = [];

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

for (const suite of suites) {
  if (suite.tests.length === 0) continue;
  console.log(`\n${BOLD}${suite.name || '(top-level)'}${RESET}`);
  for (const t of suite.tests) {
    for (const hook of suite.beforeEachHooks) {
      try { await hook(); } catch (e) {
        failures.push({ suite: suite.name, test: t.name, error: new Error(`beforeEach hook failed: ${e.message}`) });
      }
    }
    try {
      await t.fn();
      pass += 1;
      console.log(`  ${GREEN}✓${RESET} ${DIM}${t.name}${RESET}`);
    } catch (e) {
      fail += 1;
      failures.push({ suite: suite.name, test: t.name, error: e });
      console.log(`  ${RED}✗${RESET} ${t.name}`);
    }
  }
}

console.log('');
if (failures.length) {
  console.log(`${RED}${BOLD}Failures:${RESET}`);
  for (const f of failures) {
    console.log(`\n  ${BOLD}${f.suite || '(top-level)'} › ${f.test}${RESET}`);
    console.log(`    ${RED}${f.error.message}${RESET}`);
    if (f.error.stack) {
      const firstLine = f.error.stack.split('\n').slice(1, 4).join('\n    ');
      console.log(`    ${DIM}${firstLine}${RESET}`);
    }
  }
}

console.log(
  `\n${BOLD}${pass + fail} tests${RESET} · ${GREEN}${pass} passed${RESET}` +
  (fail ? ` · ${RED}${fail} failed${RESET}` : ` · ${DIM}0 failed${RESET}`)
);

if (fail > 0) process.exitCode = 1;
