import { performance } from 'node:perf_hooks';
import { Linter } from 'eslint';
import plugin from '../src/plugin';
import { getRulesForConfig } from '../src/rules';

const iterations = 7;
const cases = {
  'no-valibot': Array.from(
    { length: 500 },
    (_, index) => `const value${index} = ${index};`,
  ).join('\n'),
  'large-object': `import * as v from 'valibot'; const Schema = v.object({${Array.from({ length: 1000 }, (_, index) => `field${index}: v.string()`).join(',')}});`,
  'long-pipe': `import * as v from 'valibot'; const Schema = v.pipe(v.string(), ${Array.from({ length: 300 }, () => 'v.minLength(1)').join(',')});`,
  'nested-scopes': `import * as v from 'valibot'; ${Array.from({ length: 100 }, (_, index) => `function fn${index}(v) { function nested() { return v.any(); } return nested(); }`).join('\n')}`,
};
const config: Linter.Config[] = [
  {
    plugins: { valibot: plugin as never },
    rules: getRulesForConfig('all') as Linter.Config['rules'],
  },
];
const measurements = Object.entries(cases).map(([name, code]) => {
  const lint = () => new Linter().verify(code, config);
  for (let warmup = 0; warmup < 3; warmup++) lint();
  const samples: number[] = [];
  let diagnostics = 0;
  for (let iteration = 0; iteration < iterations; iteration++) {
    const start = performance.now();
    const messages = lint();
    if (messages.some((message) => message.fatal))
      throw new Error(`Invalid benchmark fixture: ${name}`);
    samples.push(performance.now() - start);
    diagnostics = messages.length;
  }
  samples.sort((left, right) => left - right);
  return {
    name,
    bytes: Buffer.byteLength(code),
    diagnostics,
    medianMs: Number(samples[Math.floor(iterations / 2)].toFixed(2)),
    minMs: Number(samples[0].toFixed(2)),
  };
});
process.stdout.write(
  `${JSON.stringify({ node: process.version, platform: process.platform, iterations, measurements }, null, 2)}\n`,
);
