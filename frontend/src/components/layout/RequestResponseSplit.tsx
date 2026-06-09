import { useRef } from 'react';
import { useVerticalResize } from '@/hooks/useVerticalResize';
import { RequestBuilder } from '../request/RequestBuilder';
import { ResponseViewer } from '../response/ResponseViewer';

export function RequestResponseSplit() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { height, onResizeStart } = useVerticalResize(containerRef);

  return (
    <div ref={containerRef} className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 min-h-0 overflow-hidden">
        <RequestBuilder />
      </div>

      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize response panel"
        onMouseDown={onResizeStart}
        className="h-2 shrink-0 cursor-ns-resize border-t border-surface-200 bg-surface-50 hover:bg-accent/20 active:bg-accent/30 transition-colors group flex items-center justify-center select-none"
      >
        <div className="w-12 h-1 rounded-full bg-surface-300 group-hover:bg-accent/50 transition-colors" />
      </div>

      <div style={{ height }} className="shrink-0 flex flex-col min-h-0 overflow-hidden">
        <ResponseViewer />
      </div>
    </div>
  );
}
