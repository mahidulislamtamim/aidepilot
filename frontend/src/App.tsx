import { AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TabBar } from '@/components/layout/TabBar';
import { CodeGenModal } from '@/components/modals/CodeGenModal';
import { EnvironmentModal } from '@/components/modals/EnvironmentModal';
import { RequestBuilder } from '@/components/request/RequestBuilder';
import { ResponseViewer } from '@/components/response/ResponseViewer';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useAppStore } from '@/store/useAppStore';

export default function App() {
  const { initialize, isLoading, error, clearError, sendRequest, saveCurrentTab, openNewTab, environments } =
    useAppStore();
  const [envModalId, setEnvModalId] = useState<string | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useKeyboardShortcuts([
    { key: 'Enter', ctrl: true, handler: () => sendRequest() },
    { key: 's', ctrl: true, handler: () => saveCurrentTab() },
    { key: 't', ctrl: true, handler: () => openNewTab() },
  ]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading AidePilot...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-surface">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <TabBar />

        <div className="flex-1 flex flex-col min-h-0">
          <RequestBuilder />
          <ResponseViewer />
        </div>

        {/* Active environment indicator */}
        {environments.some((e) => e.is_active) && (
          <div className="px-4 py-1.5 bg-surface-50 border-t border-surface-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-xs text-gray-500">
              Environment:{' '}
              <button
                className="text-accent hover:underline"
                onClick={() => {
                  const active = environments.find((e) => e.is_active);
                  if (active) setEnvModalId(active.id);
                }}
              >
                {environments.find((e) => e.is_active)?.name}
              </button>
            </span>
          </div>
        )}
      </main>

      <CodeGenModal />
      <EnvironmentModal
        isOpen={!!envModalId}
        onClose={() => setEnvModalId(null)}
        environmentId={envModalId}
      />

      {error && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm max-w-md">
          <AlertCircle size={16} className="shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={clearError} className="text-red-300 hover:text-white ml-2">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
