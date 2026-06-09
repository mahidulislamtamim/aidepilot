import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export function RenameWorkspaceModal() {
  const { renameWorkspaceId, workspaces, renameWorkspace, closeRenameWorkspace } = useAppStore();
  const workspace = workspaces.find((w) => w.id === renameWorkspaceId);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (workspace) setName(workspace.name);
  }, [workspace]);

  if (!renameWorkspaceId || !workspace) return null;

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === workspace.name) {
      closeRenameWorkspace();
      return;
    }
    setSaving(true);
    try {
      await renameWorkspace(renameWorkspaceId, trimmed);
      closeRenameWorkspace();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={closeRenameWorkspace} title="Rename Workspace" size="sm">
      <div className="space-y-4">
        <div>
          <label htmlFor="workspace-name" className="text-xs text-gray-500 mb-1.5 block">
            Workspace name
          </label>
          <input
            id="workspace-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
            placeholder="Enter workspace name"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={closeRenameWorkspace} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
