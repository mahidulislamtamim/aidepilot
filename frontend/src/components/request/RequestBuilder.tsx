import { Code, Save, Send, Star } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { BodyType, HttpMethod } from '@/types';
import { Button } from '../ui/Button';
import { AuthTab } from './AuthTab';
import { BodyTab } from './BodyTab';
import { HeadersTab } from './HeadersTab';
import { ParamsTab } from './ParamsTab';
import { SettingsTab } from './SettingsTab';
import { useState } from 'react';

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const REQUEST_TABS = ['Params', 'Headers', 'Body', 'Auth', 'Settings'] as const;

export function RequestBuilder() {
  const { tabs, activeTabId, updateTabData, sendRequest, saveCurrentTab, isSending, setShowCodeGen } =
    useAppStore();
  const [activeSection, setActiveSection] = useState<(typeof REQUEST_TABS)[number]>('Params');

  const tab = tabs.find((t) => t.id === activeTabId);
  if (!tab) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-600">
        <p>Open or create a request to get started</p>
      </div>
    );
  }

  const { data } = tab;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {isSending && <div className="loading-bar" />}

      {/* URL bar */}
      <div className="flex items-center gap-2 p-3 border-b border-surface-200">
        <select
          className="select w-28 font-mono font-semibold text-sm"
          value={data.method}
          onChange={(e) => updateTabData(tab.id, { method: e.target.value as HttpMethod })}
        >
          {METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <input
          className="input flex-1 font-mono text-sm"
          placeholder="https://api.example.com/endpoint"
          value={data.url}
          onChange={(e) => updateTabData(tab.id, { url: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && sendRequest()}
        />
        <Button
          variant="ghost"
          size="sm"
          title="Toggle Favorite"
          onClick={() => updateTabData(tab.id, { is_favorite: !data.is_favorite })}
        >
          <Star size={16} className={data.is_favorite ? 'text-amber-400' : ''} fill={data.is_favorite ? 'currentColor' : 'none'} />
        </Button>
        <Button variant="ghost" size="sm" title="Code Generation" onClick={() => setShowCodeGen(true, 'curl')}>
          <Code size={16} />
        </Button>
        <Button variant="secondary" size="sm" onClick={saveCurrentTab} title="Save (Ctrl+S)">
          <Save size={14} />
        </Button>
        <Button variant="primary" onClick={sendRequest} disabled={isSending || !data.url} title="Send (Ctrl+Enter)">
          <Send size={14} />
          {isSending ? 'Sending...' : 'Send'}
        </Button>
      </div>

      {/* Request name */}
      <div className="px-3 py-2 border-b border-surface-200">
        <input
          className="input text-sm font-medium"
          placeholder="Request name"
          value={data.name}
          onChange={(e) => updateTabData(tab.id, { name: e.target.value })}
        />
      </div>

      {/* Section tabs */}
      <div className="flex border-b border-surface-200 px-3">
        {REQUEST_TABS.map((section) => (
          <button
            key={section}
            className={`px-4 py-2 text-xs font-medium transition-colors ${
              activeSection === section
                ? 'text-accent border-b-2 border-accent'
                : 'text-gray-500 hover:text-gray-300'
            }`}
            onClick={() => setActiveSection(section)}
          >
            {section}
          </button>
        ))}
      </div>

      {/* Section content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeSection === 'Params' && (
          <ParamsTab
            params={data.params}
            onChange={(params) => updateTabData(tab.id, { params })}
          />
        )}
        {activeSection === 'Headers' && (
          <HeadersTab
            headers={data.headers}
            onChange={(headers) => updateTabData(tab.id, { headers })}
          />
        )}
        {activeSection === 'Body' && (
          <BodyTab
            bodyType={data.body_type}
            body={data.body}
            onBodyTypeChange={(body_type: BodyType) => updateTabData(tab.id, { body_type })}
            onBodyChange={(body) => updateTabData(tab.id, { body })}
          />
        )}
        {activeSection === 'Auth' && (
          <AuthTab
            authType={data.auth_type}
            authToken={data.auth_token}
            onAuthTypeChange={(auth_type) => updateTabData(tab.id, { auth_type })}
            onAuthTokenChange={(auth_token) => updateTabData(tab.id, { auth_token })}
          />
        )}
        {activeSection === 'Settings' && (
          <SettingsTab
            timeout={data.timeout}
            retryCount={data.retry_count}
            onTimeoutChange={(timeout) => updateTabData(tab.id, { timeout })}
            onRetryChange={(retry_count) => updateTabData(tab.id, { retry_count })}
          />
        )}
      </div>
    </div>
  );
}
