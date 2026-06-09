import type { AuthType } from '@/types';

interface AuthTabProps {
  authType: AuthType;
  authToken: string;
  onAuthTypeChange: (type: AuthType) => void;
  onAuthTokenChange: (token: string) => void;
}

export function AuthTab({ authType, authToken, onAuthTypeChange, onAuthTokenChange }: AuthTabProps) {
  return (
    <div className="max-w-lg space-y-4">
      <div>
        <label className="text-xs text-gray-500 mb-1.5 block">Authentication Type</label>
        <select
          className="select"
          value={authType}
          onChange={(e) => onAuthTypeChange(e.target.value as AuthType)}
        >
          <option value="none">No Auth</option>
          <option value="bearer">Bearer Token</option>
        </select>
      </div>

      {authType === 'bearer' && (
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">Token</label>
          <input
            className="input font-mono"
            type="password"
            placeholder="Enter bearer token or {{variable}}"
            value={authToken}
            onChange={(e) => onAuthTokenChange(e.target.value)}
          />
          <p className="text-xs text-gray-600 mt-1.5">
            Use {'{{variable_name}}'} to reference environment variables.
          </p>
        </div>
      )}
    </div>
  );
}
