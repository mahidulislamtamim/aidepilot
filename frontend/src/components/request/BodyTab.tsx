import type { BodyType, KeyValue } from '@/types';
import { tryFormatJson } from '@/utils/helpers';
import { KeyValueEditor } from '../ui/KeyValueEditor';
import { Button } from '../ui/Button';

interface BodyTabProps {
  bodyType: BodyType;
  body: string;
  onBodyTypeChange: (type: BodyType) => void;
  onBodyChange: (body: string) => void;
}

const BODY_TYPES: { value: BodyType; label: string }[] = [
  { value: 'json', label: 'JSON' },
  { value: 'form-data', label: 'Form Data' },
  { value: 'x-www-form-urlencoded', label: 'x-www-form-urlencoded' },
  { value: 'raw', label: 'Raw Text' },
];

export function BodyTab({ bodyType, body, onBodyTypeChange, onBodyChange }: BodyTabProps) {
  const isKeyValue = bodyType === 'form-data' || bodyType === 'x-www-form-urlencoded';

  let keyValueItems: KeyValue[] = [];
  if (isKeyValue) {
    try {
      keyValueItems = JSON.parse(body || '[]');
      if (!Array.isArray(keyValueItems)) keyValueItems = [];
    } catch {
      keyValueItems = [{ key: '', value: '', enabled: true }];
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {BODY_TYPES.map((bt) => (
          <button
            key={bt.value}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
              bodyType === bt.value
                ? 'bg-accent text-white'
                : 'bg-surface-100 text-gray-400 hover:text-white'
            }`}
            onClick={() => onBodyTypeChange(bt.value)}
          >
            {bt.label}
          </button>
        ))}
      </div>

      {isKeyValue ? (
        <KeyValueEditor
          items={keyValueItems.length ? keyValueItems : [{ key: '', value: '', enabled: true }]}
          onChange={(items) => onBodyChange(JSON.stringify(items))}
        />
      ) : (
        <div className="relative">
          {bodyType === 'json' && (
            <div className="absolute top-2 right-2 z-10">
              <Button variant="ghost" size="sm" onClick={() => onBodyChange(tryFormatJson(body))}>
                Format JSON
              </Button>
            </div>
          )}
          <textarea
            className="input font-mono text-sm min-h-[200px] resize-y"
            placeholder={bodyType === 'json' ? '{\n  "key": "value"\n}' : 'Request body...'}
            value={body}
            onChange={(e) => onBodyChange(e.target.value)}
            spellCheck={false}
          />
        </div>
      )}
    </div>
  );
}
