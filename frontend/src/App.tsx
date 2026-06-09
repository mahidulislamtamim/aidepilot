import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TabBar } from '@/components/layout/TabBar';
import { AlertContainer } from '@/components/ui/Alert';
import { CodeGenModal } from '@/components/modals/CodeGenModal';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { EnvironmentModal } from '@/components/modals/EnvironmentModal';
import { MoveToFolderModal } from '@/components/modals/MoveToFolderModal';
import { RenameWorkspaceModal } from '@/components/modals/RenameWorkspaceModal';
import { RequestResponseSplit } from '@/components/layout/RequestResponseSplit';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useAppStore } from '@/store/useAppStore';

export default function App() {
  const { initialize, isLoading, sendRequest, saveCurrentTab, openNewTab, environments } = useAppStore();
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
        <RequestResponseSplit />

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
      <EnvironmentModal isOpen={!!envModalId} onClose={() => setEnvModalId(null)} environmentId={envModalId} />
      <MoveToFolderModal />
      <RenameWorkspaceModal />
      <ConfirmDialog />
      <AlertContainer />
    </div>
  );
}
