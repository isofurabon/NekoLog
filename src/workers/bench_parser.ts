import { parseLogLine } from "./parser.ts";

const validLogLine = "10-24 10:15:30.123 1234 5678 I MyApp: This is a log message";
const invalidLogLine = "This is a random stack trace line without header";
const tooLongLine = "A".repeat(15000);

Deno.bench("parseLogLine - valid log", () => {
  parseLogLine(validLogLine);
});

Deno.bench("parseLogLine - invalid log (no fallback provided)", () => {
  parseLogLine(invalidLogLine);
});

Deno.bench("parseLogLine - invalid log (fallback Date provided)", () => {
  parseLogLine(invalidLogLine, "10-24 10:15:30.123");
});

Deno.bench("parseLogLine - too long log (no fallback provided)", () => {
  parseLogLine(tooLongLine);
});

Deno.bench("parseLogLine - too long log (fallback Date provided)", () => {
  parseLogLine(tooLongLine, "10-24 10:15:30.123");
});
