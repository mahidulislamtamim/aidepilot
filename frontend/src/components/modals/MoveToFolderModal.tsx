import { Folder, FolderOutput } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Modal } from '../ui/Modal';

export function MoveToFolderModal() {
  const { moveToFolderRequestId, folders, requests, moveRequestToFolder, closeMoveToFolder } = useAppStore();

  if (!moveToFolderRequestId) return null;

  const request = requests.find((r) => r.id === moveToFolderRequestId);

  return (
    <Modal isOpen onClose={closeMoveToFolder} title="Move to Folder" size="sm">
      <p className="text-xs text-gray-500 mb-3">
        Move <span className="text-gray-300">{request?.name}</span> to:
      </p>
      <div className="space-y-1 max-h-60 overflow-y-auto">
        <button
          type="button"
          className={`flex items-center gap-2 w-full px-3 py-2 text-xs rounded-md transition-colors ${
            !request?.folder_id ? 'bg-accent/20 text-accent' : 'hover:bg-surface-100 text-gray-400 hover:text-white'
          }`}
          onClick={() => moveRequestToFolder(moveToFolderRequestId, null)}
        >
          <FolderOutput size={14} />
          No folder (root)
        </button>
        {folders.map((folder) => (
          <button
            key={folder.id}
            type="button"
            className={`flex items-center gap-2 w-full px-3 py-2 text-xs rounded-md transition-colors ${
              request?.folder_id === folder.id
                ? 'bg-accent/20 text-accent'
                : 'hover:bg-surface-100 text-gray-400 hover:text-white'
            }`}
            onClick={() => moveRequestToFolder(moveToFolderRequestId, folder.id)}
          >
            <Folder size={14} />
            {folder.name}
          </button>
        ))}
        {folders.length === 0 && (
          <p className="text-xs text-gray-600 text-center py-4">No folders yet. Create one first.</p>
        )}
      </div>
    </Modal>
  );
}
