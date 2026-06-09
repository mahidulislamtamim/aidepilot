import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useAppStore } from '@/store/useAppStore';
import { formatBytes, formatDuration, getStatusColor, tryFormatJson } from '@/utils/helpers';
import { Button } from '../ui/Button';

export function ResponseViewer() {
  const { response, isSending } = useAppStore();
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<'body' | 'headers'>('body');

  const copyResponse = async () => {
    if (!response) return;
    await navigator.clipboard.writeText(response.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isSending) {
    return (
      <div className="h-64 border-t border-surface-200 flex flex-col">
        <div className="px-4 py-2 border-b border-surface-200">
          <span className="text-xs text-gray-500">Response</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-500">Sending request...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="h-48 border-t border-surface-200 flex items-center justify-center">
        <p className="text-xs text-gray-600">Send a request to see the response</p>
      </div>
    );
  }

  const formattedBody = tryFormatJson(response.body);
  const isJson = formattedBody !== response.body || response.body.trim().startsWith('{') || response.body.trim().startsWith('[');

  return (
    <div className="h-72 border-t border-surface-200 flex flex-col shrink-0">
      {/* Response header bar */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-surface-200 bg-surface-50">
        <span className="text-xs text-gray-500">Response</span>
        <span className={`text-sm font-semibold font-mono ${getStatusColor(response.status)}`}>
          {response.status} {response.statusText}
        </span>
        <span className="text-xs text-gray-500">{formatDuration(response.responseTime)}</span>
        <span className="text-xs text-gray-500">{formatBytes(response.size)}</span>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex bg-surface-100 rounded-md p-0.5">
            <button
              className={`px-2.5 py-1 text-xs rounded ${view === 'body' ? 'bg-surface-200 text-white' : 'text-gray-500'}`}
              onClick={() => setView('body')}
            >
              Body
            </button>
            <button
              className={`px-2.5 py-1 text-xs rounded ${view === 'headers' ? 'bg-surface-200 text-white' : 'text-gray-500'}`}
              onClick={() => setView('headers')}
            >
              Headers
            </button>
          </div>
          <Button variant="ghost" size="sm" onClick={copyResponse}>
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      </div>

      {/* Response content */}
      <div className="flex-1 overflow-auto">
        {view === 'body' ? (
          isJson ? (
            <SyntaxHighlighter
              language="json"
              style={vscDarkPlus}
              customStyle={{ margin: 0, padding: '1rem', background: 'transparent', fontSize: '12px' }}
              showLineNumbers
            >
              {formattedBody}
            </SyntaxHighlighter>
          ) : (
            <pre className="p-4 text-xs font-mono text-gray-300 whitespace-pre-wrap break-all">{response.body}</pre>
          )
        ) : (
          <div className="p-4 space-y-1">
            {Object.entries(response.headers).map(([key, value]) => (
              <div key={key} className="flex gap-3 text-xs font-mono">
                <span className="text-accent shrink-0">{key}:</span>
                <span className="text-gray-400 break-all">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
