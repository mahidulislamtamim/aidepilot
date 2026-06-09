import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { formatBytes, formatDuration, getStatusColor } from '@/utils/helpers';
import {
  BODY_FORMAT_LABELS,
  detectDefaultFormat,
  getContentType,
  type ResponseBodyFormat,
} from '@/utils/responseFormat';
import { Button } from '../ui/Button';
import { ResponseBody } from './ResponseBody';

type TopView = 'body' | 'headers';

const BODY_FORMATS: ResponseBodyFormat[] = ['preview', 'json', 'xml', 'raw', 'text'];

export function ResponseViewer() {
  const { response, isSending } = useAppStore();
  const [copied, setCopied] = useState(false);
  const [topView, setTopView] = useState<TopView>('body');
  const [bodyFormat, setBodyFormat] = useState<ResponseBodyFormat>('json');

  useEffect(() => {
    if (response) {
      const contentType = getContentType(response.headers);
      setBodyFormat(detectDefaultFormat(contentType, response.body));
      setTopView('body');
    }
  }, [response]);

  const copyResponse = async () => {
    if (!response) return;
    await navigator.clipboard.writeText(response.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isSending) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-2 border-b border-surface-200 shrink-0">
          <span className="text-xs text-gray-500">Response</span>
        </div>
        <div className="flex-1 flex items-center justify-center min-h-0">
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
      <div className="h-full flex items-center justify-center">
        <p className="text-xs text-gray-600">Send a request to see the response</p>
      </div>
    );
  }

  const contentType = getContentType(response.headers);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-4 px-4 py-2 border-b border-surface-200 bg-surface-50 shrink-0 flex-wrap">
        <span className="text-xs text-gray-500">Response</span>
        <span className={`text-sm font-semibold font-mono ${getStatusColor(response.status)}`}>
          {response.status} {response.statusText}
        </span>
        <span className="text-xs text-gray-500">{formatDuration(response.responseTime)}</span>
        <span className="text-xs text-gray-500">{formatBytes(response.size)}</span>
        {contentType && (
          <span className="text-xs text-gray-600 font-mono truncate max-w-[180px]" title={contentType}>
            {contentType}
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          <div className="flex bg-surface-100 rounded-md p-0.5">
            <button
              className={`px-2.5 py-1 text-xs rounded ${topView === 'body' ? 'bg-surface-200 text-white' : 'text-gray-500'}`}
              onClick={() => setTopView('body')}
            >
              Body
            </button>
            <button
              className={`px-2.5 py-1 text-xs rounded ${topView === 'headers' ? 'bg-surface-200 text-white' : 'text-gray-500'}`}
              onClick={() => setTopView('headers')}
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

      {topView === 'body' && (
        <div className="flex items-center gap-1 px-4 py-1.5 border-b border-surface-200 bg-surface shrink-0 overflow-x-auto">
          {BODY_FORMATS.map((fmt) => (
            <button
              key={fmt}
              className={`px-2.5 py-1 text-xs rounded whitespace-nowrap transition-colors ${
                bodyFormat === fmt
                  ? 'bg-accent/20 text-accent font-medium'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-surface-100'
              }`}
              onClick={() => setBodyFormat(fmt)}
            >
              {BODY_FORMAT_LABELS[fmt]}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-auto min-h-0">
        {topView === 'body' ? (
          <ResponseBody body={response.body} contentType={contentType} format={bodyFormat} />
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
