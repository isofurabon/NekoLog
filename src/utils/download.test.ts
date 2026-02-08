import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { downloadLogs, type DownloadOptions } from './download.ts';
import type { LogEntry } from '@/types';

describe('downloadLogs', () => {
    const mockLogs: LogEntry[] = [
        {
            id: 'test-id-1',
            timestamp: '2024-01-15 10:30:45.123',
            pid: '1234',
            tid: '5678',
            level: 'I',
            tag: 'TestApp',
            message: 'Test info message',
        },
        {
            id: 'test-id-2',
            timestamp: '2024-01-15 10:30:46.456',
            pid: '1234',
            tid: '5678',
            level: 'E',
            tag: 'TestApp',
            message: 'Test error message',
        },
    ];

    let mockCreateElement: ReturnType<typeof vi.fn>;
    let mockAppendChild: ReturnType<typeof vi.fn>;
    let mockRemoveChild: ReturnType<typeof vi.fn>;
    let mockClick: ReturnType<typeof vi.fn>;
    let mockCreateObjectURL: ReturnType<typeof vi.fn>;
    let mockRevokeObjectURL: ReturnType<typeof vi.fn>;
    let capturedBlob: Blob | null = null;
    let capturedAnchor: { href: string; download: string } | null = null;

    beforeEach(() => {
        capturedBlob = null;
        capturedAnchor = { href: '', download: '' };
        mockClick = vi.fn();

        const anchor = {
            _href: '',
            _download: '',
            get href() { return this._href; },
            set href(val: string) { this._href = val; capturedAnchor!.href = val; },
            get download() { return this._download; },
            set download(val: string) { this._download = val; capturedAnchor!.download = val; },
            click: mockClick,
        };
        mockCreateElement = vi.fn().mockReturnValue(anchor);

        mockAppendChild = vi.fn();
        mockRemoveChild = vi.fn();

        mockCreateObjectURL = vi.fn().mockImplementation((blob: Blob) => {
            capturedBlob = blob;
            return 'blob:test-url';
        });
        mockRevokeObjectURL = vi.fn();

        vi.stubGlobal('document', {
            createElement: mockCreateElement,
            body: {
                appendChild: mockAppendChild,
                removeChild: mockRemoveChild,
            },
        });

        vi.stubGlobal('URL', {
            createObjectURL: mockCreateObjectURL,
            revokeObjectURL: mockRevokeObjectURL,
        });

        vi.stubGlobal('Blob', class MockBlob {
            content: BlobPart[];
            options: BlobPropertyBag;
            constructor(content: BlobPart[], options?: BlobPropertyBag) {
                this.content = content;
                this.options = options || {};
            }
            text() {
                return this.content.join('');
            }
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('creates and triggers download', () => {
        downloadLogs(mockLogs);

        expect(mockCreateElement).toHaveBeenCalledWith('a');
        expect(mockAppendChild).toHaveBeenCalled();
        expect(mockClick).toHaveBeenCalled();
        expect(mockRemoveChild).toHaveBeenCalled();
        expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test-url');
    });

    it('generates correct filename with date', () => {
        const mockDate = new Date('2024-01-15T10:30:45.000Z');
        vi.setSystemTime(mockDate);

        downloadLogs(mockLogs);

        expect(capturedAnchor?.download).toMatch(/^nekolog_2024-01-15_\d{2}-\d{2}-\d{2}\.txt$/);

        vi.useRealTimers();
    });

    it('uses custom filename when provided', () => {
        const options: DownloadOptions = { fileName: 'my-custom-logs' };
        downloadLogs(mockLogs, options);

        expect(capturedAnchor?.download).toBe('my-custom-logs.txt');
    });

    it('generates JSON format when specified', async () => {
        const options: DownloadOptions = { format: 'json', fileName: 'logs' };
        downloadLogs(mockLogs, options);

        expect(capturedAnchor?.download).toBe('logs.json');

        // Check blob content
        if (capturedBlob) {
            const content = await (capturedBlob as unknown as { text: () => Promise<string> }).text();
            const parsed = JSON.parse(content);
            expect(parsed).toHaveLength(2);
            expect(parsed[0].tag).toBe('TestApp');
        }
    });

    it('generates TXT format by default', async () => {
        const options: DownloadOptions = { fileName: 'logs' };
        downloadLogs(mockLogs, options);

        expect(capturedAnchor?.download).toBe('logs.txt');

        // Check blob content
        if (capturedBlob) {
            const content = await (capturedBlob as unknown as { text: () => Promise<string> }).text();
            expect(content).toContain('2024-01-15 10:30:45.123  1234/ 5678 I TestApp: Test info message');
            expect(content).toContain('2024-01-15 10:30:46.456  1234/ 5678 E TestApp: Test error message');
        }
    });
    
    it('handles implementation specific or simple timestamps without error', async () => {
        const simpleLogs: LogEntry[] = [{
            id: 'simple-1',
            timestamp: '10:30:45', // Result of toLocaleTimeString()
            pid: '0',
            tid: '0',
            level: 'I',
            tag: 'System',
            message: 'Simple log'
        }];
        
        // Should not throw RangeError
        expect(() => downloadLogs(simpleLogs, { fileName: 'simple' })).not.toThrow();

        // Check content
        if (capturedBlob) {
            const content = await (capturedBlob as unknown as { text: () => Promise<string> }).text();
            expect(content).toContain('10:30:45     0/    0 I System: Simple log');
        }
    });
});
