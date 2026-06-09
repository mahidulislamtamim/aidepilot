import { Plus, Trash2 } from 'lucide-react';
import type { KeyValue } from '@/types';
import { Button } from './Button';

interface KeyValueEditorProps {
  items: KeyValue[];
  onChange: (items: KeyValue[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

export function KeyValueEditor({
  items,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
}: KeyValueEditorProps) {
  const update = (index: number, field: keyof KeyValue, value: string | boolean) => {
    const next = items.map((item, i) => (i === index ? { ...item, [field]: value } : item));
    onChange(next);
  };

  const add = () => onChange([...items, { key: '', value: '', enabled: true }]);

  const remove = (index: number) => {
    if (items.length === 1) {
      onChange([{ key: '', value: '', enabled: true }]);
    } else {
      onChange(items.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-[28px_1fr_1fr_32px] gap-2 px-1 text-xs text-gray-500 font-medium">
        <span />
        <span>{keyPlaceholder}</span>
        <span>{valuePlaceholder}</span>
        <span />
      </div>
      {items.map((item, i) => (
        <div key={i} className="grid grid-cols-[28px_1fr_1fr_32px] gap-2 items-center">
          <input
            type="checkbox"
            checked={item.enabled}
            onChange={(e) => update(i, 'enabled', e.target.checked)}
            className="w-4 h-4 rounded accent-accent cursor-pointer justify-self-center"
          />
          <input
            className="input"
            placeholder={keyPlaceholder}
            value={item.key}
            onChange={(e) => update(i, 'key', e.target.value)}
          />
          <input
            className="input"
            placeholder={valuePlaceholder}
            value={item.value}
            onChange={(e) => update(i, 'value', e.target.value)}
          />
          <Button variant="ghost" size="sm" onClick={() => remove(i)} className="!p-1">
            <Trash2 size={14} />
          </Button>
        </div>
      ))}
      <Button variant="ghost" size="sm" onClick={add} className="mt-2">
        <Plus size={14} /> Add
      </Button>
    </div>
  );
}
