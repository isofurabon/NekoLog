import { LogList } from '@/components/Viewer/LogList.tsx';
import { ControlBar } from '@/components/ControlBar/ControlBar.tsx';

import { useLogWorker } from '@/hooks/useLogWorker.ts';
import { useAdb } from '@/hooks/useAdb.ts';
import { useSetAtom, useAtom } from 'jotai';

import { isViewingFileAtom, currentFileNameAtom, isLoadingFileAtom, loadingProgressAtom } from '@/store';
import { useCallback, useState } from 'react';



function App() {
  const { addChunk, clearLogs, flushLogs } = useLogWorker();

  const { connect, isConnected, deviceName, startMock } = useAdb(addChunk);

  const [isDragging, setIsDragging] = useState(false);
  const [isViewingFile, setIsViewingFile] = useAtom(isViewingFileAtom);
  const setCurrentFileName = useSetAtom(currentFileNameAtom);

  const setIsLoadingFile = useSetAtom(isLoadingFileAtom);
  const setLoadingProgress = useSetAtom(loadingProgressAtom);


  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {

    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];
    console.log('Dropped file:', file.name);

    // Reset state
    clearLogs();
    setIsViewingFile(true);
    setCurrentFileName(file.name);
    setIsLoadingFile(true);
    setLoadingProgress(0);

    // Read file in chunks
    const CHUNK_SIZE = 1024 * 1024; // 1MB
    const totalSize = file.size;
    let offset = 0;

    const reader = new FileReader();

    const readNextChunk = () => {
      const slice = file.slice(offset, offset + CHUNK_SIZE);
      reader.readAsArrayBuffer(slice);
    };

    reader.onload = (e) => {
      if (e.target?.result) {
        addChunk(e.target.result as ArrayBuffer);
        offset += CHUNK_SIZE;

        const progress = Math.min(100, Math.round((offset / totalSize) * 100));

        setLoadingProgress(progress);

        if (offset < totalSize) {
          // Small delay to allow UI updates and prevent blocking
          setTimeout(readNextChunk, 0);
        } else {
          setIsLoadingFile(false);
          flushLogs();
        }
      }
    };

    reader.onerror = () => {
      console.error('Error reading file');
      setIsLoadingFile(false);
    };

    readNextChunk();

  }, [addChunk, clearLogs, flushLogs, setIsViewingFile, setCurrentFileName, setIsLoadingFile, setLoadingProgress]);



  return (
    <div
      className="flex flex-col h-screen w-screen bg-base text-gray-100 overflow-hidden relative font-mono"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Background Decor (optional) */}
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-blue-500 via-base to-base"></div>

      {isDragging && (
        <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center backdrop-blur-sm border-4 border-blue-500/50 m-4 rounded-xl">
          <div className="text-2xl font-bold text-blue-400">Drop log file to open</div>
        </div>
      )}


      <ControlBar
        isConnected={isConnected}
        deviceUniqueId={deviceName || undefined}
        onConnect={connect}
        onClear={clearLogs}
      />

      {/* Demo Actions (Hidden/Subtle) */}
      {!isConnected && !isViewingFile && (

        <div className="absolute top-40 left-1/2 -translate-x-1/2 z-10 text-xs text-gray-600">
          <button type="button"
            onClick={startMock}
            className="hover:text-blue-400 border border-t-white/5 px-2 py-1 rounded bg-crust/50"
          >
            Start Demo Mode
          </button>
        </div>
      )}

      <LogList />

      {/* Footer Links */}
      <div className="footer-links">
        <a href="https://github.com/isofurabon/NekoLog" target="_blank" rel="noopener noreferrer">GitHub</a>
        <span className="separator">|</span>
        <a href="THIRD-PARTY-NOTICES.txt" download="THIRD-PARTY-NOTICES.txt">Third Party Notices</a>
      </div>

    </div>
  );
}

export default App;
