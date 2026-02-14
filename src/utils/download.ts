import type { LogEntry } from '../types/index.ts';

export type DownloadFormat = 'txt' | 'json';

export interface DownloadOptions {
  fileName?: string;
  format?: DownloadFormat;
}

function formatDate(date: Date): string {
  return date.toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');
}

export function downloadLogs(logs: LogEntry[], options: DownloadOptions = {}) {
  const format = options.format || 'txt';
  // Default filename: nekolog_YYYY-MM-DD_HH-mm-ss
  const defaultFileName = `nekolog_${formatDate(new Date())}`;
  const fileName = (options.fileName || defaultFileName) + (options.fileName?.endsWith(`.${format}`) ? '' : `.${format}`);

  let blobParts: BlobPart[];
  let mimeType: string;

  if (format === 'json') {
    blobParts = [JSON.stringify(logs, null, 2)];
    mimeType = 'application/json;charset=utf-8';
  } else {
    // Optimization: Construct lines individually to avoid creating one massive string
    blobParts = logs.map((log, index) => {
      const line = `${log.timestamp} ${log.pid.padStart(5)}/${log.tid.padStart(5)} ${log.level.toUpperCase()} ${log.tag}: ${log.message}`;
      // Add newline to all lines except the last one to match .join('\n') behavior
      return index === logs.length - 1 ? line : line + '\n';
    });
    mimeType = 'text/plain;charset=utf-8';
  }

  const blob = new Blob(blobParts, { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
