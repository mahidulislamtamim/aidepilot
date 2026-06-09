import type { KeyValue } from '@/types';
import { KeyValueEditor } from '../ui/KeyValueEditor';

interface HeadersTabProps {
  headers: KeyValue[];
  onChange: (headers: KeyValue[]) => void;
}

export function HeadersTab({ headers, onChange }: HeadersTabProps) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-3">HTTP headers sent with the request.</p>
      <KeyValueEditor items={headers} onChange={onChange} keyPlaceholder="Header" valuePlaceholder="Value" />
    </div>
  );
}
