import { create } from 'zustand';
import {
  environmentApi,
  folderApi,
  historyApi,
  requestApi,
  workspaceApi,
} from '@/services/api';
import type {
  ApiRequest,
  Environment,
  ExecuteResponse,
  Folder,
  HistoryEntry,
  RequestEditorState,
  RequestTab,
  Workspace,
} from '@/types';
import { createNewTabState, editorStateToApiPayload, requestToEditorState } from '@/utils/helpers';

interface AppState {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  folders: Folder[];
  requests: ApiRequest[];
  environments: Environment[];
  history: HistoryEntry[];
  tabs: RequestTab[];
  activeTabId: string | null;
  response: ExecuteResponse | null;
  isLoading: boolean;
  isSending: boolean;
  searchQuery: string;
  sidebarView: 'requests' | 'history' | 'environments';
  showCodeGen: boolean;
  codeGenType: 'curl' | 'fetch' | 'axios';
  error: string | null;

  initialize: () => Promise<void>;
  setActiveWorkspace: (id: string) => Promise<void>;
  loadWorkspaceData: (workspaceId: string) => Promise<void>;

  createWorkspace: (name: string) => Promise<void>;
  renameWorkspace: (id: string, name: string) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  exportWorkspace: (id: string) => Promise<void>;
  importWorkspace: (file: File) => Promise<void>;

