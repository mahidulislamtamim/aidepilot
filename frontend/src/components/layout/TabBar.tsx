import { Plus, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { getMethodColor } from '@/utils/helpers';

export function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab, openNewTab } = useAppStore();

  return (
    <div className="flex items-center bg-surface-50 border-b border-surface-200 overflow-x-auto shrink-0">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`group flex items-center gap-2 px-4 py-2.5 text-xs border-r border-surface-200 shrink-0 transition-colors ${
            activeTabId === tab.id ? 'tab-active' : 'text-gray-500 hover:text-gray-300 hover:bg-surface-100'
          }`}
          onClick={() => setActiveTab(tab.id)}
        >
          <span className={`font-mono font-semibold ${getMethodColor(tab.method)}`}>{tab.method}</span>
          <span className="max-w-[120px] truncate">
            {tab.name}
            {tab.isDirty && <span className="text-accent ml-0.5">•</span>}
          </span>
          <X
            size={12}
            className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              closeTab(tab.id);
            }}
          />
        </button>
      ))}
      <button
        className="px-3 py-2.5 text-gray-500 hover:text-white hover:bg-surface-100 transition-colors shrink-0"
        onClick={openNewTab}
        title="New Tab (Ctrl+T)"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
