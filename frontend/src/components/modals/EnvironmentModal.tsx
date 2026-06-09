import { Plus, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { EnvironmentVariable } from '@/types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface EnvironmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  environmentId: string | null;
}

export function EnvironmentModal({ isOpen, onClose, environmentId }: EnvironmentModalProps) {
  const { environments, updateEnvironment } = useAppStore();
  const env = environments.find((e) => e.id === environmentId);

  if (!env) return null;

  const updateVariables = (variables: EnvironmentVariable[]) => {
    updateEnvironment(env.id, { variables });
  };

  const updateVar = (index: number, field: keyof EnvironmentVariable, value: string | boolean) => {
    const next = env.variables.map((v, i) => (i === index ? { ...v, [field]: value } : v));
    updateVariables(next);
  };

  const addVar = () => updateVariables([...env.variables, { key: '', value: '', enabled: true }]);

  const removeVar = (index: number) => {
    updateVariables(env.variables.filter((_, i) => i !== index));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Environment: ${env.name}`} size="lg">
      <div className="space-y-1">
        <div className="grid grid-cols-[28px_1fr_1fr_32px] gap-2 px-1 text-xs text-gray-500 font-medium mb-2">
          <span />
          <span>Variable</span>
          <span>Value</span>
          <span />
        </div>
        {env.variables.map((v, i) => (
          <div key={i} className="grid grid-cols-[28px_1fr_1fr_32px] gap-2 items-center">
            <input
              type="checkbox"
              checked={v.enabled}
              onChange={(e) => updateVar(i, 'enabled', e.target.checked)}
              className="w-4 h-4 rounded accent-accent justify-self-center"
            />
            <input
              className="input"
              placeholder="Variable name"
              value={v.key}
              onChange={(e) => updateVar(i, 'key', e.target.value)}
            />
            <input
              className="input"
              placeholder="Value"
              value={v.value}
              onChange={(e) => updateVar(i, 'value', e.target.value)}
            />
            <Button variant="ghost" size="sm" onClick={() => removeVar(i)} className="!p-1">
              <Trash2 size={14} />
            </Button>
          </div>
        ))}
        <Button variant="ghost" size="sm" onClick={addVar} className="mt-2">
          <Plus size={14} /> Add Variable
        </Button>
      </div>
      <p className="text-xs text-gray-600 mt-4">
        Use {'{{variable_name}}'} in URLs, headers, and body to reference these values.
      </p>
    </Modal>
  );
}