  createFolder: (name: string, parentId?: string | null) => Promise<void>;
  renameFolder: (id: string, name: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;

  createRequest: (folderId?: string | null) => Promise<void>;
  openRequest: (request: ApiRequest) => Promise<void>;
  duplicateRequest: (id: string) => Promise<void>;
  deleteRequest: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;

  openNewTab: () => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabData: (tabId: string, data: Partial<RequestEditorState>) => void;
  saveCurrentTab: () => Promise<void>;

  sendRequest: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSidebarView: (view: 'requests' | 'history' | 'environments') => void;
  setShowCodeGen: (show: boolean, type?: 'curl' | 'fetch' | 'axios') => void;
  clearError: () => void;

  createEnvironment: (name: string) => Promise<void>;
  updateEnvironment: (id: string, data: Partial<Environment>) => Promise<void>;
  deleteEnvironment: (id: string) => Promise<void>;
  setActiveEnvironment: (id: string) => Promise<void>;
  getActiveVariables: () => Record<string, string>;
  loadHistory: () => Promise<void>;
  clearHistory: () => Promise<void>;
}

let tabCounter = 0;
function newTabId() {
  return `tab-${++tabCounter}-${Date.now()}`;
}

export const useAppStore = create<AppState>((set, get) => ({
  workspaces: [],
  activeWorkspaceId: null,
  folders: [],
  requests: [],
  environments: [],
  history: [],
  tabs: [],
  activeTabId: null,
  response: null,
  isLoading: false,
  isSending: false,
  searchQuery: '',
  sidebarView: 'requests',
  showCodeGen: false,
  codeGenType: 'curl',
  error: null,

  initialize: async () => {
    set({ isLoading: true, error: null });
    try {
      const workspaces = await workspaceApi.getAll();
      set({ workspaces });
      if (workspaces.length > 0) {
        await get().setActiveWorkspace(workspaces[0].id);
      } else {
        get().openNewTab();
      }
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  setActiveWorkspace: async (id) => {
    set({ activeWorkspaceId: id, tabs: [], activeTabId: null, response: null });
    await get().loadWorkspaceData(id);
    get().openNewTab();
  },

  loadWorkspaceData: async (workspaceId) => {
    const [folders, requests, environments, history] = await Promise.all([
      folderApi.getByWorkspace(workspaceId),
      requestApi.getByWorkspace(workspaceId),
      environmentApi.getByWorkspace(workspaceId),
      historyApi.getByWorkspace(workspaceId),
    ]);
    set({ folders, requests, environments, history });
  },

  createWorkspace: async (name) => {
    const workspace = await workspaceApi.create(name);
    set((s) => ({ workspaces: [workspace, ...s.workspaces] }));
    await get().setActiveWorkspace(workspace.id);
  },

  renameWorkspace: async (id, name) => {
    const workspace = await workspaceApi.update(id, { name });
    set((s) => ({
      workspaces: s.workspaces.map((w) => (w.id === id ? workspace : w)),
    }));
  },

  deleteWorkspace: async (id) => {
    await workspaceApi.delete(id);
    const { workspaces, activeWorkspaceId } = get();
    const remaining = workspaces.filter((w) => w.id !== id);
    set({ workspaces: remaining });
    if (activeWorkspaceId === id && remaining.length > 0) {
      await get().setActiveWorkspace(remaining[0].id);
    } else if (remaining.length === 0) {
      set({ activeWorkspaceId: null, tabs: [], activeTabId: null });
      get().openNewTab();
    }
  },

  exportWorkspace: async (id) => {
    const data = await workspaceApi.export(id);
    const { downloadJson } = await import('@/utils/helpers');
    const ws = get().workspaces.find((w) => w.id === id);
    downloadJson(data, `${ws?.name ?? 'collection'}.aidepilot.json`);
  },

  importWorkspace: async (file) => {
    const text = await file.text();
    const data = JSON.parse(text);
    const workspace = await workspaceApi.import(data);
    set((s) => ({ workspaces: [workspace, ...s.workspaces] }));
    await get().setActiveWorkspace(workspace.id);
  },

  createFolder: async (name, parentId = null) => {
    const { activeWorkspaceId } = get();
    if (!activeWorkspaceId) return;
    const folder = await folderApi.create(activeWorkspaceId, name, parentId);
    set((s) => ({ folders: [...s.folders, folder] }));
  },

  renameFolder: async (id, name) => {
    const folder = await folderApi.update(id, { name });
    set((s) => ({ folders: s.folders.map((f) => (f.id === id ? folder : f)) }));
  },

  deleteFolder: async (id) => {
    await folderApi.delete(id);
    set((s) => ({
      folders: s.folders.filter((f) => f.id !== id),
      requests: s.requests.map((r) => (r.folder_id === id ? { ...r, folder_id: null } : r)),
    }));
  },

  createRequest: async (folderId = null) => {
    const { activeWorkspaceId } = get();
    if (!activeWorkspaceId) return;
    const request = await requestApi.create({
      workspace_id: activeWorkspaceId,
      ...editorStateToApiPayload(createNewTabState('New Request')),
      folder_id: folderId,
    });
    set((s) => ({ requests: [...s.requests, request] }));
    await get().openRequest(request);
  },

  openRequest: async (request) => {
    const full = request.headers ? request : await requestApi.get(request.id);
    const existingTab = get().tabs.find((t) => t.requestId === full.id);
    if (existingTab) {
      set({ activeTabId: existingTab.id });
      return;
    }

    const tab: RequestTab = {
      id: newTabId(),
      requestId: full.id,
      name: full.name,
      method: full.method,
      isDirty: false,
      data: requestToEditorState(full),
    };
    set((s) => ({ tabs: [...s.tabs, tab], activeTabId: tab.id, response: null }));
  },

  duplicateRequest: async (id) => {
    const request = await requestApi.duplicate(id);
    set((s) => ({ requests: [...s.requests, request] }));
    await get().openRequest(request);
  },

  deleteRequest: async (id) => {
    await requestApi.delete(id);
    set((s) => ({
      requests: s.requests.filter((r) => r.id !== id),
      tabs: s.tabs.filter((t) => t.requestId !== id),
      activeTabId: s.tabs.find((t) => t.requestId === id)
        ? s.tabs.find((t) => t.requestId !== id && t.id !== s.activeTabId)?.id ?? s.tabs[0]?.id ?? null
        : s.activeTabId,
    }));
  },

  toggleFavorite: async (id) => {
    const request = get().requests.find((r) => r.id === id);
    if (!request) return;
    const updated = await requestApi.update(id, { is_favorite: request.is_favorite ? 0 : 1 });
    set((s) => ({
      requests: s.requests.map((r) => (r.id === id ? updated : r)),
    }));
  },

  openNewTab: () => {
    const tab: RequestTab = {
      id: newTabId(),
      requestId: null,
      name: 'Untitled Request',
      method: 'GET',
      isDirty: false,
      data: createNewTabState(),
    };
    set((s) => ({ tabs: [...s.tabs, tab], activeTabId: tab.id, response: null }));
  },

  closeTab: (tabId) => {
    set((s) => {
      const tabs = s.tabs.filter((t) => t.id !== tabId);
      let activeTabId = s.activeTabId;
      if (s.activeTabId === tabId) {
        activeTabId = tabs.length > 0 ? tabs[tabs.length - 1].id : null;
      }
      return { tabs, activeTabId };
    });
    if (get().tabs.length === 0) get().openNewTab();
  },

  setActiveTab: (tabId) => set({ activeTabId: tabId, response: null }),

  updateTabData: (tabId, data) => {
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === tabId
          ? {
              ...t,
              isDirty: true,
              name: data.name ?? t.name,
              method: data.method ?? t.method,
              data: { ...t.data, ...data },
            }
          : t
      ),
    }));
  },

  saveCurrentTab: async () => {
    const { tabs, activeTabId, activeWorkspaceId } = get();
    const tab = tabs.find((t) => t.id === activeTabId);
    if (!tab || !activeWorkspaceId) return;

    const payload = editorStateToApiPayload(tab.data);

    if (tab.requestId) {
      const updated = await requestApi.update(tab.requestId, payload);
      set((s) => ({
        tabs: s.tabs.map((t) =>
          t.id === tab.id ? { ...t, isDirty: false, name: updated.name, method: updated.method } : t
        ),
        requests: s.requests.map((r) => (r.id === updated.id ? updated : r)),
      }));
    } else {
      const created = await requestApi.create({
        workspace_id: activeWorkspaceId,
        ...payload,
      });
      set((s) => ({
        tabs: s.tabs.map((t) =>
          t.id === tab.id
            ? { ...t, requestId: created.id, isDirty: false, name: created.name }
            : t
        ),
        requests: [...s.requests, created],
      }));
    }
  },

  sendRequest: async () => {
    const { tabs, activeTabId, activeWorkspaceId } = get();
    const tab = tabs.find((t) => t.id === activeTabId);
    if (!tab) return;

    set({ isSending: true, response: null, error: null });
    try {
      if (tab.isDirty || !tab.requestId) {
        await get().saveCurrentTab();
      }

      const currentTab = get().tabs.find((t) => t.id === activeTabId);
      if (!currentTab) return;

      const result = await requestApi.execute({
        ...currentTab.data,
        workspace_id: activeWorkspaceId ?? undefined,
        request_id: currentTab.requestId ?? undefined,
        save_history: true,
        variables: get().getActiveVariables(),
      });

      set({ response: result });
      if (activeWorkspaceId) {
        const history = await historyApi.getByWorkspace(activeWorkspaceId);
        set({ history });
      }
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ isSending: false });
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSidebarView: (view) => set({ sidebarView: view }),
  setShowCodeGen: (show, type) =>
    set({ showCodeGen: show, codeGenType: type ?? get().codeGenType }),
  clearError: () => set({ error: null }),

  createEnvironment: async (name) => {
    const { activeWorkspaceId } = get();
    if (!activeWorkspaceId) return;
    const env = await environmentApi.create(activeWorkspaceId, name);
    set((s) => ({ environments: [...s.environments, env] }));
  },

  updateEnvironment: async (id, data) => {
    const env = await environmentApi.update(id, data);
    set((s) => ({
      environments: s.environments.map((e) => (e.id === id ? env : e)),
    }));
  },

  deleteEnvironment: async (id) => {
    await environmentApi.delete(id);
    set((s) => ({ environments: s.environments.filter((e) => e.id !== id) }));
  },

  setActiveEnvironment: async (id) => {
    const { environments } = get();
    for (const env of environments) {
      if (env.is_active && env.id !== id) {
        await environmentApi.update(env.id, { is_active: 0 });
      }
    }
    await environmentApi.update(id, { is_active: 1 });
    if (get().activeWorkspaceId) {
      const updated = await environmentApi.getByWorkspace(get().activeWorkspaceId!);
      set({ environments: updated });
    }
  },

  getActiveVariables: () => {
    const env = get().environments.find((e) => e.is_active);
    if (!env) return {};
    const vars: Record<string, string> = {};
    env.variables.filter((v) => v.enabled && v.key).forEach((v) => {
      vars[v.key] = v.value;
    });
    return vars;
  },

  loadHistory: async () => {
    const { activeWorkspaceId } = get();
    if (!activeWorkspaceId) return;
    const history = await historyApi.getByWorkspace(activeWorkspaceId);
    set({ history });
  },

  clearHistory: async () => {
    const { activeWorkspaceId } = get();
    if (!activeWorkspaceId) return;
    await historyApi.clear(activeWorkspaceId);
    set({ history: [] });
  },
}));
