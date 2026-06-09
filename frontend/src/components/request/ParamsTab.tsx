import type { KeyValue } from '@/types';
import { KeyValueEditor } from '../ui/KeyValueEditor';

interface ParamsTabProps {
  params: KeyValue[];
  onChange: (params: KeyValue[]) => void;
}

export function ParamsTab({ params, onChange }: ParamsTabProps) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-3">Query parameters appended to the request URL.</p>
      <KeyValueEditor items={params} onChange={onChange} keyPlaceholder="Parameter" valuePlaceholder="Value" />
    </div>
  );
}
