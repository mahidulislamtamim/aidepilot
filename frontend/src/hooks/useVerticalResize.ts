import { useCallback, useRef, useState } from 'react';

const STORAGE_KEY = 'aidepilot-response-height';

interface UseVerticalResizeOptions {
  defaultHeight?: number;
  minHeight?: number;
  minOppositeHeight?: number;
}

export function useVerticalResize(
  containerRef: React.RefObject<HTMLElement | null>,
  { defaultHeight = 288, minHeight = 120, minOppositeHeight = 200 }: UseVerticalResizeOptions = {}
) {
  const [height, setHeight] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? parseInt(saved, 10) : defaultHeight;
    return Number.isFinite(parsed) ? parsed : defaultHeight;
  });

  const heightRef = useRef(height);
  heightRef.current = height;

  const onResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startY = e.clientY;
      const startHeight = heightRef.current;

      const onMove = (moveEvent: MouseEvent) => {
        const containerHeight = containerRef.current?.clientHeight ?? window.innerHeight;
        const maxHeight = containerHeight - minOppositeHeight;
        const next = Math.max(minHeight, Math.min(maxHeight, startHeight + (startY - moveEvent.clientY)));
        heightRef.current = next;
        setHeight(next);
      };

      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        localStorage.setItem(STORAGE_KEY, String(heightRef.current));
      };

      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [containerRef, minHeight, minOppositeHeight]
  );

  return { height, onResizeStart };
}
