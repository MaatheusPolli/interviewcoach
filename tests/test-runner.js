export class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  group(name, fn) {
    console.group(`📦 ${name}`);
    fn();
    console.groupEnd();
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    const output = document.getElementById('test-output');
    output.innerHTML = ''; // Clear previous results

    for (const { name, fn } of this.tests) {
      try {
        await fn();
        console.log(`✅ ${name}`);
        this.logToUI(`✅ ${name}`, 'pass');
        this.passed++;
      } catch (error) {
        console.error(`❌ ${name}`, error);
        this.logToUI(`❌ ${name}: ${error.message}`, 'fail');
        this.failed++;
      }
    }

    this.logToUI(`\n🏁 Result: ${this.passed} passed, ${this.failed} failed.`, this.failed === 0 ? 'pass' : 'fail');
  }

  logToUI(message, type) {
    const output = document.getElementById('test-output');
    const div = document.createElement('div');
    div.textContent = message;
    div.className = type;
    output.appendChild(div);
  }

  expect(actual) {
    return {
      toBe: (expected) => {
        if (actual !== expected) {
          throw new Error(`Expected ${expected} but got ${actual}`);
        }
      },
      toEqual: (expected) => {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
        }
      },
      toBeTruthy: () => {
        if (!actual) throw new Error(`Expected ${actual} to be truthy`);
      },
      toBeGreaterThan: (expected) => {
         if (actual <= expected) throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    };
  }
}

export const runner = new TestRunner();
