export type LogLevel = 'V' | 'D' | 'I' | 'W' | 'E' | 'F';

export interface LogEntry {
    id: string;        // UUID
    timestamp: string; // "MM-DD HH:mm:ss.mss"
    pid: string;       // Process ID
    tid: string;       // Thread ID
    level: LogLevel;
    tag: string;       // Tag name
    message: string;   // Log body
}

export type WorkerCommand =
    | { type: 'PARSE_CHUNK'; payload: ArrayBuffer }
    | { type: 'CLEAR' }
    | { type: 'FLUSH' };

export type WorkerResponse =
    | { type: 'NEW_LOGS'; payload: LogEntry[] }
    | { type: 'ERROR'; payload: string };
