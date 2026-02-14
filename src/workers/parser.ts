import type { WorkerCommand, WorkerResponse, LogEntry, LogLevel } from '@/types';

let buffer = '';
const decoder = new TextDecoder();

// Standard `threadtime` format regex
// Date Time PID TID Level Tag: Message
const LOG_REGEX = /^(\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\.\d{3})\s+(\d+)\s+(\d+)\s+([VDIWEF])\s+(.*?):\s+(.*)$/;

export const MAX_BUFFER_SIZE = 10 * 1024 * 1024; // 10MB

function parseLogLine(line: string): LogEntry | null {
    if (!line.trim()) return null;

    const match = line.match(LOG_REGEX);
    if (match) {
        const [, timestamp, pid, tid, level, tag, message] = match;
        return {
            id: self.crypto.randomUUID(),
            timestamp,
            pid,
            tid,
            level: level as LogLevel,
            tag: tag.trim(),
            message: message.trim(),
        };
    } else {
        const now = new Date();
        const timestamp = now.toISOString().slice(5, 23).replace('T', ' ');
        return {
            id: self.crypto.randomUUID(),
            timestamp,
            pid: '?',
            tid: '?',
            level: 'I',
            tag: 'System',
            message: line,
        };
    }
}

function createWarningLog(message: string): LogEntry {
    const now = new Date();
    const timestamp = now.toISOString().slice(5, 23).replace('T', ' ');
    return {
        id: self.crypto.randomUUID(),
        timestamp,
        pid: '?',
        tid: '?',
        level: 'W',
        tag: 'NekoLogParser',
        message: message,
    };
}

export function processChunk(text: string, currentBuffer: string): { logs: LogEntry[], nextBuffer: string } {
    const buffer = currentBuffer + text;
    const logs: LogEntry[] = [];

    if (buffer.length > MAX_BUFFER_SIZE) {
        const lastNewlineIndex = buffer.lastIndexOf('\n');

        if (lastNewlineIndex === -1) {
            // Buffer is full and no newline found. Discard everything.
            logs.push(createWarningLog(`Buffer overflow: Line length exceeded ${MAX_BUFFER_SIZE} bytes. Discarding buffer.`));
            return { logs, nextBuffer: '' };
        }

        const tailLength = buffer.length - lastNewlineIndex - 1;
        if (tailLength > MAX_BUFFER_SIZE) {
            // The pending line at the end is too long.
            // Process the valid part up to the last newline.

            // Extract lines up to the last newline
            // split including the trailing empty string from the last \n
            const validPart = buffer.substring(0, lastNewlineIndex + 1);
            const lines = validPart.split('\n');
            // The last element is empty because validPart ends with \n
            lines.pop();

            for (const line of lines) {
                const parsed = parseLogLine(line);
                if (parsed) logs.push(parsed);
            }

            logs.push(createWarningLog(`Buffer overflow: Pending line length exceeded ${MAX_BUFFER_SIZE} bytes. Discarding pending line.`));
            return { logs, nextBuffer: '' };
        }
    }

    const lines = buffer.split('\n');
    const nextBuffer = lines.pop() || '';

    for (const line of lines) {
        const parsed = parseLogLine(line);
        if (parsed) logs.push(parsed);
    }

    return { logs, nextBuffer };
}

self.onmessage = (event: MessageEvent<WorkerCommand>) => {
    const { type } = event.data;

    if (type === 'PARSE_CHUNK') {
        const { payload } = event.data as { payload: ArrayBuffer };
        const text = decoder.decode(payload, { stream: true });

        const result = processChunk(text, buffer);
        buffer = result.nextBuffer;

        if (result.logs.length > 0) {
            const response: WorkerResponse = { type: 'NEW_LOGS', payload: result.logs };
            self.postMessage(response);
        }
    } else if (type === 'CLEAR') {
        buffer = '';
    }
};
