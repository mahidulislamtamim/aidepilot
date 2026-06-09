import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { generateAxios, generateCurl, generateFetch } from '@/utils/codeGen';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export function CodeGenModal() {
  const { showCodeGen, codeGenType, setShowCodeGen, tabs, activeTabId } = useAppStore();
  const [copied, setCopied] = useState(false);

  const tab = tabs.find((t) => t.id === activeTabId);
  if (!tab) return null;

  const generators = {
    curl: generateCurl,
    fetch: generateFetch,
    axios: generateAxios,
  };

  const code = generators[codeGenType](tab.data);

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={showCodeGen} onClose={() => setShowCodeGen(false)} title="Code Generation" size="lg">
      <div className="flex gap-1 mb-4">
        {(['curl', 'fetch', 'axios'] as const).map((type) => (
          <button
            key={type}
            className={`px-3 py-1.5 text-xs rounded-md capitalize ${
              codeGenType === type ? 'bg-accent text-white' : 'bg-surface-100 text-gray-400 hover:text-white'
            }`}
            onClick={() => setShowCodeGen(true, type)}
          >
            {type === 'curl' ? 'cURL' : type === 'fetch' ? 'Fetch API' : 'Axios'}
          </button>
        ))}
      </div>

      <div className="relative">
        <pre className="bg-surface p-4 rounded-lg text-xs font-mono text-gray-300 overflow-x-auto max-h-80 whitespace-pre-wrap">
          {code}
        </pre>
        <Button variant="secondary" size="sm" className="absolute top-2 right-2" onClick={copyCode}>
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
    </Modal>
  );
}
