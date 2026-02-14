import type { WorkerCommand, WorkerResponse, LogEntry, LogLevel } from '@/types';

let buffer = '';
const decoder = new TextDecoder();

// Standard `threadtime` format regex
// Date Time PID TID Level Tag: Message
export const LOG_REGEX = /^(\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\.\d{3})\s+(\d+)\s+(\d+)\s+([VDIWEF])\s+(.*?):\s+(.*)$/;

export function parseLogLine(line: string): Omit<LogEntry, 'id'> | null {
    if (!line.trim()) return null;

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
        // For now, treat them as part of the previous log or generic info?
        // Let's create a raw log entry for now to avoid losing data
        // Or if we have a previous log, append to its message?
        // Simpler approach for v1: Create a System/Info log
        const now = new Date();
        const timestamp = now.toISOString().slice(5, 23).replace('T', ' ');
        return {
            timestamp,
            pid: '?',
            tid: '?',
            level: 'I',
            tag: 'System',
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

        const lines = buffer.split('\n');
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        const newLogs: LogEntry[] = [];

        for (const line of lines) {
            const parsed = parseLogLine(line);
            if (parsed) {
                newLogs.push({
                    ...parsed,
                    id: self.crypto.randomUUID(),
                });
            }
        }

        if (newLogs.length > 0) {
            const response: WorkerResponse = { type: 'NEW_LOGS', payload: newLogs };
            self.postMessage(response);
        }
    } else if (type === 'CLEAR') {
        buffer = '';
    }
};
