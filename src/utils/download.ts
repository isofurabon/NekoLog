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

  let blobParts: BlobPart[] = [];
  let mimeType = '';

  if (format === 'json') {
    blobParts.push(JSON.stringify(logs, null, 2));
    mimeType = 'application/json;charset=utf-8';
  } else {
    const CHUNK_SIZE = 5000;
    let currentChunk = '';

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      if (i > 0) currentChunk += '\n';
      currentChunk += `${log.timestamp} ${log.pid.padStart(5)}/${log.tid.padStart(5)} ${log.level.toUpperCase()} ${log.tag}: ${log.message}`;

      if ((i + 1) % CHUNK_SIZE === 0) {
        blobParts.push(currentChunk);
        currentChunk = '';
      }
    }
    if (currentChunk.length > 0) {
      blobParts.push(currentChunk);
    }
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
