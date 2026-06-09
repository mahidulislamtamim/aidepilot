import { AlertCircle, CheckCircle, Info, LayoutPanelTop, MessageSquare, X } from 'lucide-react';
import type { AlertDisplay, AlertType } from '@/store/useAppStore';
import { useAppStore } from '@/store/useAppStore';
import { Modal } from './Modal';

const alertStyles: Record<AlertType, { icon: typeof AlertCircle; className: string }> = {
  error: { icon: AlertCircle, className: 'text-red-400 bg-red-500/10 border-red-500/30' },
  success: { icon: CheckCircle, className: 'text-green-400 bg-green-500/10 border-green-500/30' },
  warning: { icon: AlertCircle, className: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  info: { icon: Info, className: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
};

function AlertContent({
  type,
  title,
  message,
  onClose,
  display,
  onToggleDisplay,
}: {
  type: AlertType;
  title?: string;
  message: string;
  onClose: () => void;
  display: AlertDisplay;
  onToggleDisplay: () => void;
}) {
  const { icon: Icon } = alertStyles[type];

  return (
    <>
      <div className="flex items-start gap-3">
        <Icon size={18} className="shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          {title && <p className="font-medium text-white mb-0.5">{title}</p>}
          <p className="text-sm leading-relaxed">{message}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onToggleDisplay}
            className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
            title={display === 'toast' ? 'Switch to popup' : 'Switch to toast'}
          >
            {display === 'toast' ? <LayoutPanelTop size={14} /> : <MessageSquare size={14} />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </>
  );
}

export function AlertContainer() {
  const { alert, alertDisplay, clearAlert, setAlertDisplay } = useAppStore();

  if (!alert) return null;

  const toggleDisplay = () => {
    setAlertDisplay(alertDisplay === 'toast' ? 'popup' : 'toast');
  };

  if (alertDisplay === 'popup') {
    return (
      <Modal isOpen onClose={clearAlert} title={alert.title ?? 'Notification'} size="sm">
        <div className={`rounded-lg border p-4 ${alertStyles[alert.type].className}`}>
          <AlertContent
            type={alert.type}
            title={undefined}
            message={alert.message}
            onClose={clearAlert}
            display={alertDisplay}
            onToggleDisplay={toggleDisplay}
          />
        </div>
      </Modal>
    );
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 border rounded-lg px-4 py-3 text-sm max-w-md shadow-xl ${alertStyles[alert.type].className}`}
    >
      <AlertContent
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={clearAlert}
        display={alertDisplay}
        onToggleDisplay={toggleDisplay}
      />
    </div>
  );
}
