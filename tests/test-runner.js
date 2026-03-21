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
    console.log('\n🚀 Iniciando testes...');
    const output = typeof document !== 'undefined' ? document.getElementById('test-output') : null;
    if (output) output.innerHTML = ''; 

    for (const { name, fn } of this.tests) {
      try {
        await fn();
        console.log(`✅ ${name}`);
        if (output) this.logToUI(`✅ ${name}`, 'pass');
        this.passed++;
      } catch (error) {
        console.error(`❌ ${name}`);
        console.error(`   👉 ${error.message}`);
        if (output) this.logToUI(`❌ ${name}: ${error.message}`, 'fail');
        this.failed++;
      }
    }

    const resultMsg = `\n🏁 Resultado: ${this.passed} passaram, ${this.failed} falharam.`;
    console.log(resultMsg);
    if (output) this.logToUI(resultMsg, this.failed === 0 ? 'pass' : 'fail');
    
    if (this.failed > 0 && typeof process !== 'undefined') {
      process.exit(1);
    }
  }

  logToUI(message, type) {
    if (typeof document === 'undefined') return;
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
