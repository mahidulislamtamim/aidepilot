interface SettingsTabProps {
  timeout: number;
  retryCount: number;
  onTimeoutChange: (timeout: number) => void;
  onRetryChange: (retry: number) => void;
}

export function SettingsTab({ timeout, retryCount, onTimeoutChange, onRetryChange }: SettingsTabProps) {
  return (
    <div className="max-w-lg space-y-4">
      <div>
        <label className="text-xs text-gray-500 mb-1.5 block">Request Timeout (ms)</label>
        <input
          className="input"
          type="number"
          min={1000}
          max={300000}
          step={1000}
          value={timeout}
          onChange={(e) => onTimeoutChange(parseInt(e.target.value) || 30000)}
        />
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1.5 block">Retry Count</label>
        <input
          className="input"
          type="number"
          min={0}
          max={5}
          value={retryCount}
          onChange={(e) => onRetryChange(parseInt(e.target.value) || 0)}
        />
        <p className="text-xs text-gray-600 mt-1.5">Number of retries on failure (0 = no retry).</p>
      </div>
    </div>
  );
}
