import { LogList } from '@/components/Viewer/LogList.tsx';
import { ControlBar } from '@/components/ControlBar/ControlBar.tsx';

import { useLogWorker } from '@/hooks/useLogWorker.ts';
import { useAdb } from '@/hooks/useAdb.ts';
import { useFileDrop } from '@/hooks/useFileDrop.ts';
import { useAtomValue } from 'jotai';
import { isViewingFileAtom } from '@/store';

function App() {
  const { addChunk, clearLogs, flushLogs } = useLogWorker();
  const { connect, disconnect, isConnected, deviceName, startMock } = useAdb(addChunk);
  const isViewingFile = useAtomValue(isViewingFileAtom);

  const { isDragging, handleDragOver, handleDragLeave, handleDrop } = useFileDrop({
    addChunk,
    clearLogs,
    flushLogs,
    isConnected,
    disconnect,
  });

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

      <LogList />

      {/* Footer Links */}
      <div className="footer-links">
        {!isConnected && !isViewingFile && (
          <>
            <button type="button" onClick={startMock} className="hover:text-blue-400 hover:underline cursor-pointer">Start Demo Mode</button>
            <span className="separator">|</span>
          </>
        )}
        <a href="https://github.com/isofurabon/NekoLog" target="_blank" rel="noopener noreferrer">GitHub</a>
        <span className="separator">|</span>
        <a href="THIRD-PARTY-NOTICES.txt" download="THIRD-PARTY-NOTICES.txt">Third Party Notices</a>
      </div>

    </div>
  );
}

export default App;
