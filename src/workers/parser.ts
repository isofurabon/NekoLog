import type { WorkerCommand, WorkerResponse, LogEntry, LogLevel } from '@/types';

let buffer = '';
const decoder = new TextDecoder();

// Generate a unique worker ID to prefix log IDs (e.g., "a1b2c3d4")
const workerId = self.crypto.randomUUID().slice(0, 8);
let logCounter = 0;

// Standard `threadtime` format regex
// Date Time PID TID Level Tag: Message
// Supports "PID TID", "PID/TID", "PID/ TID" etc.
export const LOG_REGEX = /^(\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\.\d{3})\s+([0-9?]+)(?:[\/\s]+)([0-9?]+)\s+([VDIWEF])\s+(.*?):\s+(.*)$/;



export function parseLogLine(line: string, fallbackTimestamp?: string): Omit<LogEntry, 'id'> | null {
    if (!line.trim()) return null;

    // Too long line check (e.g., > 10000 chars)
    if (line.length > 10000) {
        const timestamp = fallbackTimestamp ?? new Date().toISOString().slice(5, 23).replace('T', ' ');
        return {
            timestamp,
            pid: '?',
            tid: '?',
            level: 'W',
            tag: 'System',
            message: '<Message too long, omitted>',
        };
    }

    const match = line.match(LOG_REGEX);
    if (match) {
        const [, timestamp, pid, tid, level, tag, message] = match;
        return {
            timestamp,
            pid,
            tid,
            level: level as LogLevel,
            tag: tag.trim(),
            message: message.trim(),
        };
    } else {
        // Fallback for lines that don't match (e.g. stack traces often don't have headers)
        // Treat as INFO log with the raw line as message, but only populate message field
        // Others get default values
        const timestamp = fallbackTimestamp ?? new Date().toISOString().slice(5, 23).replace('T', ' ');
        return {
            timestamp,
            pid: '?',
            tid: '?',
            level: 'I',
            tag: 'Raw',
            message: line,
        };
    }
}

self.onmessage = (event: MessageEvent<WorkerCommand>) => {
    const { type } = event.data;

    if (type === 'PARSE_CHUNK') {
        const { payload } = event.data as { payload: ArrayBuffer };
        const text = decoder.decode(payload, { stream: true });
        buffer += text;

        // Safety: Prevent unlimited buffer growth (e.g. minified files or binary garbage)
        const MAX_BUFFER_SIZE = 10 * 1024 * 1024; // 10MB
        if (buffer.length > MAX_BUFFER_SIZE) {
            const nextNewline = buffer.indexOf('\n', MAX_BUFFER_SIZE);

            // Generate a warning log about the overflow
            const now = new Date();
            const timestamp = now.toISOString().slice(5, 23).replace('T', ' ');
            const overflowLog: LogEntry = {
                id: workerId + '-' + (logCounter++),
                timestamp,
                pid: '?',
                tid: '?',
                level: 'E',
                tag: 'NekoLog',
                message: `Buffer overflow detected (>10MB). Discarding ${nextNewline !== -1 ? nextNewline : buffer.length} characters to prevent crash.`,
            };

            // If we found a newline comfortably after the limit, slice from there
            if (nextNewline !== -1) {
                buffer = buffer.slice(nextNewline + 1);
            } else {
                // No newline found even after limit implies a massive single line or binary blob
                // discard everything
                buffer = '';
            }

            // Send the warning immediately
            self.postMessage({ type: 'NEW_LOGS', payload: [overflowLog] });
        }

        const lines = buffer.split('\n');
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        const newLogs: LogEntry[] = [];

        // Pre-compute fallback timestamp to avoid excessive Date instantiations per chunk
        const fallbackTimestamp = new Date().toISOString().slice(5, 23).replace('T', ' ');

        for (const line of lines) {
            const parsed = parseLogLine(line, fallbackTimestamp);
            if (parsed) {
                newLogs.push({
                    ...parsed,
                    id: workerId + '-' + (logCounter++),
                });
            }
        }

        if (newLogs.length > 0) {
            const response: WorkerResponse = { type: 'NEW_LOGS', payload: newLogs };
            self.postMessage(response);
        }
    } else if (type === 'CLEAR') {
        buffer = '';
    } else if (type === 'FLUSH') {
        if (buffer.trim()) {
            const parsed = parseLogLine(buffer);
            if (parsed) {
                const log = {
                    ...parsed,
                    id: workerId + '-' + (logCounter++),
                };
                const response: WorkerResponse = { type: 'NEW_LOGS', payload: [log] };
                self.postMessage(response);
            }
        }
        buffer = '';
    }

};
