
import { parseLogLine } from "../src/workers/parser.ts";

const SAMPLE_LINE = '12-25 10:10:10.123  1234  5678 I MyTag: This is a test message with some content';
const ITERATIONS = 1000000;

console.log(`Running benchmark with ${ITERATIONS} iterations...`);

// Warmup
for(let i=0; i<10000; i++) parseLogLine(SAMPLE_LINE);

// Measure parseLogLine cost alone (to isolate overhead)
{
    const start = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
        parseLogLine(SAMPLE_LINE);
    }
    const end = performance.now();
    console.log(`parseLogLine only: ${(end - start).toFixed(2)}ms`);
}

// Measure with crypto.randomUUID() (Baseline)
{
    const start = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
        const parsed = parseLogLine(SAMPLE_LINE);
        if (parsed) {
            const _log = {
                ...parsed,
                id: crypto.randomUUID(),
            };
        }
    }
    const end = performance.now();
    console.log(`With crypto.randomUUID(): ${(end - start).toFixed(2)}ms`);
}

// Measure with WorkerId + Counter (Optimized)
{
    const workerId = crypto.randomUUID().slice(0, 8);
    let logCounter = 0;
    const start = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
        const parsed = parseLogLine(SAMPLE_LINE);
        if (parsed) {
            const _log = {
                ...parsed,
                id: workerId + '-' + (logCounter++),
            };
        }
    }
    const end = performance.now();
    console.log(`With WorkerId+Counter (Optimized): ${(end - start).toFixed(2)}ms`);
}
