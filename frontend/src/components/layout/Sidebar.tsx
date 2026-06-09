import {
  ChevronDown,
  Clock,
  Download,
  Folder,
  FolderPlus,
  Globe,
  Plus,
  Search,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { getMethodColor } from '@/utils/helpers';
import { Button } from '../ui/Button';

export function Sidebar() {
  const {
    workspaces,
    activeWorkspaceId,
    folders,
    requests,
    searchQuery,
    sidebarView,
    setActiveWorkspace,
    createWorkspace,
    renameWorkspace,
    deleteWorkspace,
    exportWorkspace,
    importWorkspace,
    createFolder,
    createRequest,
    openRequest,
    duplicateRequest,
    deleteRequest,
    toggleFavorite,
    setSearchQuery,
    setSidebarView,
    history,
    environments,
    setActiveEnvironment,
    clearHistory,
  } = useAppStore();

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: string; id: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredRequests = requests.filter(
    (r) =>
      !searchQuery ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const rootRequests = filteredRequests.filter((r) => !r.folder_id);
  const getFolderRequests = (folderId: string) => filteredRequests.filter((r) => r.folder_id === folderId);

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleContextAction = async (action: string) => {
    if (!contextMenu) return;
    const { type, id } = contextMenu;
    setContextMenu(null);

    switch (action) {
      case 'rename-workspace': {
        const name = prompt('Workspace name:');
        if (name) await renameWorkspace(id, name);
        break;
      }
      case 'delete-workspace':
        if (confirm('Delete this workspace and all its data?')) await deleteWorkspace(id);
        break;
      case 'export-workspace':
        await exportWorkspace(id);
        break;
      case 'duplicate-request':
        await duplicateRequest(id);
        break;
      case 'delete-request':
        if (confirm('Delete this request?')) await deleteRequest(id);
        break;
      case 'toggle-favorite':
        await toggleFavorite(id);
        break;
      case 'new-folder': {
        const name = prompt('Folder name:');
        if (name) await createFolder(name);
        break;
      }
      case 'new-request':
        await createRequest(type === 'folder' ? id : null);
        break;
    }
  };

  return (
    <aside className="w-72 flex flex-col bg-surface-50 border-r border-surface-200 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-surface-200">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
          <Globe size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-tight">AidePilot</h1>
          <p className="text-[10px] text-gray-500">API Testing Client</p>
        </div>
      </div>

      {/* Workspace selector */}
      <div className="p-3 border-b border-surface-200 space-y-2">
        <div className="flex items-center gap-1">
          <select
            className="select flex-1 text-sm"
            value={activeWorkspaceId ?? ''}
            onChange={(e) => setActiveWorkspace(e.target.value)}
            onContextMenu={(e) => {
              if (activeWorkspaceId) {
                e.preventDefault();
                setContextMenu({ x: e.clientX, y: e.clientY, type: 'workspace', id: activeWorkspaceId });
              }
            }}
          >
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          <Button
            variant="ghost"
            size="sm"
            title="New Workspace"
            onClick={async () => {
              const name = prompt('Workspace name:');
              if (name) await createWorkspace(name);
            }}
          >
            <Plus size={16} />
          </Button>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" title="Import" onClick={() => fileInputRef.current?.click()}>
            <Upload size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            title="Export"
            disabled={!activeWorkspaceId}
            onClick={() => activeWorkspaceId && exportWorkspace(activeWorkspaceId)}
          >
            <Download size={14} />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importWorkspace(file);
              e.target.value = '';
            }}
          />
        </div>
      </div>

      {/* View tabs */}
      <div className="flex border-b border-surface-200">
        {(['requests', 'history', 'environments'] as const).map((view) => (
          <button
            key={view}
            className={`flex-1 py-2 text-xs font-medium capitalize transition-colors ${
              sidebarView === view ? 'text-accent border-b-2 border-accent' : 'text-gray-500 hover:text-gray-300'
            }`}
            onClick={() => setSidebarView(view)}
          >
            {view}
          </button>
        ))}
      </div>

      {sidebarView === 'requests' && (
        <>
          <div className="p-3 space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                className="input pl-8 text-xs"
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-1">
              <Button variant="secondary" size="sm" className="flex-1 text-xs" onClick={() => createRequest()}>
                <Plus size={12} /> Request
              </Button>
              <Button
                variant="ghost"
                size="sm"
                title="New Folder"
                onClick={async () => {
                  const name = prompt('Folder name:');
                  if (name) await createFolder(name);
                }}
              >
                <FolderPlus size={14} />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-3">
            {folders.map((folder) => (
              <div key={folder.id}>
                <button
                  className="flex items-center gap-1.5 w-full px-2 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-surface-100 rounded-md"
                  onClick={() => toggleFolder(folder.id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({ x: e.clientX, y: e.clientY, type: 'folder', id: folder.id });
                  }}
                >
                  <ChevronDown
                    size={12}
                    className={`transition-transform ${expandedFolders.has(folder.id) ? '' : '-rotate-90'}`}
                  />
                  <Folder size={12} />
                  <span className="truncate">{folder.name}</span>
                  <span className="ml-auto text-gray-600">{getFolderRequests(folder.id).length}</span>
                </button>
                {expandedFolders.has(folder.id) &&
                  getFolderRequests(folder.id).map((req) => (
                    <RequestItem
                      key={req.id}
                      request={req}
                      onOpen={() => openRequest(req)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({ x: e.clientX, y: e.clientY, type: 'request', id: req.id });
                      }}
                    />
                  ))}
              </div>
            ))}

            {rootRequests.map((req) => (
              <RequestItem
                key={req.id}
                request={req}
                onOpen={() => openRequest(req)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ x: e.clientX, y: e.clientY, type: 'request', id: req.id });
                }}
              />
            ))}

            {filteredRequests.length === 0 && (
              <p className="text-xs text-gray-600 text-center py-8">No requests yet</p>
            )}
          </div>
        </>
      )}

      {sidebarView === 'history' && (
        <div className="flex-1 overflow-y-auto p-2">
          <div className="flex justify-end mb-2">
            <Button variant="ghost" size="sm" onClick={clearHistory}>
              <Trash2 size={12} /> Clear
            </Button>
          </div>
          {history.map((h) => (
            <div key={h.id} className="px-2 py-2 text-xs hover:bg-surface-100 rounded-md cursor-default">
              <div className="flex items-center gap-2">
                <span className={`font-mono font-medium ${getMethodColor(h.method)}`}>{h.method}</span>
                <span className="truncate text-gray-400 flex-1">{h.url}</span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-gray-600">
                <Clock size={10} />
                <span>{new Date(h.created_at).toLocaleString()}</span>
                {h.status_code && (
                  <span className={h.status_code < 400 ? 'text-green-500' : 'text-red-400'}>
                    {h.status_code}
                  </span>
                )}
                {h.response_time && <span>{h.response_time}ms</span>}
              </div>
            </div>
          ))}
          {history.length === 0 && <p className="text-xs text-gray-600 text-center py-8">No history yet</p>}
        </div>
      )}

      {sidebarView === 'environments' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <Button
            variant="secondary"
            size="sm"
            className="w-full text-xs"
            onClick={async () => {
              const name = prompt('Environment name:');
              if (name) useAppStore.getState().createEnvironment(name);
            }}
          >
            <Plus size={12} /> Environment
          </Button>
          {environments.map((env) => (
            <button
              key={env.id}
              className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors ${
                env.is_active ? 'bg-accent/20 text-accent border border-accent/30' : 'hover:bg-surface-100 text-gray-400'
              }`}
              onClick={() => setActiveEnvironment(env.id)}
            >
              <div className="font-medium">{env.name}</div>
              <div className="text-gray-600 mt-0.5">{env.variables.length} variables</div>
            </button>
          ))}
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
          <div
            className="fixed z-50 bg-surface-100 border border-surface-200 rounded-lg shadow-xl py-1 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {contextMenu.type === 'workspace' && (
              <>
                <ContextItem label="Rename" onClick={() => handleContextAction('rename-workspace')} />
                <ContextItem label="Export" onClick={() => handleContextAction('export-workspace')} />
                <ContextItem label="Delete" danger onClick={() => handleContextAction('delete-workspace')} />
              </>
            )}
            {contextMenu.type === 'folder' && (
              <ContextItem label="New Request" onClick={() => handleContextAction('new-request')} />
            )}
            {contextMenu.type === 'request' && (
              <>
                <ContextItem label="Duplicate" onClick={() => handleContextAction('duplicate-request')} />
                <ContextItem label="Toggle Favorite" onClick={() => handleContextAction('toggle-favorite')} />
                <ContextItem label="Delete" danger onClick={() => handleContextAction('delete-request')} />
              </>
            )}
            {!['workspace', 'folder', 'request'].includes(contextMenu.type) && (
              <>
                <ContextItem label="New Folder" onClick={() => handleContextAction('new-folder')} />
                <ContextItem label="New Request" onClick={() => handleContextAction('new-request')} />
              </>
            )}
          </div>
        </>
      )}
    </aside>
  );
}

function RequestItem({
  request,
  onOpen,
  onContextMenu,
}: {
  request: { id: string; name: string; method: string; is_favorite: number };
  onOpen: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      className="flex items-center gap-2 w-full pl-6 pr-2 py-1.5 text-xs hover:bg-surface-100 rounded-md group"
      onClick={onOpen}
      onContextMenu={onContextMenu}
    >
      <span className={`font-mono font-semibold w-10 shrink-0 ${getMethodColor(request.method)}`}>
        {request.method}
      </span>
      <span className="truncate text-gray-300 group-hover:text-white">{request.name}</span>
      {!!request.is_favorite && <Star size={10} className="text-amber-400 shrink-0 ml-auto" fill="currentColor" />}
    </button>
  );
}

function ContextItem({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-surface-200 ${danger ? 'text-red-400' : 'text-gray-300'}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
