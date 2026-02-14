import { LogList } from '@/components/Viewer/LogList.tsx';
import { ControlBar } from '@/components/ControlBar/ControlBar.tsx';

import { useLogWorker } from '@/hooks/useLogWorker.ts';
import { useAdb } from '@/hooks/useAdb.ts';

function App() {
  const { addChunk, clearLogs } = useLogWorker();
  const { connect, isConnected, deviceName, startMock } = useAdb(addChunk);

  return (
    <div className="flex flex-col h-screen w-screen bg-base text-gray-100 overflow-hidden relative font-mono">
      {/* Background Decor (optional) */}
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-blue-500 via-base to-base"></div>

      <ControlBar
        isConnected={isConnected}
        deviceUniqueId={deviceName || undefined}
        onConnect={connect}
        onClear={clearLogs}
      />

      {/* Demo Actions (Hidden/Subtle) */}
      {!isConnected && (
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
